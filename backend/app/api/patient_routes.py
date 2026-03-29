from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
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
from app.integrations.email_client import send_email
from app.integrations.twilio_client import send_sms
from app.models.patient_doctor_link import PatientDoctorLink

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


@router.post("/{patient_id}/generate-connection-code")
async def generate_connection_code(
    patient_id: uuid.UUID,
    send_email_flag: bool = True,
    send_sms_flag: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = await get_patient(db, current_user.clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    stmt = select(PatientDoctorLink).where(
        PatientDoctorLink.clinic_id == current_user.clinic_id,
        PatientDoctorLink.doctor_id == current_user.id,
        PatientDoctorLink.patient_id == patient.id,
    )
    result = await db.execute(stmt)
    link = result.scalar_one_or_none()

    if not link:
        link = PatientDoctorLink(
            clinic_id=current_user.clinic_id,
            doctor_id=current_user.id,
            patient_id=patient.id,
            connection_code=str(uuid.uuid4()),
        )
        db.add(link)

    link.last_sent_at = datetime.utcnow()
    await db.commit()
    await db.refresh(link)

    clinic = await get_clinic(db, current_user.clinic_id)
    clinic_name = clinic.name if clinic else "your clinic"

    message_body = (
        f"Hello {patient.name},\n\n"
        f"Your secure doctor connection code from {clinic_name} is:\n"
        f"{link.connection_code}\n\n"
        f"Use this code in the patient portal to connect with your doctor."
    )

    delivery = {"email": None, "sms": None}

    if send_email_flag and patient.email:
        delivery["email"] = await send_email(
            to_email=patient.email,
            subject=f"Your connection code from {clinic_name}",
            body=message_body,
        )

    if send_sms_flag and patient.phone:
        delivery["sms"] = await send_sms(
            to_number=patient.phone,
            message=f"{clinic_name} connection code: {link.connection_code}",
        )

    return {
        "patient_id": str(patient.id),
        "patient_name": patient.name,
        "connection_code": link.connection_code,
        "delivery": delivery,
        "sent_to": {
            "email": patient.email,
            "phone": patient.phone,
        },
    }
