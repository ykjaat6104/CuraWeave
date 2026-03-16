from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.appointment import AppointmentStatus
from app.schemas.appointment_schema import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.appointment_service import (
    create_appointment, get_appointments, get_appointment, update_appointment
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("/", response_model=List[AppointmentResponse])
async def list_appointments(
    skip: int = 0,
    limit: int = Query(50, le=200),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    status: Optional[AppointmentStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_appointments(db, current_user.clinic_id, skip, limit, date_from, date_to, status)


@router.post("/", response_model=AppointmentResponse, status_code=201)
async def create_new_appointment(
    data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await create_appointment(db, current_user.clinic_id, data)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_detail(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = await get_appointment(db, current_user.clinic_id, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_detail(
    appointment_id: uuid.UUID,
    data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = await get_appointment(db, current_user.clinic_id, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return await update_appointment(db, appt, data)


@router.post("/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = await get_appointment(db, current_user.clinic_id, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = AppointmentStatus.CONFIRMED
    await db.commit()
    return {"message": "Appointment confirmed", "id": str(appointment_id)}


@router.post("/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = await get_appointment(db, current_user.clinic_id, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = AppointmentStatus.COMPLETED
    await db.commit()
    return {"message": "Appointment marked as completed", "id": str(appointment_id)}
