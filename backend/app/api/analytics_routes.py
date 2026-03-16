from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from datetime import datetime, timedelta
import random

from app.database import get_db
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus
from app.models.triage import TriageLog, TriageUrgency

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Mock data for now to fix frontend errors
    # TODO: Implement real queries against database
    
    # Example logic for real implementation:
    # total_patients = await db.scalar(select(func.count(Patient.id)))
    
    return {
        "total_patients": 124,
        "appointments_today": 8,
        "appointments_this_month": 45,
        "no_show_rate": 12,
        "messages_sent_this_month": 342,
        "active_campaigns": 2,
        "triage_sessions": 15
    }


@router.get("/appointments/trend")
async def get_appointment_trend(days: int = 30, db: AsyncSession = Depends(get_db)):
    # consistent mock data
    today = datetime.now()
    data = []
    for i in range(days):
        date = (today - timedelta(days=days-i-1)).strftime("%Y-%m-%d")
        data.append({
            "date": date,
            "count": random.randint(2, 10)
        })
    return data


@router.get("/triage/urgency-distribution")
async def get_triage_distribution(db: AsyncSession = Depends(get_db)):
    return [
        {"name": "Low", "value": 45, "fill": "#10b981"},
        {"name": "Medium", "value": 30, "fill": "#f59e0b"},
        {"name": "High", "value": 15, "fill": "#f97316"},
        {"name": "Critical", "value": 10, "fill": "#ef4444"},
    ]


@router.get("/messages/volume")
async def get_message_volume(days: int = 30, db: AsyncSession = Depends(get_db)):
    today = datetime.now()
    data = []
    for i in range(days):
        date = (today - timedelta(days=days-i-1)).strftime("%Y-%m-%d")
        data.append({
            "date": date,
            "count": random.randint(10, 50)
        })
    return data
