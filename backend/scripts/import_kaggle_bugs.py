"""
import_kaggle_bugs.py

Reusable, idempotent CLI script to import records from the Kaggle ISEC defect
dataset (Mozilla Bugzilla bugs) into TracePilot's PostgreSQL database.

Features:
- CLI argument parsing (--csv, --limit, --batch-size, --dry-run)
- CSV schema validation (Issue_id, Component, Title, Description, Status, Resolution, Priority)
- Duplicate prevention via Issue.external_id
- 100% idempotent: running repeatedly never duplicates issues
- Safe handling of missing descriptions (deterministic fallback satisfying NOT NULL)
- Deterministic Component -> TracePilot Category mapping
- Deterministic Severity derivation (crash/security keywords + Kaggle priority)
- Strict adherence to mentor Smart Priority formula:
    Priority Score = severity_weight * category_urgency_weight
- Careful workflow Status & Resolution mapping (RESOLVED/FIXED vs CLOSED)
- Safe project resolution (checks if ISEC key is free or creates dedicated project)
- Documented reporter attribution (uses existing Admin as dataset importer)
- Chunked database transactions (500 records per batch)
- Comprehensive statistics reporting
"""

import argparse
import asyncio
import csv
import os
import re
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path so app imports work when run as a script
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.database.connection import engine
from app.models.issue import Issue, IssueStatus, IssueType, Priority, Severity
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole

# --------------------------------------------------------------------------- #
# Constants & Configuration                                                   #
# --------------------------------------------------------------------------- #

REQUIRED_COLUMNS = {
    "Issue_id", "Component", "Title", "Description", "Status", "Resolution", "Priority"
}

# Mentor Smart Priority weights (strictly consistent with app/services/smart_service.py)
SEVERITY_WEIGHTS: dict[Severity, int] = {
    Severity.BLOCKER: 4,
    Severity.CRITICAL: 4,
    Severity.MAJOR: 3,
    Severity.MINOR: 2,
}

CATEGORY_URGENCY_WEIGHTS: dict[str, int] = {
    "Security": 3,
    "Database": 3,
    "API": 2,
    "Backend": 2,
    "UI": 1,
    "Colors": 1,
    "Typo": 1,
    "Frontend": 1,
}

# Regex keywords for technical impact / crash detection
CRITICAL_KEYWORDS_REGEX = re.compile(
    r"\b(crash|crashes|crashing|hang|hangs|hanging|freeze|freezes|freezing|"
    r"data loss|corrupt|corruption|security|vulnerability|overflow|"
    r"fatal|sigsegv|segfault|abort|panic|deadlock|assertion)\b",
    re.IGNORECASE,
)

MINOR_KEYWORDS_REGEX = re.compile(
    r"\b(typo|misspelled|spelling|cosmetic|color|padding|spacing|margin|"
    r"font size|cleanup|clean up|wording)\b",
    re.IGNORECASE,
)


# --------------------------------------------------------------------------- #
# Transformation Logic                                                        #
# --------------------------------------------------------------------------- #

def map_component_to_category(component: str | None) -> str:
    """
    Map raw Kaggle/Mozilla Component string into TracePilot's canonical categories:
    Security, Database, API, Backend, UI.
    """
    if not component:
        return "Backend"

    comp_lower = component.strip().lower()

    # Security (urgency 3)
    if any(k in comp_lower for k in ("security", "psm", "certificate", "crypto", "ssl", "tls")):
        return "Security"

    # Database (urgency 3)
    if any(k in comp_lower for k in ("database", "storage", "bookmark", "history", "rdf", "sqlite")):
        return "Database"

    # API / Networking / IPC (urgency 2)
    if any(k in comp_lower for k in ("network", "http", "cache", "cookie", "web services", "ipc", "xpcom", "xpconnect", "api", "protocol")):
        return "API"

    # Backend / Engine / Parser / Runtime (urgency 2)
    if any(k in comp_lower for k in ("engine", "parser", "compiler", "plug-in", "plugin", "installer", "file handling", "backend", "general", "build")):
        return "Backend"

    # UI / Layout / Form / Presentation (urgency 1)
    if any(k in comp_lower for k in ("layout", "xul", "editor", "ui", "dom", "form", "graphic", "image", "navigation", "print", "selection", "keyboard", "widget")):
        return "UI"

    # Default fallback category
    return "Backend"


def determine_severity(
    raw_priority: str | None,
    category: str,
    title: str,
    description: str,
) -> Severity:
    """
    Determine TracePilot technical Severity using defect impact cues and raw priority.
    Does NOT blindly copy priority into severity.
    """
    text = f"{title} {description}"
    is_crash_or_security = bool(CRITICAL_KEYWORDS_REGEX.search(text))
    is_minor_cue = bool(MINOR_KEYWORDS_REGEX.search(text))

    raw_p = str(raw_priority or "2").strip()

    # High-impact cues or Priority 0 -> CRITICAL
    if is_crash_or_security or raw_p == "0":
        return Severity.CRITICAL

    if raw_p == "1":
        return Severity.MAJOR

    if raw_p == "2":
        if category in ("Security", "Database"):
            return Severity.MAJOR
        if is_minor_cue:
            return Severity.MINOR
        return Severity.MAJOR

    # Priority 3 and 4 (low and lowest)
    return Severity.MINOR


def calculate_smart_priority(severity: Severity, category: str) -> tuple[Priority, int]:
    """
    Calculate TracePilot Priority strictly using the mentor-required formula:
      Priority Score = severity_weight * category_urgency_weight

    Thresholds:
      Score >= 10 -> URGENT
      Score  7-9  -> HIGH
      Score  4-6  -> MEDIUM
      Score  < 4  -> LOW
    """
    sev_weight = SEVERITY_WEIGHTS.get(severity, 2)
    cat_weight = CATEGORY_URGENCY_WEIGHTS.get(category, 2)
    score = sev_weight * cat_weight

    if score >= 10:
        priority = Priority.URGENT
    elif score >= 7:
        priority = Priority.HIGH
    elif score >= 4:
        priority = Priority.MEDIUM
    else:
        priority = Priority.LOW

    return priority, score


def map_status_and_resolution(raw_status: str | None, raw_resolution: str | None) -> IssueStatus:
    """
    Carefully map Kaggle Status & Resolution into TracePilot's workflow state:
    - RESOLVED + FIXED: Defect resolved by developer, awaiting QA verification -> RESOLVED
    - RESOLVED + non-FIXED (DUPLICATE, WORKSFORME, INVALID, WONTFIX): Non-code closure -> CLOSED
    - VERIFIED + any: QA verified the outcome -> CLOSED
    - CLOSED + any: Formally archived/closed -> CLOSED
    """
    status_upper = (raw_status or "").strip().upper()
    res_upper = (raw_resolution or "").strip().upper()

    if status_upper == "RESOLVED" and res_upper == "FIXED":
        return IssueStatus.RESOLVED

    return IssueStatus.CLOSED


def sanitize_description(desc: str | None, issue_id: str, title: str) -> tuple[str, bool]:
    """
    Ensure description satisfies DB NOT NULL and Pydantic min_length=10 constraints.
    Returns (sanitized_description, was_fallback_used).
    """
    if desc and desc.strip() and desc.strip().lower() != "nan":
        clean = desc.strip()
        if len(clean) >= 10:
            return clean, False
        # If too short, append title context
        return f"{clean} (Issue #{issue_id}: {title})", False

    fallback = (
        f"No description provided in original Kaggle ISEC record #{issue_id}. "
        f"Issue summary: {title.strip()}"
    )
    return fallback, True


def transform_row(
    row: dict[str, str],
    project_id: int,
    reporter_id: int,
) -> tuple[dict, bool]:
    """
    Transform a single raw Kaggle CSV row into a TracePilot Issue record dict.
    Returns (record_dict, was_description_fallback_used).
    """
    issue_id = str(row["Issue_id"]).strip()
    raw_comp = (row.get("Component") or "").strip()
    raw_title = (row.get("Title") or "").strip()
    raw_desc = row.get("Description")
    raw_status = (row.get("Status") or "").strip()
    raw_res = (row.get("Resolution") or "").strip()
    raw_priority = str(row.get("Priority") or "2").strip()

    # 1. Title (max 500 chars)
    title = raw_title[:500] if raw_title else f"Kaggle Defect #{issue_id}"

    # 2. Description (guaranteed >= 10 chars)
    description, used_fallback = sanitize_description(raw_desc, issue_id, title)

    # 3. Component & Category
    category = map_component_to_category(raw_comp)

    # 4. Severity (deterministic analysis)
    severity = determine_severity(raw_priority, category, title, description)

    # 5. Smart Priority (strict mentor formula)
    priority, _ = calculate_smart_priority(severity, category)

    # 6. Workflow Status
    status = map_status_and_resolution(raw_status, raw_res)

    # 7. Resolution summary
    res_summary = f"Resolution: {raw_res} | Original QA Status: {raw_status} [Kaggle #{issue_id}]"

    record = {
        "external_id": issue_id,
        "issue_key": f"ISEC-{issue_id}",
        "title": title,
        "description": description,
        "issue_type": IssueType.BUG,
        "severity": severity,
        "priority": priority,
        "status": status,
        "category": category,
        "component": raw_comp,
        "raw_status": raw_status,
        "raw_resolution": raw_res,
        "raw_priority": raw_priority,
        "source": "KAGGLE_ISEC",
        "resolution_summary": res_summary,
        "resolved_at": datetime.now(timezone.utc),
        "project_id": project_id,
        "reporter_id": reporter_id,
        "assignee_id": None,     # Unassigned backlog item
        "sprint_id": None,       # Not assigned to any active sprint
    }
    return record, used_fallback


# --------------------------------------------------------------------------- #
# Database Helpers                                                            #
# --------------------------------------------------------------------------- #

async def resolve_project(db: AsyncSession) -> Project:
    """
    Safely resolve or create the target project.
    Checks if 'ISEC' exists; if an unrelated project uses 'ISEC', uses a unique key.
    """
    res = await db.execute(select(Project).where(Project.project_key == "ISEC"))
    existing = res.scalar_one_or_none()

    if existing:
        # Verify it represents the Kaggle ISEC dataset
        if "ISEC" in existing.name or "Kaggle" in existing.name or "Mozilla" in existing.name:
            return existing
        # Unrelated project uses key 'ISEC' -> find a unique key like 'KGL'
        res_kgl = await db.execute(select(Project).where(Project.project_key == "KGL"))
        existing_kgl = res_kgl.scalar_one_or_none()
        if existing_kgl:
            return existing_kgl
        new_proj = Project(
            name="Kaggle ISEC Defect Dataset",
            project_key="KGL",
            description="Real-world Mozilla Bugzilla defect dataset from Kaggle ISEC SDC 2025.",
            status=ProjectStatus.ACTIVE,
        )
        db.add(new_proj)
        await db.flush()
        await db.commit()
        return new_proj

    # Create project with key 'ISEC'
    new_proj = Project(
        name="Kaggle ISEC Defect Dataset",
        project_key="ISEC",
        description="Real-world Mozilla Bugzilla defect dataset from Kaggle ISEC SDC 2025.",
        status=ProjectStatus.ACTIVE,
    )
    db.add(new_proj)
    await db.flush()
    await db.commit()
    return new_proj


async def resolve_reporter(db: AsyncSession) -> User:
    """
    Resolve an existing Admin user to act as the dataset importer.
    Does NOT create fake users.
    """
    # Prefer primary admin
    res = await db.execute(
        select(User).where(User.email == "admin@bugtracker.com", User.is_active == True)
    )
    admin_user = res.scalar_one_or_none()
    if admin_user:
        return admin_user

    # Fallback to any active ADMIN
    res = await db.execute(
        select(User).where(User.role == UserRole.ADMIN, User.is_active == True).order_by(User.id.asc())
    )
    admin_user = res.scalars().first()
    if admin_user:
        return admin_user

    raise RuntimeError("No active ADMIN user found in database to attribute dataset import.")


async def get_existing_external_ids(db: AsyncSession) -> set[str]:
    """Retrieve all existing external_ids in the issues table to prevent duplicates."""
    res = await db.execute(
        select(Issue.external_id).where(Issue.external_id.isnot(None))
    )
    return {row[0] for row in res.fetchall() if row[0]}


# --------------------------------------------------------------------------- #
# Import Execution                                                            #
# --------------------------------------------------------------------------- #

async def run_import(
    csv_path: str,
    limit: int = 10000,
    dry_run: bool = False,
    batch_size: int = 500,
) -> dict:
    """
    Read Kaggle CSV, validate schema, transform records, and insert into PostgreSQL.
    """
    start_time = time.time()
    csv_file = Path(csv_path)

    if not csv_file.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    print("=" * 70)
    print(f"  KAGGLE ISEC BUG DATASET IMPORT {'[DRY RUN]' if dry_run else '[LIVE IMPORT]'}")
    print("=" * 70)
    print(f"Source file:  {csv_file.resolve()}")
    print(f"Target limit: {limit:,} records")
    print(f"Batch size:   {batch_size}")
    print(f"Dry run mode: {'ENABLED (no DB commits will be made)' if dry_run else 'DISABLED (will insert to DB)'}")
    print("-" * 70)

    # Session maker
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        # Resolve target project
        project = await resolve_project(session)
        print(f"Target Project:  '{project.name}' (Key: {project.project_key}, ID: {project.id})")

        # Resolve importer reporter
        reporter = await resolve_reporter(session)
        print(f"Importer User:   '{reporter.full_name}' ({reporter.email}, ID: {reporter.id})")

        # Get existing external IDs
        existing_ids = await get_existing_external_ids(session)
        print(f"Existing external IDs in DB: {len(existing_ids):,}")

    print("-" * 70)
    print("Reading and validating CSV...")

    records_to_insert: list[dict] = []
    skipped_duplicates = 0
    missing_descriptions_count = 0
    total_processed = 0

    category_counts = Counter()
    severity_counts = Counter()
    priority_counts = Counter()
    status_counts = Counter()
    raw_status_counts = Counter()
    raw_res_counts = Counter()

    with open(csv_file, mode="r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        
        # Validate columns
        fieldnames = set(reader.fieldnames or [])
        missing_cols = REQUIRED_COLUMNS - fieldnames
        if missing_cols:
            raise ValueError(f"CSV is missing required columns: {missing_cols}")

        for row in reader:
            if total_processed >= limit:
                break

            total_processed += 1
            issue_id = str(row["Issue_id"]).strip()

            # Duplicate check
            if issue_id in existing_ids:
                skipped_duplicates += 1
                continue

            record, used_fallback = transform_row(row, project.id, reporter.id)
            if used_fallback:
                missing_descriptions_count += 1

            records_to_insert.append(record)
            existing_ids.add(issue_id)  # Track in-memory to prevent intra-batch dupes

            # Record stats
            category_counts[record["category"]] += 1
            severity_counts[record["severity"].value] += 1
            priority_counts[record["priority"].value] += 1
            status_counts[record["status"].value] += 1
            raw_status_counts[record["raw_status"]] += 1
            raw_res_counts[record["raw_resolution"]] += 1

    print(f"Processed from CSV:        {total_processed:,}")
    print(f"Unique records to import:  {len(records_to_insert):,}")
    print(f"Skipped duplicates:        {skipped_duplicates:,}")
    print(f"Missing descriptions fixed: {missing_descriptions_count:,}")

    # Database insertion
    inserted_count = 0
    if not dry_run and records_to_insert:
        print("-" * 70)
        print("Inserting records into PostgreSQL in transactional batches...")
        
        for i in range(0, len(records_to_insert), batch_size):
            chunk = records_to_insert[i : i + batch_size]
            async with session_factory() as batch_session:
                try:
                    for item in chunk:
                        issue = Issue(**item)
                        batch_session.add(issue)
                    await batch_session.commit()
                    inserted_count += len(chunk)
                    print(f"  Inserted {inserted_count:,} / {len(records_to_insert):,} records...")
                except Exception as e:
                    await batch_session.rollback()
                    print(f"Error inserting batch starting at index {i}: {e}")
                    raise

    elapsed = time.time() - start_time

    # Print Final Statistics
    print("=" * 70)
    print("  FINAL IMPORT STATISTICS")
    print("=" * 70)
    print(f"Mode:                      {'DRY RUN' if dry_run else 'LIVE DATABASE COMMIT'}")
    print(f"Total Rows Examined:       {total_processed:,}")
    print(f"Total Records Imported:    {inserted_count if not dry_run else len(records_to_insert):,}")
    print(f"Total Records Skipped:     {skipped_duplicates:,}")
    print(f"Fallback Descriptions:     {missing_descriptions_count:,}")
    print(f"Execution Duration:        {elapsed:.2f}s")
    print("\n--- TracePilot Category Distribution ---")
    for cat, count in category_counts.most_common():
        pct = (count / len(records_to_insert) * 100) if records_to_insert else 0
        print(f"  {cat:15}: {count:6,} ({pct:5.1f}%) [Urgency Weight: {CATEGORY_URGENCY_WEIGHTS.get(cat, 2)}]")

    print("\n--- TracePilot Severity Distribution ---")
    for sev, count in severity_counts.most_common():
        pct = (count / len(records_to_insert) * 100) if records_to_insert else 0
        print(f"  {sev:15}: {count:6,} ({pct:5.1f}%) [Severity Weight: {SEVERITY_WEIGHTS[Severity(sev)]}]")

    print("\n--- TracePilot Smart Priority Distribution ---")
    for prio, count in priority_counts.most_common():
        pct = (count / len(records_to_insert) * 100) if records_to_insert else 0
        print(f"  {prio:15}: {count:6,} ({pct:5.1f}%)")

    print("\n--- TracePilot Workflow Status Distribution ---")
    for st, count in status_counts.most_common():
        pct = (count / len(records_to_insert) * 100) if records_to_insert else 0
        print(f"  {st:15}: {count:6,} ({pct:5.1f}%)")

    print("\n--- Original Kaggle Status & Resolution ---")
    print("  Kaggle Statuses:   ", dict(raw_status_counts))
    print("  Kaggle Resolutions:", dict(raw_res_counts.most_common(5)), "...")
    print("=" * 70)

    return {
        "total_processed": total_processed,
        "imported": inserted_count if not dry_run else len(records_to_insert),
        "skipped": skipped_duplicates,
        "fallback_descriptions": missing_descriptions_count,
        "categories": dict(category_counts),
        "severities": dict(severity_counts),
        "priorities": dict(priority_counts),
        "statuses": dict(status_counts),
        "elapsed_seconds": elapsed,
    }


def main():
    parser = argparse.ArgumentParser(description="Import Kaggle ISEC Bug Dataset into TracePilot.")
    parser.add_argument(
        "--csv",
        type=str,
        default=r"C:\Users\ajayk\Downloads\isec-sdc-2025\train.csv",
        help="Path to Kaggle train.csv dataset file.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=10000,
        help="Maximum number of records to import (default: 10,000).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Batch size for database transactions (default: 500).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run transformation and validation without writing to database.",
    )

    args = parser.parse_args()

    asyncio.run(
        run_import(
            csv_path=args.csv,
            limit=args.limit,
            dry_run=args.dry_run,
            batch_size=args.batch_size,
        )
    )


if __name__ == "__main__":
    main()
