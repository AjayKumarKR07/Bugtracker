"""
Analytics and reporting service — Phase 9.

Computes system-wide, project-level, developer-performance, and time-series
metrics using efficient SQL aggregation queries. All endpoints query live
PostgreSQL tables directly without any mock or cached data.

RBAC:
  - ADMIN: Has full visibility across all users, projects, and issues.
  - DEVELOPER: Scoped only to issues assigned to them.
  - TESTER: Scoped only to issues reported by them.
"""

import csv
import io
from datetime import datetime

from fastapi import HTTPException, Response, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.issue import Issue, IssueStatus, Priority, Severity
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.analytics import (
    DeveloperAnalyticsItem,
    DeveloperAnalyticsResponse,
    IssueStatusDistributionResponse,
    IssueTrendItem,
    IssueTrendResponse,
    ProjectAnalyticsListResponse,
    ProjectAnalyticsResponse,
    SeverityDistributionResponse,
    SystemAnalyticsResponse,
)


# --------------------------------------------------------------------------- #
# A. System Overview (Admin Only)                                              #
# --------------------------------------------------------------------------- #

async def get_system_overview(db: AsyncSession) -> SystemAnalyticsResponse:
    """Return live system counts for users, projects, issues, and severities.

    Admin-only. Computes all counts via SQL aggregations in PostgreSQL.
    """
    user_result = await db.execute(
        select(
            func.count().label("total"),
            func.count(case((User.is_active == True, 1))).label("active"),        # noqa: E712
            func.count(case((User.is_active == False, 1))).label("inactive"),     # noqa: E712
        ).select_from(User)
    )
    user_row = user_result.one()

    proj_result = await db.execute(
        select(
            func.count().label("total"),
            func.count(case((Project.status == ProjectStatus.ACTIVE, 1))).label("active"),
        ).select_from(Project)
    )
    proj_row = proj_result.one()

    issue_result = await db.execute(
        select(
            func.count().label("total"),
            func.count(
                case((
                    Issue.status.in_([
                        IssueStatus.REPORTED,
                        IssueStatus.TRIAGED,
                        IssueStatus.ASSIGNED,
                        IssueStatus.REOPENED,
                    ]),
                    1,
                ))
            ).label("open"),
            func.count(
                case((
                    Issue.status.in_([
                        IssueStatus.IN_DEVELOPMENT,
                        IssueStatus.IN_REVIEW,
                        IssueStatus.IN_TESTING,
                    ]),
                    1,
                ))
            ).label("in_progress"),
            func.count(case((Issue.status == IssueStatus.RESOLVED, 1))).label("resolved"),
            func.count(case((Issue.status == IssueStatus.CLOSED, 1))).label("closed"),
            func.count(
                case((
                    Issue.severity.in_([Severity.CRITICAL, Severity.BLOCKER]),
                    1,
                ))
            ).label("critical"),
            func.count(case((Issue.severity == Severity.MAJOR, 1))).label("high"),
            func.count(case((Issue.severity == Severity.MINOR, 1))).label("medium"),
            func.count(case((Issue.priority == Priority.LOW, 1))).label("low"),
        ).select_from(Issue)
    )
    issue_row = issue_result.one()

    return SystemAnalyticsResponse(
        total_users=user_row.total,
        active_users=user_row.active,
        inactive_users=user_row.inactive,
        total_projects=proj_row.total,
        active_projects=proj_row.active,
        total_issues=issue_row.total,
        open_issues=issue_row.open,
        in_progress_issues=issue_row.in_progress,
        resolved_issues=issue_row.resolved,
        closed_issues=issue_row.closed,
        critical_issues=issue_row.critical,
        high_issues=issue_row.high,
        medium_issues=issue_row.medium,
        low_issues=issue_row.low,
    )


# --------------------------------------------------------------------------- #
# B. Status Distribution                                                      #
# --------------------------------------------------------------------------- #

async def get_status_distribution(
    db: AsyncSession,
    current_user: User,
    project_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> IssueStatusDistributionResponse:
    """Return issue status distribution respecting RBAC and optional filters."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be greater than end_date.",
        )

    query = select(Issue.status, func.count().label("cnt")).group_by(Issue.status)

    if current_user.role == UserRole.DEVELOPER:
        query = query.where(Issue.assignee_id == current_user.id)
    elif current_user.role == UserRole.TESTER:
        query = query.where(Issue.reporter_id == current_user.id)

    if project_id is not None:
        query = query.where(Issue.project_id == project_id)
    if start_date is not None:
        query = query.where(Issue.created_at >= start_date)
    if end_date is not None:
        query = query.where(Issue.created_at <= end_date)

    result = await db.execute(query)
    counts = {row.status: row.cnt for row in result.all()}

    return IssueStatusDistributionResponse(
        REPORTED=counts.get(IssueStatus.REPORTED, 0),
        TRIAGED=counts.get(IssueStatus.TRIAGED, 0),
        ASSIGNED=counts.get(IssueStatus.ASSIGNED, 0),
        IN_DEVELOPMENT=counts.get(IssueStatus.IN_DEVELOPMENT, 0),
        IN_REVIEW=counts.get(IssueStatus.IN_REVIEW, 0),
        IN_TESTING=counts.get(IssueStatus.IN_TESTING, 0),
        RESOLVED=counts.get(IssueStatus.RESOLVED, 0),
        CLOSED=counts.get(IssueStatus.CLOSED, 0),
        REOPENED=counts.get(IssueStatus.REOPENED, 0),
    )


# --------------------------------------------------------------------------- #
# C. Severity Distribution                                                    #
# --------------------------------------------------------------------------- #

async def get_severity_distribution(
    db: AsyncSession,
    current_user: User,
    project_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> SeverityDistributionResponse:
    """Return issue severity distribution respecting RBAC and optional filters."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be greater than end_date.",
        )

    query = select(Issue.severity, func.count().label("cnt")).group_by(Issue.severity)

    if current_user.role == UserRole.DEVELOPER:
        query = query.where(Issue.assignee_id == current_user.id)
    elif current_user.role == UserRole.TESTER:
        query = query.where(Issue.reporter_id == current_user.id)

    if project_id is not None:
        query = query.where(Issue.project_id == project_id)
    if start_date is not None:
        query = query.where(Issue.created_at >= start_date)
    if end_date is not None:
        query = query.where(Issue.created_at <= end_date)

    result = await db.execute(query)
    counts = {row.severity: row.cnt for row in result.all()}

    return SeverityDistributionResponse(
        MINOR=counts.get(Severity.MINOR, 0),
        MAJOR=counts.get(Severity.MAJOR, 0),
        CRITICAL=counts.get(Severity.CRITICAL, 0),
        BLOCKER=counts.get(Severity.BLOCKER, 0),
    )


# --------------------------------------------------------------------------- #
# D. Issue Trends                                                              #
# --------------------------------------------------------------------------- #

async def get_issue_trends(
    db: AsyncSession,
    current_user: User,
    interval: str = "day",
    project_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> IssueTrendResponse:
    """Return aggregated issue creation and resolution trends by time interval."""
    interval_clean = interval.strip().lower()
    if interval_clean not in ("day", "week", "month"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interval must be 'day', 'week', or 'month'.",
        )

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be greater than end_date.",
        )

    created_query = select(
        func.date_trunc(interval_clean, Issue.created_at).label("period"),
        func.count().label("cnt"),
    ).group_by("period")

    resolved_query = select(
        func.date_trunc(interval_clean, Issue.resolved_at).label("period"),
        func.count().label("cnt"),
    ).where(Issue.resolved_at.isnot(None)).group_by("period")

    if current_user.role == UserRole.DEVELOPER:
        created_query = created_query.where(Issue.assignee_id == current_user.id)
        resolved_query = resolved_query.where(Issue.assignee_id == current_user.id)
    elif current_user.role == UserRole.TESTER:
        created_query = created_query.where(Issue.reporter_id == current_user.id)
        resolved_query = resolved_query.where(Issue.reporter_id == current_user.id)

    if project_id is not None:
        created_query = created_query.where(Issue.project_id == project_id)
        resolved_query = resolved_query.where(Issue.project_id == project_id)
    if start_date is not None:
        created_query = created_query.where(Issue.created_at >= start_date)
        resolved_query = resolved_query.where(Issue.resolved_at >= start_date)
    if end_date is not None:
        created_query = created_query.where(Issue.created_at <= end_date)
        resolved_query = resolved_query.where(Issue.resolved_at <= end_date)

    created_res = await db.execute(created_query)
    resolved_res = await db.execute(resolved_query)

    created_map: dict[str, int] = {}
    for row in created_res.all():
        if row.period:
            dt_str = row.period.strftime("%Y-%m-%d")
            created_map[dt_str] = row.cnt

    resolved_map: dict[str, int] = {}
    for row in resolved_res.all():
        if row.period:
            dt_str = row.period.strftime("%Y-%m-%d")
            resolved_map[dt_str] = row.cnt

    all_dates = sorted(set(created_map.keys()) | set(resolved_map.keys()))
    items = [
        IssueTrendItem(
            date=d,
            created_count=created_map.get(d, 0),
            resolved_count=resolved_map.get(d, 0),
        )
        for d in all_dates
    ]
    total_created = sum(created_map.values())
    total_resolved = sum(resolved_map.values())

    return IssueTrendResponse(
        interval=interval_clean,
        items=items,
        total_created=total_created,
        total_resolved=total_resolved,
    )


# --------------------------------------------------------------------------- #
# E. All Projects Analytics                                                    #
# --------------------------------------------------------------------------- #

async def get_all_projects_analytics(
    db: AsyncSession,
    current_user: User,
) -> ProjectAnalyticsListResponse:
    """Return aggregated issue metrics and resolution rate for all projects."""
    proj_res = await db.execute(select(Project).order_by(Project.id))
    projects = proj_res.scalars().all()

    issue_query = select(
        Issue.project_id,
        func.count().label("total"),
        func.count(
            case((
                Issue.status.in_([
                    IssueStatus.REPORTED,
                    IssueStatus.TRIAGED,
                    IssueStatus.ASSIGNED,
                    IssueStatus.REOPENED,
                ]),
                1,
            ))
        ).label("open"),
        func.count(
            case((
                Issue.status.in_([
                    IssueStatus.IN_DEVELOPMENT,
                    IssueStatus.IN_REVIEW,
                    IssueStatus.IN_TESTING,
                ]),
                1,
            ))
        ).label("in_progress"),
        func.count(case((Issue.status == IssueStatus.RESOLVED, 1))).label("resolved"),
        func.count(case((Issue.status == IssueStatus.CLOSED, 1))).label("closed"),
        func.count(
            case((
                Issue.severity.in_([Severity.CRITICAL, Severity.BLOCKER]),
                1,
            ))
        ).label("critical"),
    ).group_by(Issue.project_id)

    if current_user.role == UserRole.DEVELOPER:
        issue_query = issue_query.where(Issue.assignee_id == current_user.id)
    elif current_user.role == UserRole.TESTER:
        issue_query = issue_query.where(Issue.reporter_id == current_user.id)

    issue_res = await db.execute(issue_query)
    stats_by_project = {row.project_id: row for row in issue_res.all()}

    items: list[ProjectAnalyticsResponse] = []
    for proj in projects:
        row = stats_by_project.get(proj.id)
        total = row.total if row else 0
        open_cnt = row.open if row else 0
        in_prog = row.in_progress if row else 0
        res_cnt = row.resolved if row else 0
        closed_cnt = row.closed if row else 0
        crit_cnt = row.critical if row else 0
        rate = round((res_cnt / total * 100.0), 2) if total > 0 else 0.0

        items.append(
            ProjectAnalyticsResponse(
                project_id=proj.id,
                project_name=proj.name,
                project_key=proj.project_key,
                total_issues=total,
                open_issues=open_cnt,
                in_progress_issues=in_prog,
                resolved_issues=res_cnt,
                closed_issues=closed_cnt,
                critical_issues=crit_cnt,
                resolution_rate=rate,
            )
        )

    return ProjectAnalyticsListResponse(items=items, total=len(items))


# --------------------------------------------------------------------------- #
# F. Single Project Analytics                                                  #
# --------------------------------------------------------------------------- #

async def get_project_analytics(
    project_id: int,
    db: AsyncSession,
    current_user: User,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> ProjectAnalyticsResponse:
    """Return metrics for a single project. Returns 404 if project is missing."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be greater than end_date.",
        )

    proj_res = await db.execute(select(Project).where(Project.id == project_id))
    project = proj_res.scalar_one_or_none()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )

    issue_query = select(
        func.count().label("total"),
        func.count(
            case((
                Issue.status.in_([
                    IssueStatus.REPORTED,
                    IssueStatus.TRIAGED,
                    IssueStatus.ASSIGNED,
                    IssueStatus.REOPENED,
                ]),
                1,
            ))
        ).label("open"),
        func.count(
            case((
                Issue.status.in_([
                    IssueStatus.IN_DEVELOPMENT,
                    IssueStatus.IN_REVIEW,
                    IssueStatus.IN_TESTING,
                ]),
                1,
            ))
        ).label("in_progress"),
        func.count(case((Issue.status == IssueStatus.RESOLVED, 1))).label("resolved"),
        func.count(case((Issue.status == IssueStatus.CLOSED, 1))).label("closed"),
        func.count(
            case((
                Issue.severity.in_([Severity.CRITICAL, Severity.BLOCKER]),
                1,
            ))
        ).label("critical"),
    ).select_from(Issue).where(Issue.project_id == project_id)

    if current_user.role == UserRole.DEVELOPER:
        issue_query = issue_query.where(Issue.assignee_id == current_user.id)
    elif current_user.role == UserRole.TESTER:
        issue_query = issue_query.where(Issue.reporter_id == current_user.id)

    if start_date is not None:
        issue_query = issue_query.where(Issue.created_at >= start_date)
    if end_date is not None:
        issue_query = issue_query.where(Issue.created_at <= end_date)

    row = (await db.execute(issue_query)).one()
    total = row.total
    res_cnt = row.resolved
    rate = round((res_cnt / total * 100.0), 2) if total > 0 else 0.0

    return ProjectAnalyticsResponse(
        project_id=project.id,
        project_name=project.name,
        project_key=project.project_key,
        total_issues=total,
        open_issues=row.open,
        in_progress_issues=row.in_progress,
        resolved_issues=res_cnt,
        closed_issues=row.closed,
        critical_issues=row.critical,
        resolution_rate=rate,
    )


# --------------------------------------------------------------------------- #
# G. Developer Performance (Admin Only)                                        #
# --------------------------------------------------------------------------- #

async def get_developer_performance(db: AsyncSession) -> DeveloperAnalyticsResponse:
    """Return assignment, resolution, and time metrics for all developers."""
    dev_res = await db.execute(
        select(User)
        .where(User.role == UserRole.DEVELOPER)
        .order_by(User.id)
    )
    developers = dev_res.scalars().all()

    stats_query = select(
        Issue.assignee_id,
        func.count().label("assigned"),
        func.count(
            case((
                Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED]),
                1,
            ))
        ).label("resolved"),
        func.count(
            case((
                Issue.status.notin_([IssueStatus.RESOLVED, IssueStatus.CLOSED]),
                1,
            ))
        ).label("open"),
        func.avg(
            case((
                Issue.resolved_at.isnot(None),
                func.extract("epoch", Issue.resolved_at - Issue.created_at) / 3600.0,
            ))
        ).label("avg_res_time"),
    ).where(Issue.assignee_id.isnot(None)).group_by(Issue.assignee_id)

    stats_res = await db.execute(stats_query)
    stats_by_dev = {row.assignee_id: row for row in stats_res.all()}

    items: list[DeveloperAnalyticsItem] = []
    for dev in developers:
        row = stats_by_dev.get(dev.id)
        assigned = row.assigned if row else 0
        resolved = row.resolved if row else 0
        open_cnt = row.open if row else 0
        avg_time = float(row.avg_res_time) if (row and row.avg_res_time is not None) else None
        if avg_time is not None:
            avg_time = round(avg_time, 2)
        rate = round((resolved / assigned * 100.0), 2) if assigned > 0 else 0.0

        items.append(
            DeveloperAnalyticsItem(
                developer_id=dev.id,
                developer_name=dev.full_name,
                developer_email=dev.email,
                assigned_issues=assigned,
                resolved_issues=resolved,
                open_issues=open_cnt,
                resolution_rate=rate,
                average_resolution_time_hours=avg_time,
            )
        )

    return DeveloperAnalyticsResponse(items=items, total=len(items))


# --------------------------------------------------------------------------- #
# H. Export Issues CSV                                                         #
# --------------------------------------------------------------------------- #

async def export_issues_csv(
    db: AsyncSession,
    current_user: User,
    project_id: int | None = None,
    status_filter: IssueStatus | None = None,
    severity_filter: Severity | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> Response:
    """Generate and return an RFC 4180 compliant CSV export of filtered issues."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be greater than end_date.",
        )

    query = (
        select(Issue)
        .options(
            selectinload(Issue.project),
            selectinload(Issue.reporter),
            selectinload(Issue.assignee),
        )
        .order_by(Issue.id)
    )

    if current_user.role == UserRole.DEVELOPER:
        query = query.where(Issue.assignee_id == current_user.id)
    elif current_user.role == UserRole.TESTER:
        query = query.where(Issue.reporter_id == current_user.id)

    if project_id is not None:
        query = query.where(Issue.project_id == project_id)
    if status_filter is not None:
        query = query.where(Issue.status == status_filter)
    if severity_filter is not None:
        query = query.where(Issue.severity == severity_filter)
    if start_date is not None:
        query = query.where(Issue.created_at >= start_date)
    if end_date is not None:
        query = query.where(Issue.created_at <= end_date)

    result = await db.execute(query)
    issues = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header row based on actual Issue model columns
    writer.writerow([
        "id",
        "issue_key",
        "title",
        "status",
        "severity",
        "priority",
        "project",
        "reporter",
        "assignee",
        "created_at",
        "resolved_at",
    ])

    for issue in issues:
        proj_str = issue.project.name if issue.project else ""
        reporter_str = issue.reporter.full_name if issue.reporter else ""
        assignee_str = issue.assignee.full_name if issue.assignee else ""
        created_str = issue.created_at.isoformat() if issue.created_at else ""
        resolved_str = issue.resolved_at.isoformat() if issue.resolved_at else ""

        writer.writerow([
            issue.id,
            issue.issue_key,
            issue.title,
            issue.status.value if hasattr(issue.status, "value") else str(issue.status),
            issue.severity.value if hasattr(issue.severity, "value") else str(issue.severity),
            issue.priority.value if hasattr(issue.priority, "value") else str(issue.priority),
            proj_str,
            reporter_str,
            assignee_str,
            created_str,
            resolved_str,
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="issues_export.csv"',
            "Content-Type": "text/csv; charset=utf-8",
        },
    )
