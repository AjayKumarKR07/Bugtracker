"""add_admin_switch_role_audit_action

Revision ID: 94e13357b828
Revises: a8c9d0e1f2a3
Create Date: 2026-09-11 10:07:59.128425

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94e13357b828'
down_revision: Union[str, Sequence[str], None] = 'a8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add ADMIN_SWITCH_ROLE to the PostgreSQL auditaction enum.
    # Alembic does not auto-detect enum label additions, so we use raw DDL.
    op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'ADMIN_SWITCH_ROLE'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL does not support removing enum labels; downgrade is a no-op.
    # The value will remain in the enum but will simply be unused.
    pass
