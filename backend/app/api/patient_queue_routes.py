from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_user, get_tenant_id
from app.models.user import User
from app.schemas.patient_queue_schema import PatientQueueCreate, PatientQueueUpdate, PatientQueueResponse
from app.services.patient_queue_service import create_queue_entry, update_queue_status, get_queue

router = APIRouter(prefix="/patient-queue", tags=["Patient Queue"])


@router.get("/", response_model=List[PatientQueueResponse])
async def list_queue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    entries = await get_queue(db, clinic_id=tenant_id)
    result = []
    for e in entries:
        result.append(PatientQueueResponse(
            id=e.id, clinic_id=e.clinic_id, patient_id=e.patient_id,
            appointment_id=e.appointment_id, status=e.status.value,
            checked_in_at=e.checked_in_at, status_changed_at=e.status_changed_at,
            notes=e.notes, created_at=e.created_at,
            patient_name=e.patient.name if e.patient else None,
            patient_phone=e.patient.phone if e.patient else None,
        ))
    return result


@router.post("/", response_model=PatientQueueResponse)
async def create_queue_route(
    data: PatientQueueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    entry = await create_queue_entry(
        db=db, clinic_id=tenant_id, patient_id=data.patient_id,
        appointment_id=data.appointment_id, notes=data.notes,
    )
    return PatientQueueResponse(
        id=entry.id, clinic_id=entry.clinic_id, patient_id=entry.patient_id,
        appointment_id=entry.appointment_id, status=entry.status.value,
        checked_in_at=entry.checked_in_at, status_changed_at=entry.status_changed_at,
        notes=entry.notes, created_at=entry.created_at,
    )


@router.patch("/{queue_id}/status", response_model=PatientQueueResponse)
async def update_status_route(
    queue_id: str,
    data: PatientQueueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    entry = await update_queue_status(db, queue_id=uuid.UUID(queue_id), status=data.status, notes=data.notes)
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    return PatientQueueResponse(
        id=entry.id, clinic_id=entry.clinic_id, patient_id=entry.patient_id,
        appointment_id=entry.appointment_id, status=entry.status.value,
        checked_in_at=entry.checked_in_at, status_changed_at=entry.status_changed_at,
        notes=entry.notes, created_at=entry.created_at,
        patient_name=entry.patient.name if entry.patient else None,
        patient_phone=entry.patient.phone if entry.patient else None,
    )
