"""
Pydantic schemas for Analytics, Reporting & Dashboards — Phase 9.

All metrics are calculated via PostgreSQL aggregations.
No sensitive data (passwords, tokens, OTPs) is exposed.
"""

from pydantic import BaseModel, ConfigDict


# --------------------------------------------------------------------------- #
# System Overview Schema (Admin only)                                          #
# --------------------------------------------------------------------------- #

class SystemAnalyticsResponse(BaseModel):
    """Global system metrics across users, projects, issues, and severities."""

    total_users: int
    active_users: int
    inactive_users: int
    total_projects: int
    active_projects: int
    total_issues: int
    open_issues: int
    in_progress_issues: int
    resolved_issues: int
    closed_issues: int
    critical_issues: int
    high_issues: int
    medium_issues: int
    low_issues: int

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Distribution Schemas                                                         #
# --------------------------------------------------------------------------- #

class IssueStatusDistributionResponse(BaseModel):
    """Issue counts keyed by IssueStatus enum values."""

    REPORTED: int = 0
    TRIAGED: int = 0
    ASSIGNED: int = 0
    IN_DEVELOPMENT: int = 0
    IN_REVIEW: int = 0
    IN_TESTING: int = 0
    RESOLVED: int = 0
    CLOSED: int = 0
    REOPENED: int = 0

    model_config = ConfigDict(from_attributes=True)


class SeverityDistributionResponse(BaseModel):
    """Issue counts keyed by Severity enum values."""

    MINOR: int = 0
    MAJOR: int = 0
    CRITICAL: int = 0
    BLOCKER: int = 0

    model_config = ConfigDict(from_attributes=True)


class PriorityDistributionResponse(BaseModel):
    """Issue counts keyed by Priority enum values."""

    LOW: int = 0
    MEDIUM: int = 0
    HIGH: int = 0
    URGENT: int = 0

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Trends Schemas                                                               #
# --------------------------------------------------------------------------- #

class IssueTrendItem(BaseModel):
    """Aggregated issue creation and resolution count for a specific date period."""

    date: str
    created_count: int
    resolved_count: int

    model_config = ConfigDict(from_attributes=True)


class IssueTrendResponse(BaseModel):
    """Time-series defect creation and resolution trends."""

    interval: str
    items: list[IssueTrendItem]
    total_created: int
    total_resolved: int

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Project Analytics Schemas                                                    #
# --------------------------------------------------------------------------- #

class ProjectAnalyticsResponse(BaseModel):
    """Aggregated issue metrics and resolution rate for a single project."""

    project_id: int
    project_name: str
    project_key: str
    total_issues: int
    open_issues: int
    in_progress_issues: int
    resolved_issues: int
    closed_issues: int
    critical_issues: int
    resolution_rate: float

    model_config = ConfigDict(from_attributes=True)


class ProjectAnalyticsListResponse(BaseModel):
    """List of project analytics items visible to the requester."""

    items: list[ProjectAnalyticsResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Developer Performance Schemas (Admin only)                                   #
# --------------------------------------------------------------------------- #

class DeveloperAnalyticsItem(BaseModel):
    """Performance metrics for an individual developer."""

    developer_id: int
    developer_name: str
    developer_email: str
    assigned_issues: int
    resolved_issues: int
    open_issues: int
    resolution_rate: float
    average_resolution_time_hours: float | None = None

    model_config = ConfigDict(from_attributes=True)


class DeveloperAnalyticsResponse(BaseModel):
    """Aggregated performance metrics across all developers in the system."""

    items: list[DeveloperAnalyticsItem]
    total: int

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Downloadable Report Schema (Admin only)                                      #
# --------------------------------------------------------------------------- #

class AnalyticsReportDataResponse(BaseModel):
    """Aggregated data for generating the downloadable analytics report."""

    system_overview: SystemAnalyticsResponse
    status_distribution: IssueStatusDistributionResponse
    severity_distribution: SeverityDistributionResponse
    priority_distribution: PriorityDistributionResponse
    trends: IssueTrendResponse
    project_analytics: list[ProjectAnalyticsResponse]
    developer_performance: list[DeveloperAnalyticsItem]
    generated_at: str

    model_config = ConfigDict(from_attributes=True)
