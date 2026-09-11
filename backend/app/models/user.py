"""
User model.

Represents any authenticated actor in the system.
Actual password hashing (bcrypt) is implemented in Phase 3.
"""

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, TypeDecorator, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserRole(str, enum.Enum):
    """Roles available in the system.

    ADMIN  — system administrator, full access
    TESTER — assigned issue investigator, tester, and verifier
    USER   — issue reporter (public portal user)
    """
    ADMIN  = "ADMIN"
    TESTER = "TESTER"
    USER   = "USER"


class SafeUserRoleType(TypeDecorator):
    """SQLAlchemy type decorator that maps legacy DB DEVELOPER records to TESTER cleanly prior to database migration."""

    impl = Enum("ADMIN", "TESTER", "USER", "DEVELOPER", name="userrole", create_type=True)
    cache_ok = True

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if value == "DEVELOPER":
            return UserRole.TESTER
        return UserRole(value)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value.value
        return str(value)


class User(Base):
    """Registered user / team member."""

    __tablename__ = "users"

    # ------------------------------------------------------------------ #
    # Primary key                                                          #
    # ------------------------------------------------------------------ #
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ------------------------------------------------------------------ #
    # Identity                                                             #
    # ------------------------------------------------------------------ #
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # ------------------------------------------------------------------ #
    # Role & status                                                        #
    # ------------------------------------------------------------------ #
    role: Mapped[UserRole] = mapped_column(
        SafeUserRoleType,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

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
    # ------------------------------------------------------------------ #
    reported_issues: Mapped[list["Issue"]] = relationship(
        "Issue",
        back_populates="reporter",
        foreign_keys="Issue.reporter_id",
    )
    assigned_issues: Mapped[list["Issue"]] = relationship(
        "Issue",
        back_populates="assignee",
        foreign_keys="Issue.assignee_id",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
