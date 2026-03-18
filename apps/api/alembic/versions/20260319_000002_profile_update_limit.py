"""add profile update limit fields

Revision ID: 20260319_000002
Revises: 20260318_000001
Create Date: 2026-03-19 04:20:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "20260319_000002"
down_revision = "20260318_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column("settings_update_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "profiles",
        sa.Column("settings_update_window_started_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("profiles", "settings_update_window_started_at")
    op.drop_column("profiles", "settings_update_count")
