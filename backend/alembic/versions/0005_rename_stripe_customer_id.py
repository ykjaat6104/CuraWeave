"""rename stripe_customer_id to gateway_customer_id

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-05 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0005'
down_revision: Union[str, None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('subscriptions', 'stripe_customer_id', new_column_name='gateway_customer_id')


def downgrade() -> None:
    op.alter_column('subscriptions', 'gateway_customer_id', new_column_name='stripe_customer_id')
