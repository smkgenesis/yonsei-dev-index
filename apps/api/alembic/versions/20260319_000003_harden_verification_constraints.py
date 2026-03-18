"""harden verification constraints

Revision ID: 20260319_000003
Revises: 20260319_000002
Create Date: 2026-03-19 04:55:00
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260319_000003"
down_revision = "20260319_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_verifications_verified_email",
        "verifications",
        ["verified_email"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_verifications_verified_email",
        "verifications",
        type_="unique",
    )
