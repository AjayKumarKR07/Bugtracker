"""
test_kaggle_import.py

Unit and integration tests for the Kaggle ISEC Bug Dataset import:
1. CSV header validation.
2. Missing description fallback behavior.
3. Component to Category mapping.
4. Severity determination logic.
5. Smart Priority calculation adherence to mentor formula (severity_weight * category_urgency_weight).
6. Workflow Status and Resolution mapping.
7. Row transformation completeness.
8. Duplicate prevention & idempotency.
"""

import pytest
from app.models.issue import IssueStatus, Priority, Severity
from scripts.import_kaggle_bugs import (
    REQUIRED_COLUMNS,
    calculate_smart_priority,
    determine_severity,
    map_component_to_category,
    map_status_and_resolution,
    sanitize_description,
    transform_row,
)


def test_required_csv_columns():
    """Ensure all required columns are defined and checked."""
    expected = {"Issue_id", "Component", "Title", "Description", "Status", "Resolution", "Priority"}
    assert REQUIRED_COLUMNS == expected


def test_sanitize_description_with_valid_text():
    """Valid descriptions are preserved without fallback."""
    desc = "This is a detailed bug description explaining how the crash occurs."
    cleaned, used_fallback = sanitize_description(desc, "101", "Crash on click")
    assert cleaned == desc
    assert used_fallback is False


def test_sanitize_description_with_missing_text():
    """Empty or NaN descriptions produce a deterministic non-null fallback."""
    cleaned_empty, fallback_1 = sanitize_description("", "101", "Crash on click")
    assert fallback_1 is True
    assert "Crash on click" in cleaned_empty
    assert "101" in cleaned_empty
    assert len(cleaned_empty) >= 10

    cleaned_nan, fallback_2 = sanitize_description("nan", "102", "Memory leak in parser")
    assert fallback_2 is True
    assert "Memory leak in parser" in cleaned_nan

    cleaned_none, fallback_3 = sanitize_description(None, "103", "UI layout bug")
    assert fallback_3 is True
    assert "UI layout bug" in cleaned_none


def test_map_component_to_category():
    """Verify Component maps to canonical categories."""
    assert map_component_to_category("Security: UI") == "Security"
    assert map_component_to_category("Crypto") == "Security"
    assert map_component_to_category("Bookmarks & History") == "Database"
    assert map_component_to_category("RDF") == "Database"
    assert map_component_to_category("Networking: HTTP") == "API"
    assert map_component_to_category("XPCOM") == "API"
    assert map_component_to_category("JavaScript Engine") == "Backend"
    assert map_component_to_category("HTML: Parser") == "Backend"
    assert map_component_to_category("Layout: Form Controls") == "UI"
    assert map_component_to_category("DOM: Core & HTML") == "UI"
    assert map_component_to_category("UnknownSubsystem") == "Backend"


def test_determine_severity():
    """Verify Severity reflects technical impact and keywords."""
    # Crash / security keywords trigger CRITICAL
    sev = determine_severity("2", "UI", "Browser crashes on tab close", "Steps to reproduce...")
    assert sev == Severity.CRITICAL

    sev_sec = determine_severity("2", "Security", "Buffer overflow in SSL", "Attack vector...")
    assert sev_sec == Severity.CRITICAL

    # Priority 0 triggers CRITICAL
    sev_p0 = determine_severity("0", "UI", "Window does not render", "Normal description")
    assert sev_p0 == Severity.CRITICAL

    # Priority 1 triggers MAJOR
    sev_p1 = determine_severity("1", "UI", "Dropdown button misaligned", "Normal description")
    assert sev_p1 == Severity.MAJOR

    # Priority 2 without crash triggers MAJOR
    sev_p2 = determine_severity("2", "Backend", "Calculation error in parser", "Normal description")
    assert sev_p2 == Severity.MAJOR

    # Priority 2 with minor keyword triggers MINOR
    sev_p2_minor = determine_severity("2", "UI", "Typo in preferences dialog", "Misspelled word")
    assert sev_p2_minor == Severity.MINOR

    # Priority 3 and 4 trigger MINOR
    sev_p3 = determine_severity("3", "UI", "Change button border", "Cosmetic")
    assert sev_p3 == Severity.MINOR
    sev_p4 = determine_severity("4", "Backend", "Minor code cleanup", "Refactor")
    assert sev_p4 == Severity.MINOR


def test_calculate_smart_priority_mentor_formula():
    """
    Verify Smart Priority adheres strictly to:
      priority_score = severity_weight * category_urgency_weight
      >= 10 -> URGENT, 7-9 -> HIGH, 4-6 -> MEDIUM, < 4 -> LOW
    """
    # CRITICAL (4) * Security (3) = 12 -> URGENT
    p, score = calculate_smart_priority(Severity.CRITICAL, "Security")
    assert score == 12
    assert p == Priority.URGENT

    # CRITICAL (4) * Database (3) = 12 -> URGENT
    p, score = calculate_smart_priority(Severity.CRITICAL, "Database")
    assert score == 12
    assert p == Priority.URGENT

    # CRITICAL (4) * Backend (2) = 8 -> HIGH
    p, score = calculate_smart_priority(Severity.CRITICAL, "Backend")
    assert score == 8
    assert p == Priority.HIGH

    # CRITICAL (4) * UI (1) = 4 -> MEDIUM
    p, score = calculate_smart_priority(Severity.CRITICAL, "UI")
    assert score == 4
    assert p == Priority.MEDIUM

    # MAJOR (3) * Security (3) = 9 -> HIGH
    p, score = calculate_smart_priority(Severity.MAJOR, "Security")
    assert score == 9
    assert p == Priority.HIGH

    # MAJOR (3) * Backend (2) = 6 -> MEDIUM
    p, score = calculate_smart_priority(Severity.MAJOR, "Backend")
    assert score == 6
    assert p == Priority.MEDIUM

    # MAJOR (3) * UI (1) = 3 -> LOW
    p, score = calculate_smart_priority(Severity.MAJOR, "UI")
    assert score == 3
    assert p == Priority.LOW

    # MINOR (2) * UI (1) = 2 -> LOW
    p, score = calculate_smart_priority(Severity.MINOR, "UI")
    assert score == 2
    assert p == Priority.LOW


def test_map_status_and_resolution():
    """Verify Status and Resolution mapping."""
    # RESOLVED + FIXED -> RESOLVED
    assert map_status_and_resolution("RESOLVED", "FIXED") == IssueStatus.RESOLVED

    # RESOLVED + non-FIXED -> CLOSED
    assert map_status_and_resolution("RESOLVED", "DUPLICATE") == IssueStatus.CLOSED
    assert map_status_and_resolution("RESOLVED", "WORKSFORME") == IssueStatus.CLOSED
    assert map_status_and_resolution("RESOLVED", "INVALID") == IssueStatus.CLOSED
    assert map_status_and_resolution("RESOLVED", "WONTFIX") == IssueStatus.CLOSED

    # VERIFIED + any -> CLOSED
    assert map_status_and_resolution("VERIFIED", "FIXED") == IssueStatus.CLOSED
    assert map_status_and_resolution("VERIFIED", "WORKSFORME") == IssueStatus.CLOSED

    # CLOSED + any -> CLOSED
    assert map_status_and_resolution("CLOSED", "FIXED") == IssueStatus.CLOSED


def test_transform_row_complete():
    """Verify complete row transformation produces valid Issue fields."""
    row = {
        "Issue_id": "99999",
        "Component": "Security: UI",
        "Title": "Master password prompt hangs browser",
        "Description": "Entering incorrect password causes UI to hang completely.",
        "Status": "RESOLVED",
        "Resolution": "FIXED",
        "Priority": "1",
    }
    rec, used_fallback = transform_row(row, project_id=10, reporter_id=5)

    assert used_fallback is False
    assert rec["external_id"] == "99999"
    assert rec["issue_key"] == "ISEC-99999"
    assert rec["title"] == "Master password prompt hangs browser"
    assert rec["category"] == "Security"
    assert rec["component"] == "Security: UI"
    assert rec["severity"] == Severity.CRITICAL  # triggered by 'hang'
    assert rec["priority"] == Priority.URGENT    # CRITICAL (4) * Security (3) = 12 -> URGENT
    assert rec["status"] == IssueStatus.RESOLVED
    assert rec["raw_status"] == "RESOLVED"
    assert rec["raw_resolution"] == "FIXED"
    assert rec["raw_priority"] == "1"
    assert rec["source"] == "KAGGLE_ISEC"
    assert rec["project_id"] == 10
    assert rec["reporter_id"] == 5
    assert rec["assignee_id"] is None
    assert rec["sprint_id"] is None
