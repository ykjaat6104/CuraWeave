"""add email_verified to users and patients, new config columns

Revision ID: 0002
Revises: 0001
Create Date: 2025-01-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), server_default=sa.text("false")))
    op.add_column("patients", sa.Column("email_verified", sa.Boolean(), server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("patients", "email_verified")
    op.drop_column("users", "email_verified")
