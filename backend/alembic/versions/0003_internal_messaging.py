"""add sender_id and recipient_id to messages for internal messaging

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("sender_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("messages", sa.Column("recipient_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "recipient_id")
    op.drop_column("messages", "sender_id")
