from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.schemas.patient_schema import PatientCreate, PatientUpdate, PatientResponse
from app.services.patient_service import (
    create_patient, get_patients, get_patient, update_patient, deactivate_patient
)
from app.services.messaging_service import send_welcome_message
from app.services.clinic_service import get_clinic

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    skip: int = 0,
    limit: int = Query(50, le=200),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_patients(db, current_user.clinic_id, skip, limit, search)


@router.post("/", response_model=PatientResponse, status_code=201)
async def add_patient(
    data: PatientCreate,
    send_welcome: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = await create_patient(db, current_user.clinic_id, data)
    if send_welcome and patient.phone:
        clinic = await get_clinic(db, current_user.clinic_id)
        await send_welcome_message(
            patient.name,
            patient.phone,
            clinic.name if clinic else "our clinic"
        )
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient_detail(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = await get_patient(db, current_user.clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient_detail(
    patient_id: uuid.UUID,
    data: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = await get_patient(db, current_user.clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return await update_patient(db, patient, data)


@router.delete("/{patient_id}")
async def remove_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = await get_patient(db, current_user.clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await deactivate_patient(db, patient)
    return {"message": "Patient deactivated"}
