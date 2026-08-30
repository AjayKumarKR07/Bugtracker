"""
Issue service — business logic for defect management.

Keeps all DB queries, key generation, and workflow enforcement
out of route handlers. All functions are async + AsyncSession.

Phase 5: Audit logging integrated into all mutating operations.
         Audit records are written via db.flush() inside the same
         transaction as the mutating operation.
"""

import math
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditAction, AuditLog
from app.schemas.audit import AuditLogResponse
from app.models.issue import (
    DEVELOPER_TRANSITIONS,
    REOPENABLE_STATUSES,
    Issue,
    IssueStatus,
    IssueType,
    Priority,
    Severity,
)
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.issue import (
    IssueAssign,
    IssueCreate,
    IssueDetailResponse,
    IssueListResponse,
    IssueReopen,
    IssueResolve,
    IssueResponse,
    IssueStatusUpdate,
    IssueUpdate,
)
from app.services.audit_service import compute_diff, create_audit_log
from app.services import notification_service
from app.models.notification import NotificationType


# --------------------------------------------------------------------------- #
# Internal helpers                                                             #
# --------------------------------------------------------------------------- #

async def _get_issue_or_404(issue_id: int, db: AsyncSession) -> Issue:
    """Fetch an Issue with relationships eagerly loaded, or raise 404."""
    result = await db.execute(
        select(Issue)
        .options(
            selectinload(Issue.project),
            selectinload(Issue.reporter),
            selectinload(Issue.assignee),
        )
        .where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue {issue_id} not found.",
        )
    return issue


async def _get_project_active_or_error(project_id: int, db: AsyncSession) -> Project:
    """Fetch a Project, raising 404 if missing and 400 if inactive."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )
    if project.status != ProjectStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot report issues on an inactive project.",
        )
    return project


async def _generate_issue_key(project_key: str, db: AsyncSession) -> str:
    """Generate the next sequential issue key for a project.

    Format: <PROJECT_KEY>-<zero-padded-number>  e.g. DM-0001, DM-0042
    """
    # Count existing issues for this project
    result = await db.execute(
        select(func.count())
        .select_from(Issue)
        .join(Project, Issue.project_id == Project.id)
        .where(Project.project_key == project_key)
    )
    count = result.scalar_one()
    return f"{project_key}-{count + 1:04d}"


# --------------------------------------------------------------------------- #
# CRUD                                                                         #
# --------------------------------------------------------------------------- #

async def create_issue(body: IssueCreate, reporter: User, db: AsyncSession) -> IssueDetailResponse:
    """Create a new defect. Reporter is always the authenticated TESTER."""
    project = await _get_project_active_or_error(body.project_id, db)
    issue_key = await _generate_issue_key(project.project_key, db)

    issue = Issue(
        issue_key=issue_key,
        title=body.title,
        description=body.description,
        issue_type=body.issue_type,
        severity=body.severity,
        priority=body.priority,
        status=IssueStatus.REPORTED,
        environment=body.environment,
        steps_to_reproduce=body.steps_to_reproduce,
        expected_result=body.expected_result,
        actual_result=body.actual_result,
        project_id=body.project_id,
        reporter_id=reporter.id,
        assignee_id=None,
    )
    db.add(issue)
    await db.flush()

    await create_audit_log(
        db=db,
        actor=reporter,
        action=AuditAction.ISSUE_CREATED,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue_key,
        description=(
            f"Tester {reporter.full_name!r} reported issue {issue_key} "
            f"in project {project.project_key}"
        ),
        new_values={
            "issue_key": issue_key,
            "title": body.title,
            "issue_type": body.issue_type,
            "severity": body.severity,
            "priority": body.priority,
            "status": IssueStatus.REPORTED,
            "project_key": project.project_key,
            "reporter": reporter.full_name,
        },
    )

    # Re-fetch with relationships
    return await get_issue_detail(issue.id, db)


async def get_issue_detail(
    issue_id: int, db: AsyncSession, current_user: User | None = None
) -> IssueDetailResponse:
    """Fetch full issue detail with related project, reporter, assignee and enforce RBAC."""
    issue = await _get_issue_or_404(issue_id, db)
    if current_user is not None and current_user.role != UserRole.ADMIN:
        if current_user.role == UserRole.USER and issue.reporter_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view issues you reported.",
            )
        elif (
            current_user.role in (UserRole.TESTER, UserRole.DEVELOPER)
            and issue.assignee_id != current_user.id
            and issue.reporter_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view issues assigned to you.",
            )
    return IssueDetailResponse.model_validate(issue)


async def list_issues(
    db: AsyncSession,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    status_filter: IssueStatus | None = None,
    severity_filter: Severity | None = None,
    priority_filter: Priority | None = None,
    issue_type_filter: IssueType | None = None,
    project_id: int | None = None,
    reporter_id: int | None = None,
    assignee_id: int | None = None,
    search: str | None = None,
) -> IssueListResponse:
    """Return paginated issues with role-based visibility enforcement.

    Role filters:
      ADMIN     — sees all issues
      TESTER    — only issues assigned to them (assignee_id)
      USER      — only issues they personally reported (reporter_id)
      DEVELOPER — only issues assigned to them (legacy)
    """
    query = select(Issue)

    # ---- Role-based base filter ------------------------------------------- #
    if current_user.role == UserRole.USER:
        # Users can only see their own submitted issues
        query = query.where(Issue.reporter_id == current_user.id)
    elif current_user.role == UserRole.TESTER:
        # Testers see only issues assigned to them
        query = query.where(Issue.assignee_id == current_user.id)
    elif current_user.role == UserRole.DEVELOPER:
        # Legacy role — assigned issues only
        query = query.where(Issue.assignee_id == current_user.id)
    # ADMIN sees all — no base filter

    # ---- Optional filters ------------------------------------------------- #
    if status_filter is not None:
        query = query.where(Issue.status == status_filter)
    if severity_filter is not None:
        query = query.where(Issue.severity == severity_filter)
    if priority_filter is not None:
        query = query.where(Issue.priority == priority_filter)
    if issue_type_filter is not None:
        query = query.where(Issue.issue_type == issue_type_filter)
    if project_id is not None:
        query = query.where(Issue.project_id == project_id)

    # Reporter / assignee filters are ADMIN-only (to prevent enumeration)
    if current_user.role == UserRole.ADMIN:
        if reporter_id is not None:
            query = query.where(Issue.reporter_id == reporter_id)
        if assignee_id is not None:
            query = query.where(Issue.assignee_id == assignee_id)

    # ---- Search ----------------------------------------------------------- #
    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Issue.issue_key.ilike(term),
                Issue.title.ilike(term),
                Issue.description.ilike(term),
            )
        )

    # ---- Pagination ------------------------------------------------------- #
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        query.order_by(Issue.created_at.desc()).offset(offset).limit(page_size)
    )
    issues = result.scalars().all()

    return IssueListResponse(
        items=[IssueResponse.model_validate(i) for i in issues],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


async def update_issue(
    issue_id: int, body: IssueUpdate, current_user: User, db: AsyncSession
) -> IssueDetailResponse:
    """USER/TESTER: update their own reported issue's metadata fields."""
    issue = await _get_issue_or_404(issue_id, db)

    # Ownership check — only reporters can update issue metadata
    if current_user.role in (UserRole.USER, UserRole.TESTER) and issue.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update issues you reported.",
        )

    # Protected statuses — cannot update resolved/closed issues
    if issue.status in (IssueStatus.RESOLVED, IssueStatus.CLOSED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a resolved or closed issue. Reopen it first.",
        )

    # Snapshot before state for change tracking
    before = {
        "title": issue.title,
        "description": issue.description,
        "severity": issue.severity,
        "priority": issue.priority,
        "environment": issue.environment,
        "steps_to_reproduce": issue.steps_to_reproduce,
        "expected_result": issue.expected_result,
        "actual_result": issue.actual_result,
    }

    if body.title is not None:
        issue.title = body.title
    if body.description is not None:
        issue.description = body.description
    if body.severity is not None:
        issue.severity = body.severity
    if body.priority is not None:
        issue.priority = body.priority
    if body.environment is not None:
        issue.environment = body.environment
    if body.steps_to_reproduce is not None:
        issue.steps_to_reproduce = body.steps_to_reproduce
    if body.expected_result is not None:
        issue.expected_result = body.expected_result
    if body.actual_result is not None:
        issue.actual_result = body.actual_result

    await db.flush()
    await db.refresh(issue)

    # Only emit audit record if something actually changed
    after = {
        "title": issue.title,
        "description": issue.description,
        "severity": issue.severity,
        "priority": issue.priority,
        "environment": issue.environment,
        "steps_to_reproduce": issue.steps_to_reproduce,
        "expected_result": issue.expected_result,
        "actual_result": issue.actual_result,
    }
    old_diff, new_diff = compute_diff(before, after)

    if old_diff or new_diff:
        await create_audit_log(
            db=db,
            actor=current_user,
            action=AuditAction.ISSUE_UPDATED,
            entity_type="ISSUE",
            entity_id=issue.id,
            entity_key=issue.issue_key,
            description=(
                f"{current_user.role.value.capitalize()} {current_user.full_name!r} "
                f"updated issue {issue.issue_key}"
            ),
            old_values=old_diff,
            new_values=new_diff,
        )

    return await get_issue_detail(issue_id, db)


# --------------------------------------------------------------------------- #
# Assignment                                                                   #
# --------------------------------------------------------------------------- #

async def assign_issue(
    issue_id: int, body: IssueAssign, current_user: User, db: AsyncSession
) -> tuple[IssueDetailResponse, list]:
    """ADMIN: assign/reassign an issue to a tester.

    Accepts users with the TESTER role (the role responsible for investigating
    and resolving assigned issues in the current workflow).

    Returns (IssueDetailResponse, list_of_notifications) so the route handler
    can schedule WebSocket delivery as a BackgroundTask.
    """
    issue = await _get_issue_or_404(issue_id, db)

    # Validate target user exists and has TESTER role
    dev_result = await db.execute(select(User).where(User.id == body.developer_id))
    developer: User | None = dev_result.scalar_one_or_none()
    if developer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {body.developer_id} not found.",
        )
    if developer.role not in (UserRole.TESTER, UserRole.DEVELOPER):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Issues can only be assigned to a TESTER.",
        )
    if not developer.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign issue to an inactive user.",
        )

    old_assignee_id = issue.assignee_id
    old_status = issue.status

    issue.assignee_id = body.developer_id
    if issue.status == IssueStatus.REPORTED:
        issue.status = IssueStatus.ASSIGNED

    await db.flush()
    await db.refresh(issue)  # expire cached attributes so next query re-loads relationships

    await create_audit_log(
        db=db,
        actor=current_user,
        action=AuditAction.ISSUE_ASSIGNED,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
        description=(
            f"Admin {current_user.full_name!r} assigned issue {issue.issue_key} "
            f"to {developer.full_name!r}"
        ),
        old_values={
            "assignee_id": old_assignee_id,
            "status": old_status,
        },
        new_values={
            "assignee_id": body.developer_id,
            "assignee_name": developer.full_name,
            "status": issue.status,
        },
    )

    # Notify the assigned tester and reporter (actor = admin, never notified)
    notify_recipients = [developer.id]
    if issue.reporter_id and issue.reporter_id != current_user.id:
        notify_recipients.append(issue.reporter_id)

    notifications = await notification_service.notify_users(
        db=db,
        user_ids=notify_recipients,
        notification_type=NotificationType.ISSUE_ASSIGNED,
        title="Issue assigned to tester",
        message=f"Issue {issue.issue_key} has been assigned to {developer.full_name}.",
        actor_id=current_user.id,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
    )

    return await get_issue_detail(issue_id, db), notifications


# --------------------------------------------------------------------------- #
# Status transitions                                                           #
# --------------------------------------------------------------------------- #

async def update_issue_status(
    issue_id: int, body: IssueStatusUpdate, current_user: User, db: AsyncSession
) -> tuple[IssueDetailResponse, list]:
    """DEVELOPER: transition their assigned issue through allowed statuses."""
    issue = await _get_issue_or_404(issue_id, db)

    # Must be assigned to the requesting developer
    if issue.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update status on issues assigned to you.",
        )

    allowed = DEVELOPER_TRANSITIONS.get(issue.status, set())
    if body.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot transition from {issue.status.value} to {body.status.value}. "
                f"Allowed targets: {[s.value for s in allowed] or 'none'}."
            ),
        )

    old_status = issue.status
    reporter_id = issue.reporter_id
    issue.status = body.status
    await db.flush()
    await db.refresh(issue)

    await create_audit_log(
        db=db,
        actor=current_user,
        action=AuditAction.ISSUE_STATUS_CHANGED,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
        description=(
            f"Developer {current_user.full_name!r} changed status of "
            f"{issue.issue_key} from {old_status.value} to {body.status.value}"
        ),
        old_values={"status": old_status},
        new_values={"status": body.status},
    )

    # Notify the reporter (not the developer who changed the status)
    notifications = await notification_service.notify_users(
        db=db,
        user_ids=[reporter_id] if reporter_id else [],
        notification_type=NotificationType.ISSUE_STATUS_CHANGED,
        title="Issue status updated",
        message=(
            f"{issue.issue_key} status changed from "
            f"{old_status.value} to {body.status.value}."
        ),
        actor_id=current_user.id,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
    )

    return await get_issue_detail(issue_id, db), notifications


# --------------------------------------------------------------------------- #
# Resolution                                                                   #
# --------------------------------------------------------------------------- #

async def resolve_issue(
    issue_id: int, body: IssueResolve, current_user: User, db: AsyncSession
) -> tuple[IssueDetailResponse, list]:
    """DEVELOPER: mark their assigned issue as resolved."""
    issue = await _get_issue_or_404(issue_id, db)

    if issue.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only resolve issues assigned to you.",
        )

    if issue.status == IssueStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Issue is already resolved.",
        )

    # Resolution is allowed from IN_REVIEW or IN_TESTING
    resolvable = {IssueStatus.IN_REVIEW, IssueStatus.IN_TESTING, IssueStatus.IN_DEVELOPMENT, IssueStatus.ASSIGNED}
    if issue.status not in resolvable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot resolve issue in status {issue.status.value}.",
        )

    old_status = issue.status
    reporter_id = issue.reporter_id

    summary = body.resolution_summary
    if body.resolution_notes:
        summary = f"{body.resolution_summary}\n\nNotes: {body.resolution_notes}"

    issue.status = IssueStatus.RESOLVED
    issue.resolution_summary = summary
    issue.resolved_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(issue)

    await create_audit_log(
        db=db,
        actor=current_user,
        action=AuditAction.ISSUE_RESOLVED,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
        description=(
            f"Developer {current_user.full_name!r} resolved issue {issue.issue_key}"
        ),
        old_values={"status": old_status},
        new_values={
            "status": IssueStatus.RESOLVED,
            "resolution_summary": body.resolution_summary,
            "resolved_at": issue.resolved_at,
        },
    )

    # Notify the reporter (not the developer who resolved)
    notifications = await notification_service.notify_users(
        db=db,
        user_ids=[reporter_id] if reporter_id else [],
        notification_type=NotificationType.ISSUE_RESOLVED,
        title="Issue resolved",
        message=f"{issue.issue_key} has been resolved.",
        actor_id=current_user.id,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
    )

    return await get_issue_detail(issue_id, db), notifications


# --------------------------------------------------------------------------- #
# Reopen                                                                       #
# --------------------------------------------------------------------------- #

async def reopen_issue(
    issue_id: int, body: IssueReopen, current_user: User, db: AsyncSession
) -> tuple[IssueDetailResponse, list]:
    """TESTER (own issues) or ADMIN: reopen a resolved/closed issue."""
    issue = await _get_issue_or_404(issue_id, db)

    if issue.status not in REOPENABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot reopen issue in status {issue.status.value}. "
                f"Reopenable statuses: {[s.value for s in REOPENABLE_STATUSES]}."
            ),
        )

    # Ownership check
    if current_user.role == UserRole.USER and issue.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users can only reopen issues they reported.",
        )
    elif current_user.role == UserRole.TESTER and issue.assignee_id != current_user.id and issue.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Testers can only reopen issues assigned to or reported by them.",
        )

    old_status = issue.status
    assignee_id = issue.assignee_id

    reopen_note = f"[REOPENED by {current_user.full_name}]"
    if body.reason:
        reopen_note += f" Reason: {body.reason}"

    issue.status = IssueStatus.REOPENED
    issue.resolution_summary = None  # clear resolution
    issue.resolved_at = None

    # Append reopen note to description for traceability
    if body.reason:
        issue.description = f"{issue.description}\n\n{reopen_note}"

    await db.flush()
    await db.refresh(issue)

    await create_audit_log(
        db=db,
        actor=current_user,
        action=AuditAction.ISSUE_REOPENED,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
        description=(
            f"{current_user.role.value.capitalize()} {current_user.full_name!r} "
            f"reopened issue {issue.issue_key}"
        ),
        old_values={"status": old_status},
        new_values={"status": IssueStatus.REOPENED, "reason": body.reason},
    )

    # Notify the assignee if present (not the actor)
    notify_ids = [assignee_id] if assignee_id else []
    notifications = await notification_service.notify_users(
        db=db,
        user_ids=notify_ids,
        notification_type=NotificationType.ISSUE_REOPENED,
        title="Issue reopened",
        message=f"{issue.issue_key} has been reopened and requires attention.",
        actor_id=current_user.id,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
    )

    return await get_issue_detail(issue_id, db), notifications


# --------------------------------------------------------------------------- #
# Close / Confirm Resolution                                                   #
# --------------------------------------------------------------------------- #

async def close_issue(
    issue_id: int, current_user: User, db: AsyncSession
) -> tuple[IssueDetailResponse, list]:
    """USER (reporter) or ADMIN: confirm resolution and close a resolved issue."""
    issue = await _get_issue_or_404(issue_id, db)

    if issue.status != IssueStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot close issue in status {issue.status.value}. Only RESOLVED issues can be closed.",
        )

    if current_user.role == UserRole.USER and issue.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users can only confirm resolution of issues they reported.",
        )

    old_status = issue.status
    assignee_id = issue.assignee_id
    issue.status = IssueStatus.CLOSED

    await db.flush()
    await db.refresh(issue)

    await create_audit_log(
        db=db,
        actor=current_user,
        action=AuditAction.ISSUE_STATUS_CHANGED,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
        description=(
            f"{current_user.role.value.capitalize()} {current_user.full_name!r} "
            f"confirmed resolution and closed issue {issue.issue_key}"
        ),
        old_values={"status": old_status},
        new_values={"status": IssueStatus.CLOSED},
    )

    notify_ids = [assignee_id] if assignee_id else []
    notifications = await notification_service.notify_users(
        db=db,
        user_ids=notify_ids,
        notification_type=NotificationType.ISSUE_STATUS_CHANGED,
        title="Issue resolution confirmed",
        message=f"{issue.issue_key} was confirmed as resolved and closed by {current_user.full_name}.",
        actor_id=current_user.id,
        entity_type="ISSUE",
        entity_id=issue.id,
        entity_key=issue.issue_key,
    )

    return await get_issue_detail(issue_id, db), notifications


# --------------------------------------------------------------------------- #
# Activity / History                                                           #
# --------------------------------------------------------------------------- #

async def get_issue_activity(
    issue_id: int, current_user: User, db: AsyncSession
) -> list[AuditLogResponse]:
    """Fetch audit history for a specific issue respecting RBAC."""
    issue = await _get_issue_or_404(issue_id, db)

    # RBAC check
    if current_user.role == UserRole.USER and issue.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users can only view activity on issues they reported.",
        )
    elif current_user.role == UserRole.TESTER and issue.assignee_id != current_user.id and issue.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Testers can only view activity on issues assigned to or reported by them.",
        )

    result = await db.execute(
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .where(
            AuditLog.entity_type == "ISSUE",
            AuditLog.entity_id == issue_id,
        )
        .order_by(AuditLog.created_at.asc())
    )
    logs = result.scalars().all()
    return [AuditLogResponse.model_validate(log) for log in logs]
