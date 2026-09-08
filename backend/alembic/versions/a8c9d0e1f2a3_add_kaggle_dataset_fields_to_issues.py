"""add_kaggle_dataset_fields_to_issues

Revision ID: a8c9d0e1f2a3
Revises: 469a18a93716
Create Date: 2026-09-08 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8c9d0e1f2a3'
down_revision: Union[str, Sequence[str], None] = '469a18a93716'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add external dataset tracking and categorization columns to issues table."""
    op.add_column('issues', sa.Column('external_id', sa.String(length=100), nullable=True))
    op.add_column('issues', sa.Column('source', sa.String(length=50), server_default='MANUAL', nullable=True))
    op.add_column('issues', sa.Column('category', sa.String(length=100), nullable=True))
    op.add_column('issues', sa.Column('component', sa.String(length=200), nullable=True))
    op.add_column('issues', sa.Column('raw_status', sa.String(length=50), nullable=True))
    op.add_column('issues', sa.Column('raw_resolution', sa.String(length=50), nullable=True))
    op.add_column('issues', sa.Column('raw_priority', sa.String(length=20), nullable=True))

    op.create_index(op.f('ix_issues_external_id'), 'issues', ['external_id'], unique=True)


def downgrade() -> None:
    """Remove external dataset tracking columns from issues table."""
    op.drop_index(op.f('ix_issues_external_id'), table_name='issues')
    op.drop_column('issues', 'raw_priority')
    op.drop_column('issues', 'raw_resolution')
    op.drop_column('issues', 'raw_status')
    op.drop_column('issues', 'component')
    op.drop_column('issues', 'category')
    op.drop_column('issues', 'source')
    op.drop_column('issues', 'external_id')
