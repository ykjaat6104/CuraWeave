from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.models.patient import Patient
from app.schemas.patient_schema import PatientCreate, PatientUpdate


async def create_patient(db: AsyncSession, clinic_id: uuid.UUID, data: PatientCreate) -> Patient:
    patient = Patient(clinic_id=clinic_id, **data.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


async def get_patients(
    db: AsyncSession, clinic_id: uuid.UUID,
    skip: int = 0, limit: int = 50,
    search: Optional[str] = None
) -> List[Patient]:
    query = select(Patient).where(Patient.clinic_id == clinic_id, Patient.is_active == True)
    if search:
        query = query.where(
            Patient.name.ilike(f"%{search}%") |
            Patient.phone.ilike(f"%{search}%") |
            Patient.email.ilike(f"%{search}%")
        )
    query = query.offset(skip).limit(limit).order_by(Patient.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def get_patient(db: AsyncSession, clinic_id: uuid.UUID, patient_id: uuid.UUID) -> Optional[Patient]:
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == clinic_id)
    )
    return result.scalar_one_or_none()


async def get_patient_by_phone(db: AsyncSession, phone: str) -> Optional[Patient]:
    result = await db.execute(select(Patient).where(Patient.phone == phone))
    return result.scalar_one_or_none()


async def update_patient(db: AsyncSession, patient: Patient, data: PatientUpdate) -> Patient:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    await db.commit()
    await db.refresh(patient)
    return patient


async def deactivate_patient(db: AsyncSession, patient: Patient):
    patient.is_active = False
    await db.commit()
