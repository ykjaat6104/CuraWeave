import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinic import Clinic
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus
from app.models.triage import TriageLog, TriageUrgency
from app.models.audit import AuditLog
from app.models.knowledge_base import KnowledgeBase
from app.models.subscription import SubscriptionPlan, Subscription, Invoice
from app.models.message import Message
from app.models.campaign import Campaign


@pytest.mark.asyncio
async def test_create_clinic(db_session: AsyncSession):
    clinic = Clinic(
        name="Test Clinic",
        email="unique@clinic.com",
        phone="+1234567890",
        is_active=True,
    )
    db_session.add(clinic)
    await db_session.commit()

    result = await db_session.execute(select(Clinic).where(Clinic.email == "unique@clinic.com"))
    found = result.scalar_one()
    assert found.name == "Test Clinic"
    assert found.is_active is True
    assert found.id is not None


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession, test_clinic: dict):
    user = User(
        clinic_id=test_clinic["clinic_id"],
        name="Dr. Smith",
        email="dr.smith@clinic.com",
        password_hash="hashed_password",
        role=UserRole.DOCTOR,
    )
    db_session.add(user)
    await db_session.commit()

    result = await db_session.execute(select(User).where(User.email == "dr.smith@clinic.com"))
    found = result.scalar_one()
    assert found.name == "Dr. Smith"
    assert found.role == UserRole.DOCTOR
    assert str(found.clinic_id) == str(test_clinic["clinic_id"])


@pytest.mark.asyncio
async def test_create_patient(db_session: AsyncSession, test_clinic: dict):
    patient = Patient(
        clinic_id=test_clinic["clinic_id"],
        name="John Doe",
        phone="+123456789",
        email="john@example.com",
    )
    db_session.add(patient)
    await db_session.commit()

    assert patient.id is not None
    assert patient.is_active is True


@pytest.mark.asyncio
async def test_create_appointment(db_session: AsyncSession, test_clinic: dict, test_patient: dict):
    from datetime import datetime, timedelta

    appointment = Appointment(
        clinic_id=test_clinic["clinic_id"],
        patient_id=test_patient["patient_id"],
        doctor_id=test_clinic["user_id"],
        appointment_time=datetime.utcnow() + timedelta(days=2),
        reason="Annual checkup",
    )
    db_session.add(appointment)
    await db_session.commit()

    assert appointment.id is not None
    assert appointment.status == AppointmentStatus.SCHEDULED
    assert appointment.duration_minutes == 30


@pytest.mark.asyncio
async def test_create_triage_log(db_session: AsyncSession, test_clinic: dict, test_patient: dict):
    log = TriageLog(
        clinic_id=test_clinic["clinic_id"],
        patient_id=test_patient["patient_id"],
        symptoms="headache, fever",
        urgency_level=TriageUrgency.MEDIUM,
        ai_response="Please schedule an appointment.",
    )
    db_session.add(log)
    await db_session.commit()

    assert log.id is not None
    assert log.urgency_level == TriageUrgency.MEDIUM


@pytest.mark.asyncio
async def test_create_audit_log(db_session: AsyncSession, test_clinic: dict):
    log = AuditLog(
        clinic_id=test_clinic["clinic_id"],
        user_id=test_clinic["user_id"],
        action="patient.viewed",
        resource="patients",
        resource_id=str(uuid.uuid4()),
        ip_address="127.0.0.1",
    )
    db_session.add(log)
    await db_session.commit()

    assert log.id is not None
    assert log.action == "patient.viewed"


@pytest.mark.asyncio
async def test_create_knowledge_base(db_session: AsyncSession, test_clinic: dict):
    doc = KnowledgeBase(
        clinic_id=test_clinic["clinic_id"],
        title="Headache Treatment Guidelines",
        content="Common headaches can be treated with rest and hydration...",
        meta_data={"specialty": "general", "urgency": "low"},
    )
    db_session.add(doc)
    await db_session.commit()

    assert doc.id is not None
    assert doc.meta_data["specialty"] == "general"


@pytest.mark.asyncio
async def test_subscription_plan(db_session: AsyncSession, test_clinic: dict):
    plan = SubscriptionPlan(
        name="basic",
        price=49.00,
        message_limit=2000,
        ai_requests_limit=500,
    )
    db_session.add(plan)
    await db_session.commit()

    sub = Subscription(
        clinic_id=test_clinic["clinic_id"],
        plan_id=plan.id,
        gateway_customer_id="pay_test123",
        status="active",
    )
    db_session.add(sub)
    await db_session.commit()

    invoice = Invoice(
        clinic_id=test_clinic["clinic_id"],
        subscription_id=sub.id,
        amount=49.00,
        status="paid",
    )
    db_session.add(invoice)
    await db_session.commit()

    assert sub.status == "active"
    assert invoice.amount == 49.00


@pytest.mark.asyncio
async def test_clinic_deactivation(db_session: AsyncSession, test_clinic: dict):
    result = await db_session.execute(select(Clinic).where(Clinic.id == test_clinic["clinic_id"]))
    clinic = result.scalar_one()
    clinic.is_active = False
    await db_session.commit()

    await db_session.refresh(clinic)
    assert clinic.is_active is False
