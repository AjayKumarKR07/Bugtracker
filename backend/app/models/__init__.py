"""
Models package.

Imports all ORM models so that Base.metadata is fully
populated when Alembic inspects it for autogeneration.
"""

from app.models.email_otp import EmailOTP
from app.models.issue import (
    Issue,
    IssueStatus,
    IssueType,
    Priority,
    Severity,
)
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole

__all__ = [
    # Models
    "User",
    "Project",
    "Issue",
    "EmailOTP",
    # Enums
    "UserRole",
    "ProjectStatus",
    "IssueType",
    "Severity",
    "Priority",
    "IssueStatus",
]
