"""
Analytics and reporting routes — Phase 9.

Endpoints:
  GET /analytics/overview                     → ADMIN only
  GET /analytics/issues/status-distribution   → Authenticated (RBAC scoped)
  GET /analytics/issues/severity-distribution → Authenticated (RBAC scoped)
  GET /analytics/issues/trends                → Authenticated (RBAC scoped)
  GET /analytics/projects                     → Authenticated (RBAC scoped)
  GET /analytics/reports/issues/export        → Authenticated (RBAC scoped, CSV)
  GET /analytics/developers                   → ADMIN only
  GET /analytics/projects/{project_id}        → Authenticated (RBAC scoped)

Static routes are declared before dynamic routes to prevent route collisions.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.issue import IssueStatus, Severity
from app.models.user import User, UserRole
from app.schemas.analytics import (
    DeveloperAnalyticsResponse,
    IssueStatusDistributionResponse,
    IssueTrendResponse,
    ProjectAnalyticsListResponse,
    ProjectAnalyticsResponse,
    SeverityDistributionResponse,
    PriorityDistributionResponse,
    SystemAnalyticsResponse,
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

_ADMIN = Depends(require_role(UserRole.ADMIN))


# --------------------------------------------------------------------------- #
# 1. System Overview (Admin Only)                                              #
# --------------------------------------------------------------------------- #

@router.get(
    "/overview",
    response_model=SystemAnalyticsResponse,
    summary="System analytics overview",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "ADMIN access required"},
    },
)
async def system_overview(
    current_user: User = _ADMIN,
    db: AsyncSession = Depends(get_db),
) -> SystemAnalyticsResponse:
    """Return high-level system metrics across users, projects, and issues.

    **ADMIN only.**
    """
    return await analytics_service.get_system_overview(db)


# --------------------------------------------------------------------------- #
# 2. Status Distribution                                                      #
# --------------------------------------------------------------------------- #

@router.get(
    "/issues/status-distribution",
    response_model=IssueStatusDistributionResponse,
    summary="Issue status distribution",
)
async def issue_status_distribution(
    project_id: int | None = Query(None, description="Filter by project ID"),
    start_date: datetime | None = Query(None, description="Filter by start date (ISO-8601)"),
    end_date: datetime | None = Query(None, description="Filter by end date (ISO-8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IssueStatusDistributionResponse:
    """Return status distribution counts applying RBAC visibility rules."""
    return await analytics_service.get_status_distribution(
        db=db,
        current_user=current_user,
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
    )


# --------------------------------------------------------------------------- #
# 3. Severity Distribution                                                    #
# --------------------------------------------------------------------------- #

@router.get(
    "/issues/severity-distribution",
    response_model=SeverityDistributionResponse,
    summary="Issue severity distribution",
)
async def issue_severity_distribution(
    project_id: int | None = Query(None, description="Filter by project ID"),
    start_date: datetime | None = Query(None, description="Filter by start date (ISO-8601)"),
    end_date: datetime | None = Query(None, description="Filter by end date (ISO-8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SeverityDistributionResponse:
    """Return severity distribution counts applying RBAC visibility rules."""
    return await analytics_service.get_severity_distribution(
        db=db,
        current_user=current_user,
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
    )


# --------------------------------------------------------------------------- #
# 3b. Priority Distribution                                                   #
# --------------------------------------------------------------------------- #

@router.get(
    "/issues/priority-distribution",
    response_model=PriorityDistributionResponse,
    summary="Issue priority distribution",
)
async def issue_priority_distribution(
    project_id: int | None = Query(None, description="Filter by project ID"),
    start_date: datetime | None = Query(None, description="Filter by start date (ISO-8601)"),
    end_date: datetime | None = Query(None, description="Filter by end date (ISO-8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PriorityDistributionResponse:
    """Return priority distribution counts applying RBAC visibility rules."""
    return await analytics_service.get_priority_distribution(
        db=db,
        current_user=current_user,
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
    )


# --------------------------------------------------------------------------- #
# 4. Issue Trends                                                              #
# --------------------------------------------------------------------------- #

@router.get(
    "/issues/trends",
    response_model=IssueTrendResponse,
    summary="Issue trends over time",
)
async def issue_trends(
    interval: str = Query("day", description="Aggregation interval: day, week, or month"),
    project_id: int | None = Query(None, description="Filter by project ID"),
    start_date: datetime | None = Query(None, description="Filter by start date (ISO-8601)"),
    end_date: datetime | None = Query(None, description="Filter by end date (ISO-8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IssueTrendResponse:
    """Return time-series creation and resolution trend metrics."""
    return await analytics_service.get_issue_trends(
        db=db,
        current_user=current_user,
        interval=interval,
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
    )


# --------------------------------------------------------------------------- #
# 5. All Projects Analytics (STATIC ROUTE)                                     #
# --------------------------------------------------------------------------- #

@router.get(
    "/projects",
    response_model=ProjectAnalyticsListResponse,
    summary="All projects analytics",
)
async def all_projects_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectAnalyticsListResponse:
    """Return issue metrics and resolution rate for all projects."""
    return await analytics_service.get_all_projects_analytics(
        db=db,
        current_user=current_user,
    )


# --------------------------------------------------------------------------- #
# 6. CSV Export (STATIC ROUTE)                                                 #
# --------------------------------------------------------------------------- #

@router.get(
    "/reports/issues/export",
    summary="Export issues report as CSV",
    response_class=Response,
    responses={
        200: {
            "content": {"text/csv": {}},
            "description": "Returns issues as a downloadable CSV file.",
        }
    },
)
async def export_issues_report(
    project_id: int | None = Query(None, description="Filter by project ID"),
    status: IssueStatus | None = Query(None, description="Filter by status"),
    severity: Severity | None = Query(None, description="Filter by severity"),
    start_date: datetime | None = Query(None, description="Filter by start date (ISO-8601)"),
    end_date: datetime | None = Query(None, description="Filter by end date (ISO-8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Export filtered issues visible to the requester in RFC 4180 CSV format."""
    return await analytics_service.export_issues_csv(
        db=db,
        current_user=current_user,
        project_id=project_id,
        status_filter=status,
        severity_filter=severity,
        start_date=start_date,
        end_date=end_date,
    )


# --------------------------------------------------------------------------- #
# 7. Developer Performance (STATIC ROUTE - Admin Only)                         #
# --------------------------------------------------------------------------- #

@router.get(
    "/developers",
    response_model=DeveloperAnalyticsResponse,
    summary="Developer performance metrics",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "ADMIN access required"},
    },
)
async def developer_performance(
    current_user: User = _ADMIN,
    db: AsyncSession = Depends(get_db),
) -> DeveloperAnalyticsResponse:
    """Return workload, resolution rates, and resolution speed for developers.

    **ADMIN only.**
    """
    return await analytics_service.get_developer_performance(db)


# --------------------------------------------------------------------------- #
# 8. Single Project Analytics (DYNAMIC ROUTE)                                  #
# --------------------------------------------------------------------------- #

@router.get(
    "/projects/{project_id}",
    response_model=ProjectAnalyticsResponse,
    summary="Single project analytics",
    responses={
        404: {"description": "Project not found"},
    },
)
async def single_project_analytics(
    project_id: int,
    start_date: datetime | None = Query(None, description="Filter by start date (ISO-8601)"),
    end_date: datetime | None = Query(None, description="Filter by end date (ISO-8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectAnalyticsResponse:
    """Return issue metrics and resolution rate for a specific project."""
    return await analytics_service.get_project_analytics(
        project_id=project_id,
        db=db,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )
