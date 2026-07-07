"""add medical_records, patient_invoices, patient_queue tables and extend triage_logs/appointments

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New table: medical_records
    op.create_table(
        "medical_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("clinic_id", sa.Uuid(), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("doctor_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("record_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("value", postgresql.JSON(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # New table: patient_invoices
    op.create_table(
        "patient_invoices",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("clinic_id", sa.Uuid(), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("amount", sa.DECIMAL(10, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("pending", "paid", "failed", "cancelled", name="patient_invoice_status"), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invoice_pdf_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # New table: patient_queue
    op.create_table(
        "patient_queue",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("clinic_id", sa.Uuid(), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("patient_id", sa.Uuid(), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("appointment_id", sa.Uuid(), sa.ForeignKey("appointments.id"), nullable=True),
        sa.Column("status", sa.Enum("ai_conversing", "pending_review", "waiting", "in_consultation", "completed", name="queue_status"), nullable=True),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("status_changed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Extend triage_logs: add doctor_note and reviewed_by
    op.add_column("triage_logs", sa.Column("doctor_note", sa.Text(), nullable=True))
    op.add_column("triage_logs", sa.Column("reviewed_by", sa.Uuid(), sa.ForeignKey("users.id"), nullable=True))

    # Extend appointments: add checked_in_at and in_consultation_at
    op.add_column("appointments", sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("appointments", sa.Column("in_consultation_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove columns from appointments
    op.drop_column("appointments", "in_consultation_at")
    op.drop_column("appointments", "checked_in_at")

    # Remove columns from triage_logs
    op.drop_column("triage_logs", "reviewed_by")
    op.drop_column("triage_logs", "doctor_note")

    # Drop tables
    op.drop_table("patient_queue")
    op.drop_table("patient_invoices")
    op.drop_table("medical_records")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS patient_invoice_status")
    op.execute("DROP TYPE IF EXISTS queue_status")
