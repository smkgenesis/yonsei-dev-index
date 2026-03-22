"""add organization submissions

Revision ID: 20260322_000005
Revises: 20260320_000004
Create Date: 2026-03-22 16:45:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260322_000005"
down_revision = "20260320_000004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organization_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("applicant_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reviewer_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("github_url", sa.Text(), nullable=False),
        sa.Column("one_liner", sa.Text(), nullable=False),
        sa.Column("additional_context", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["applicant_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_organization_submissions_created_at",
        "organization_submissions",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_organization_submissions_status",
        "organization_submissions",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_organization_submissions_status", table_name="organization_submissions")
    op.drop_index("ix_organization_submissions_created_at", table_name="organization_submissions")
    op.drop_table("organization_submissions")
