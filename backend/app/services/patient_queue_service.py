from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import Optional, List
import uuid

from app.models.patient_queue import PatientQueue, QueueStatus


async def create_queue_entry(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: uuid.UUID,
    appointment_id: Optional[uuid.UUID] = None,
    notes: Optional[str] = None,
) -> PatientQueue:
    entry = PatientQueue(
        clinic_id=clinic_id,
        patient_id=patient_id,
        appointment_id=appointment_id,
        status=QueueStatus.AI_CONVERSING,
        notes=notes,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def update_queue_status(
    db: AsyncSession,
    queue_id: uuid.UUID,
    status: str,
    notes: Optional[str] = None,
) -> Optional[PatientQueue]:
    result = await db.execute(select(PatientQueue).where(PatientQueue.id == queue_id))
    entry = result.scalar_one_or_none()
    if not entry:
        return None
    entry.status = QueueStatus(status)
    if notes is not None:
        entry.notes = notes
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_queue(
    db: AsyncSession, clinic_id: uuid.UUID
) -> List[PatientQueue]:
    query = (
        select(PatientQueue)
        .options(joinedload(PatientQueue.patient))
        .where(PatientQueue.clinic_id == clinic_id)
        .order_by(PatientQueue.checked_in_at.asc())
    )
    result = await db.execute(query)
    return result.scalars().all()
