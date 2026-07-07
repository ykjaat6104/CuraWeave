"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # ── enums ──────────────────────────────────────────────────────
    sa.Enum("admin", "doctor", "staff", name="userrole").create(op.get_bind())
    sa.Enum(
        "scheduled", "confirmed", "completed", "cancelled", "no_show",
        name="appointmentstatus",
    ).create(op.get_bind())
    sa.Enum(
        "monday", "tuesday", "wednesday", "thursday", "friday",
        "saturday", "sunday", name="weekday",
    ).create(op.get_bind())
    sa.Enum(
        "sent", "delivered", "failed", name="messagestatus",
    ).create(op.get_bind())
    sa.Enum("low", "medium", "high", name="triageurgency").create(op.get_bind())
    sa.Enum(
        "free", "basic", "pro", "enterprise", name="subscriptionplan_enum",
    ).create(op.get_bind())
    sa.Enum(
        "active", "canceled", "trial", name="subscription_status",
    ).create(op.get_bind())
    sa.Enum(
        "paid", "pending", "failed", name="invoice_status",
    ).create(op.get_bind())
    sa.Enum(
        "draft", "active", "completed", "archived", name="campaign_status",
    ).create(op.get_bind())
    sa.Enum(
        "whatsapp", "sms", "email", name="message_channel",
    ).create(op.get_bind())
    sa.Enum(
        "inbound", "outbound", name="message_direction",
    ).create(op.get_bind())

    # ── clinics ─────────────────────────────────────────────────────
    op.create_table(
        "clinics",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("address", sa.Text),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.text("now()")),
    )

    # ── users ───────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("name", sa.String(255)),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "doctor", "staff", name="userrole", create_type=False), server_default="staff"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── patients ────────────────────────────────────────────────────
    op.create_table(
        "patients",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("email", sa.String(255)),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("date_of_birth", sa.Date()),
        sa.Column("gender", sa.String(20)),
        sa.Column("notes", sa.Text),
        sa.Column("tags", JSONB, server_default=sa.text("'[]'::jsonb")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── patient_doctor_links ────────────────────────────────────────
    op.create_table(
        "patient_doctor_links",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("doctor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("connection_code", sa.String(255), unique=True, nullable=False),
        sa.Column("connected_at", sa.DateTime(timezone=True)),
        sa.Column("last_sent_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("clinic_id", "doctor_id", "patient_id"),
    )

    # ── appointments ────────────────────────────────────────────────
    op.create_table(
        "appointments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("doctor_id", UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("appointment_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), server_default=sa.text("30")),
        sa.Column("status", sa.Enum("scheduled", "confirmed", "completed", "cancelled", "no_show", name="appointmentstatus", create_type=False), server_default="scheduled"),
        sa.Column("reason", sa.Text),
        sa.Column("notes", sa.Text),
        sa.Column("reminder_sent", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("follow_up_sent", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.text("now()")),
    )

    # ── doctor_availability ─────────────────────────────────────────
    op.create_table(
        "doctor_availability",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("doctor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("day_of_week", sa.Enum("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", name="weekday", create_type=False), nullable=False),
        sa.Column("start_time", sa.String(), nullable=False),
        sa.Column("end_time", sa.String(), nullable=False),
        sa.Column("slot_duration", sa.Integer(), server_default=sa.text("30")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.text("now()")),
    )

    # ── messages ────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("channel", sa.Enum("whatsapp", "sms", "email", name="message_channel", create_type=False)),
        sa.Column("direction", sa.Enum("inbound", "outbound", name="message_direction", create_type=False)),
        sa.Column("status", sa.Enum("sent", "delivered", "failed", name="messagestatus", create_type=False), server_default="sent"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── triage_logs ─────────────────────────────────────────────────
    op.create_table(
        "triage_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id")),
        sa.Column("symptoms", sa.Text),
        sa.Column("urgency_level", sa.Enum("low", "medium", "high", name="triageurgency", create_type=False), server_default="low"),
        sa.Column("ai_response", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── campaigns ───────────────────────────────────────────────────
    op.create_table(
        "campaigns",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message_template", sa.Text, nullable=False),
        sa.Column("target_segment", sa.String(100)),
        sa.Column("status", sa.Enum("draft", "active", "completed", "archived", name="campaign_status", create_type=False), server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.text("now()")),
    )

    # ── campaign_messages ───────────────────────────────────────────
    op.create_table(
        "campaign_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("campaign_id", UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("status", sa.Enum("sent", "delivered", "failed", name="messagestatus", create_type=False), server_default="sent"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── subscription_plans ──────────────────────────────────────────
    op.create_table(
        "subscription_plans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("price", sa.DECIMAL(10, 2), nullable=False),
        sa.Column("message_limit", sa.Integer(), server_default=sa.text("0")),
        sa.Column("ai_requests_limit", sa.Integer(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── subscriptions ───────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("plan_id", UUID(as_uuid=True), sa.ForeignKey("subscription_plans.id"), nullable=False),
        sa.Column("stripe_customer_id", sa.String(255)),
        sa.Column("status", sa.Enum("active", "canceled", "trial", name="subscription_status", create_type=False), server_default="trial"),
        sa.Column("current_period_start", sa.DateTime(timezone=True)),
        sa.Column("current_period_end", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── invoices ────────────────────────────────────────────────────
    op.create_table(
        "invoices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("subscription_id", UUID(as_uuid=True), sa.ForeignKey("subscriptions.id"), nullable=False),
        sa.Column("amount", sa.DECIMAL(10, 2), nullable=False),
        sa.Column("status", sa.Enum("paid", "pending", "failed", name="invoice_status", create_type=False), server_default="pending"),
        sa.Column("invoice_date", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── knowledge_base ──────────────────────────────────────────────
    op.create_table(
        "knowledge_base",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("embedding", JSONB, nullable=True),
        sa.Column("metadata", JSONB, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.text("now()")),
    )

    # ── audit_logs ──────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clinic_id", UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True)),
        sa.Column("action", sa.String(255), nullable=False),
        sa.Column("resource", sa.String(255), nullable=False),
        sa.Column("resource_id", sa.String(255)),
        sa.Column("details", sa.Text),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── indexes ─────────────────────────────────────────────────────
    op.create_index("idx_users_clinic", "users", ["clinic_id"])
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_patients_clinic", "patients", ["clinic_id"])
    op.create_index("idx_patients_email", "patients", ["email"])
    op.create_index("idx_appointments_clinic", "appointments", ["clinic_id"])
    op.create_index("idx_appointments_patient", "appointments", ["patient_id"])
    op.create_index("idx_appointments_time", "appointments", ["appointment_time"])
    op.create_index("idx_messages_clinic", "messages", ["clinic_id"])
    op.create_index("idx_messages_patient", "messages", ["patient_id"])
    op.create_index("idx_triage_clinic", "triage_logs", ["clinic_id"])
    op.create_index("idx_triage_patient", "triage_logs", ["patient_id"])
    op.create_index("idx_campaigns_clinic", "campaigns", ["clinic_id"])
    op.create_index("idx_subscriptions_clinic", "subscriptions", ["clinic_id"])
    op.create_index("idx_invoices_clinic", "invoices", ["clinic_id"])
    op.create_index("idx_kb_clinic", "knowledge_base", ["clinic_id"])
    op.create_index("idx_audit_clinic", "audit_logs", ["clinic_id"])
    op.create_index("idx_audit_action", "audit_logs", ["clinic_id", "action"])

    # pgvector index on knowledge_base.embedding
    op.execute(
        "CREATE INDEX idx_kb_embedding ON knowledge_base "
        "USING ivfflat (embedding vector_cosine_ops) "
        "WITH (lists = 100)"
    )

    # GIN index on knowledge_base.metadata for JSONB querying
    op.execute(
        "CREATE INDEX idx_kb_metadata ON knowledge_base USING GIN (metadata)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_kb_metadata")
    op.execute("DROP INDEX IF EXISTS idx_kb_embedding")
    op.drop_table("audit_logs")
    op.drop_table("knowledge_base")
    op.drop_table("invoices")
    op.drop_table("subscriptions")
    op.drop_table("subscription_plans")
    op.drop_table("campaign_messages")
    op.drop_table("campaigns")
    op.drop_table("triage_logs")
    op.drop_table("messages")
    op.drop_table("doctor_availability")
    op.drop_table("appointments")
    op.drop_table("patient_doctor_links")
    op.drop_table("patients")
    op.drop_table("users")
    op.drop_table("clinics")

    sa.Enum(name="userrole").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="appointmentstatus").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="weekday").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="messagestatus").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="triageurgency").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="subscriptionplan_enum").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="subscription_status").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="invoice_status").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="campaign_status").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="message_channel").drop(op.get_bind(), if_exists=True)
    sa.Enum(name="message_direction").drop(op.get_bind(), if_exists=True)
