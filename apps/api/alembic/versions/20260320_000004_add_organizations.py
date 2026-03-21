"""add organizations

Revision ID: 20260320_000004
Revises: 20260319_000003
Create Date: 2026-03-20 02:30:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260320_000004"
down_revision = "20260319_000003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("github_url", sa.Text(), nullable=False),
        sa.Column("one_liner", sa.Text(), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("github_url"),
    )
    op.create_index("ix_organizations_created_at", "organizations", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_organizations_created_at", table_name="organizations")
    op.drop_table("organizations")
