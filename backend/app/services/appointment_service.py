from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional, List
import uuid

from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.message import Message
from app.models.triage import TriageLog
from app.models.campaign import Campaign
from app.schemas.appointment_schema import AppointmentCreate, AppointmentUpdate


async def create_appointment(db: AsyncSession, clinic_id: uuid.UUID, data: AppointmentCreate) -> Appointment:
    appointment = Appointment(clinic_id=clinic_id, **data.model_dump())
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return appointment


async def get_appointments(
    db: AsyncSession, clinic_id: uuid.UUID,
    skip: int = 0, limit: int = 50,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    status: Optional[AppointmentStatus] = None
) -> List[Appointment]:
    query = select(Appointment).where(Appointment.clinic_id == clinic_id)
    if date_from:
        query = query.where(Appointment.appointment_time >= date_from)
    if date_to:
        query = query.where(Appointment.appointment_time <= date_to)
    if status:
        query = query.where(Appointment.status == status)
    query = query.offset(skip).limit(limit).order_by(Appointment.appointment_time.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def get_appointment(db: AsyncSession, clinic_id: uuid.UUID, appointment_id: uuid.UUID) -> Optional[Appointment]:
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == clinic_id
        )
    )
    return result.scalar_one_or_none()


async def update_appointment(db: AsyncSession, appt: Appointment, data: AppointmentUpdate) -> Appointment:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(appt, field, value)
    await db.commit()
    await db.refresh(appt)
    return appt


async def get_dashboard_stats(db: AsyncSession, clinic_id: uuid.UUID) -> dict:
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    total_patients = await db.execute(
        select(func.count(Patient.id)).where(Patient.clinic_id == clinic_id, Patient.is_active == True)
    )
    total_patients = total_patients.scalar() or 0

    appts_today = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.clinic_id == clinic_id,
            Appointment.appointment_time >= today_start,
            Appointment.appointment_time < today_end
        )
    )
    appts_today = appts_today.scalar() or 0

    appts_month = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.clinic_id == clinic_id,
            Appointment.appointment_time >= month_start
        )
    )
    appts_month = appts_month.scalar() or 0

    completed = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.clinic_id == clinic_id,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.appointment_time >= month_start
        )
    )
    no_shows = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.clinic_id == clinic_id,
            Appointment.status == AppointmentStatus.NO_SHOW,
            Appointment.appointment_time >= month_start
        )
    )
    completed_val = completed.scalar() or 0
    no_show_val = no_shows.scalar() or 0
    total_appts = completed_val + no_show_val
    no_show_rate = (no_show_val / total_appts * 100) if total_appts > 0 else 0.0

    msgs_month = await db.execute(
        select(func.count(Message.id)).where(
            Message.clinic_id == clinic_id,
            Message.created_at >= month_start,
            Message.direction == "outbound"
        )
    )
    msgs_month = msgs_month.scalar() or 0

    active_campaigns = await db.execute(
        select(func.count(Campaign.id)).where(
            Campaign.clinic_id == clinic_id,
            Campaign.status.in_(["running", "scheduled"])
        )
    )
    active_campaigns = active_campaigns.scalar() or 0

    triage_sessions = await db.execute(
        select(func.count(TriageLog.id)).where(
            TriageLog.clinic_id == clinic_id,
            TriageLog.created_at >= month_start
        )
    )
    triage_sessions = triage_sessions.scalar() or 0

    return {
        "total_patients": total_patients,
        "appointments_today": appts_today,
        "appointments_this_month": appts_month,
        "no_show_rate": round(no_show_rate, 1),
        "messages_sent_this_month": msgs_month,
        "active_campaigns": active_campaigns,
        "revenue_this_month": 0.0,
        "triage_sessions": triage_sessions,
    }
