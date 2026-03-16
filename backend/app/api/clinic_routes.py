from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.appointment import Appointment
from app.models.message import Message
from app.models.triage import TriageLog
from app.services.appointment_service import get_dashboard_stats

router = APIRouter(prefix="/clinic", tags=["Clinic"])


@router.get("/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_dashboard_stats(db, current_user.clinic_id)


@router.get("/appointments/trend")
async def appointment_trend(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(
            func.date(Appointment.appointment_time).label("date"),
            func.count(Appointment.id).label("count")
        )
        .where(Appointment.clinic_id == current_user.clinic_id, Appointment.appointment_time >= cutoff)
        .group_by(func.date(Appointment.appointment_time))
        .order_by(func.date(Appointment.appointment_time))
    )
    rows = result.fetchall()
    return [{"date": str(row.date), "count": row.count} for row in rows]


@router.get("/triage/urgency-distribution")
async def triage_urgency_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(TriageLog.urgency_level, func.count(TriageLog.id).label("count"))
        .where(TriageLog.clinic_id == current_user.clinic_id)
        .group_by(TriageLog.urgency_level)
    )
    rows = result.fetchall()
    return [{"urgency": str(row.urgency_level), "count": row.count} for row in rows]


@router.get("/messages/volume")
async def message_volume(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(
            func.date(Message.created_at).label("date"),
            func.count(Message.id).label("count")
        )
        .where(
            Message.clinic_id == current_user.clinic_id,
            Message.created_at >= cutoff,
            Message.direction == "outbound"
        )
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at))
    )
    rows = result.fetchall()
    return [{"date": str(row.date), "count": row.count} for row in rows]
