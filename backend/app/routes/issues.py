"""
Issue / Defect management routes — Phase 4.

RBAC summary:
  POST   /issues                        → TESTER
  GET    /issues                        → ALL (role-filtered in service)
  GET    /issues/{id}                   → ALL (ownership check in service)
  PATCH  /issues/{id}                   → TESTER (own issues)
  PATCH  /issues/{id}/assign            → ADMIN
  PATCH  /issues/{id}/status            → DEVELOPER (assigned)
  PATCH  /issues/{id}/resolve           → DEVELOPER (assigned)
  PATCH  /issues/{id}/reopen            → TESTER (own) | ADMIN
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.issue import IssueStatus, IssueType, Priority, Severity
from app.models.user import User, UserRole
from app.schemas.issue import (
    IssueAssign,
    IssueCreate,
    IssueDetailResponse,
    IssueListResponse,
    IssueReopen,
    IssueResolve,
    IssueStatusUpdate,
    IssueUpdate,
)
from app.services import issue_service

router = APIRouter(prefix="/issues", tags=["Issues"])


@router.post(
    "",
    response_model=IssueDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a defect",
)
async def create_issue(
    body: IssueCreate,
    current_user: User = Depends(require_role(UserRole.TESTER)),
    db: AsyncSession = Depends(get_db),
) -> IssueDetailResponse:
    """Report a new defect. **TESTER only.**
    The reporter is automatically set to the authenticated user.
    """
    return await issue_service.create_issue(body, current_user, db)


@router.get(
    "",
    response_model=IssueListResponse,
    summary="List issues",
)
async def list_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: IssueStatus | None = Query(None),
    severity: Severity | None = Query(None),
    priority: Priority | None = Query(None),
    issue_type: IssueType | None = Query(None),
    project_id: int | None = Query(None),
    reporter_id: int | None = Query(None, description="ADMIN only"),
    assignee_id: int | None = Query(None, description="ADMIN only"),
    search: str | None = Query(None, description="Search issue key, title, or description"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IssueListResponse:
    """List issues. Role-based filtering is applied automatically:
    - **ADMIN** sees all issues
    - **DEVELOPER** sees only assigned issues
    - **TESTER** sees only issues they reported
    """
    return await issue_service.list_issues(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status_filter=status,
        severity_filter=severity,
        priority_filter=priority,
        issue_type_filter=issue_type,
        project_id=project_id,
        reporter_id=reporter_id,
        assignee_id=assignee_id,
        search=search,
    )


@router.get(
    "/{issue_id}",
    response_model=IssueDetailResponse,
    summary="Get issue details",
)
async def get_issue(
    issue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IssueDetailResponse:
    """Get full issue detail. All authenticated users can view issues,
    but sensitive user fields (password_hash) are never returned.
    """
    detail = await issue_service.get_issue_detail(issue_id, db)
    return detail


@router.patch(
    "/{issue_id}",
    response_model=IssueDetailResponse,
    summary="Update issue metadata",
)
async def update_issue(
    issue_id: int,
    body: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IssueDetailResponse:
    """Update permitted fields on an issue.
    **TESTER** can update their own reported issues.
    **ADMIN** can update any issue.
    Protected fields (reporter_id, issue_key, project_id, created_at) are never modifiable.
    """
    return await issue_service.update_issue(issue_id, body, current_user, db)


@router.patch(
    "/{issue_id}/assign",
    response_model=IssueDetailResponse,
    summary="Assign issue to a developer",
)
async def assign_issue(
    issue_id: int,
    body: IssueAssign,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> IssueDetailResponse:
    """Assign or reassign an issue to a developer. **ADMIN only.**"""
    return await issue_service.assign_issue(issue_id, body, current_user, db)


@router.patch(
    "/{issue_id}/status",
    response_model=IssueDetailResponse,
    summary="Update issue status",
)
async def update_issue_status(
    issue_id: int,
    body: IssueStatusUpdate,
    current_user: User = Depends(require_role(UserRole.DEVELOPER)),
    db: AsyncSession = Depends(get_db),
) -> IssueDetailResponse:
    """Transition an assigned issue through the development workflow.
    **DEVELOPER only** — must be assigned to the issue.

    Valid transitions:
    - ASSIGNED → IN_DEVELOPMENT
    - IN_DEVELOPMENT → IN_REVIEW
    - IN_REVIEW → IN_TESTING or IN_DEVELOPMENT
    - REOPENED → IN_DEVELOPMENT
    """
    return await issue_service.update_issue_status(issue_id, body, current_user, db)


@router.patch(
    "/{issue_id}/resolve",
    response_model=IssueDetailResponse,
    summary="Resolve an issue",
)
async def resolve_issue(
    issue_id: int,
    body: IssueResolve,
    current_user: User = Depends(require_role(UserRole.DEVELOPER)),
    db: AsyncSession = Depends(get_db),
) -> IssueDetailResponse:
    """Mark an assigned issue as RESOLVED. **DEVELOPER only** — must be assigned."""
    return await issue_service.resolve_issue(issue_id, body, current_user, db)


@router.patch(
    "/{issue_id}/reopen",
    response_model=IssueDetailResponse,
    summary="Reopen an issue",
)
async def reopen_issue(
    issue_id: int,
    body: IssueReopen,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IssueDetailResponse:
    """Reopen a resolved, closed, or in-testing issue.
    - **TESTER**: can reopen their own reported issues
    - **ADMIN**: can reopen any issue
    """
    if current_user.role not in (UserRole.TESTER, UserRole.ADMIN):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only TESTER or ADMIN can reopen issues.",
        )
    return await issue_service.reopen_issue(issue_id, body, current_user, db)
