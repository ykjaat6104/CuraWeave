from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import Optional, List
import uuid

from app.models.medical_record import MedicalRecord
from app.models.user import User


async def create_record(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: uuid.UUID,
    doctor_id: Optional[uuid.UUID],
    record_type: str,
    title: str,
    description: Optional[str] = None,
    value: Optional[dict] = None,
    recorded_at: Optional[str] = None,
) -> MedicalRecord:
    record = MedicalRecord(
        clinic_id=clinic_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        record_type=record_type,
        title=title,
        description=description,
        value=value,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_records(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: Optional[uuid.UUID] = None,
    limit: int = 100,
) -> List[MedicalRecord]:
    query = (
        select(MedicalRecord)
        .options(joinedload(MedicalRecord.doctor))
        .where(MedicalRecord.clinic_id == clinic_id)
    )
    if patient_id:
        query = query.where(MedicalRecord.patient_id == patient_id)
    query = query.order_by(MedicalRecord.recorded_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_record_by_id(
    db: AsyncSession, record_id: uuid.UUID, clinic_id: uuid.UUID
) -> Optional[MedicalRecord]:
    query = (
        select(MedicalRecord)
        .options(joinedload(MedicalRecord.doctor))
        .where(MedicalRecord.id == record_id, MedicalRecord.clinic_id == clinic_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_patient_records(
    db: AsyncSession, patient_id: uuid.UUID, clinic_id: uuid.UUID
) -> List[MedicalRecord]:
    query = (
        select(MedicalRecord)
        .options(joinedload(MedicalRecord.doctor))
        .where(MedicalRecord.patient_id == patient_id, MedicalRecord.clinic_id == clinic_id)
        .order_by(MedicalRecord.recorded_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()
