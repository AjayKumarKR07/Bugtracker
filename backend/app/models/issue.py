"""
Issue model.

The central entity of the defect tracking system.
An Issue belongs to a Project and is reported by a User.
It may optionally be assigned to a Developer.
"""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


# ------------------------------------------------------------------ #
# Issue enumerations                                                   #
# ------------------------------------------------------------------ #

class IssueType(str, enum.Enum):
    BUG = "BUG"
    FEATURE_REQUEST = "FEATURE_REQUEST"
    ENHANCEMENT = "ENHANCEMENT"
    TECHNICAL_DEBT = "TECHNICAL_DEBT"
    SUPPORT_TICKET = "SUPPORT_TICKET"


class Severity(str, enum.Enum):
    MINOR = "MINOR"
    MAJOR = "MAJOR"
    CRITICAL = "CRITICAL"
    BLOCKER = "BLOCKER"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class IssueStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    IN_DEVELOPMENT = "IN_DEVELOPMENT"
    IN_REVIEW = "IN_REVIEW"
    IN_TESTING = "IN_TESTING"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"


# ------------------------------------------------------------------ #
# Issue model                                                          #
# ------------------------------------------------------------------ #

class Issue(Base):
    """A defect, feature request, or work item tracked within a Project."""

    __tablename__ = "issues"

    # ------------------------------------------------------------------ #
    # Primary key                                                          #
    # ------------------------------------------------------------------ #
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ------------------------------------------------------------------ #
    # Identification                                                       #
    # ------------------------------------------------------------------ #
    issue_key: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # ------------------------------------------------------------------ #
    # Classification                                                       #
    # ------------------------------------------------------------------ #
    issue_type: Mapped[IssueType] = mapped_column(
        Enum(IssueType, name="issuetype", create_type=True),
        nullable=False,
        default=IssueType.BUG,
    )
    severity: Mapped[Severity] = mapped_column(
        Enum(Severity, name="severity", create_type=True),
        nullable=False,
        default=Severity.MAJOR,
    )
    priority: Mapped[Priority] = mapped_column(
        Enum(Priority, name="priority", create_type=True),
        nullable=False,
        default=Priority.MEDIUM,
    )
    status: Mapped[IssueStatus] = mapped_column(
        Enum(IssueStatus, name="issuestatus", create_type=True),
        nullable=False,
        default=IssueStatus.REPORTED,
    )

    # ------------------------------------------------------------------ #
    # Foreign keys                                                         #
    # ------------------------------------------------------------------ #
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    reporter_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    assignee_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # ------------------------------------------------------------------ #
    # Timestamps                                                           #
    # ------------------------------------------------------------------ #
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ------------------------------------------------------------------ #
    # Relationships                                                        #
    # Use explicit foreign_keys= because Issue has two FK columns to User #
    # ------------------------------------------------------------------ #
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="issues",
        foreign_keys=[project_id],
    )
    reporter: Mapped["User"] = relationship(
        "User",
        back_populates="reported_issues",
        foreign_keys=[reporter_id],
    )
    assignee: Mapped["User | None"] = relationship(
        "User",
        back_populates="assigned_issues",
        foreign_keys=[assignee_id],
    )

    def __repr__(self) -> str:
        return (
            f"<Issue id={self.id} key={self.issue_key!r} "
            f"status={self.status} severity={self.severity}>"
        )
