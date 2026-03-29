from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.patient import Patient
from app.models.clinic import Clinic
from app.models.user import User
from app.models.patient_doctor_link import PatientDoctorLink
from app.schemas.patient_schema import PatientRegister, PatientLogin, PatientResponse
from app.schemas.clinic_schema import TokenResponse
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.utils.auth import get_current_patient
from app.ai.langgraph_workflow import run_triage
from app.services.triage_service import save_triage_log
from app.models.triage import TriageUrgency

router = APIRouter(prefix="/auth/patient", tags=["Patient Authentication"])


class ConnectCodeRequest(BaseModel):
    code: str


class PatientTriageRequest(BaseModel):
    message: str

@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def register_patient(data: PatientRegister, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Register a new patient account.
    """
    target_clinic_id = data.clinic_id

    # If clinic isn't provided by UI, first try matching pre-added patient by email.
    # This allows first-time activation for records created by doctors.
    if not target_clinic_id:
        existing_by_email_result = await db.execute(
            select(Patient).where(Patient.email == data.email).order_by(Patient.created_at.desc()).limit(1)
        )
        existing_by_email = existing_by_email_result.scalar_one_or_none()

        if existing_by_email:
            if existing_by_email.password_hash:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists. Please login."
                )

            existing_by_email.password_hash = get_password_hash(data.password)
            existing_by_email.name = data.name or existing_by_email.name
            existing_by_email.phone = data.phone or existing_by_email.phone
            existing_by_email.gender = data.gender or existing_by_email.gender
            existing_by_email.date_of_birth = data.date_of_birth or existing_by_email.date_of_birth

            await db.commit()
            await db.refresh(existing_by_email)
            return existing_by_email

        clinic_result = await db.execute(
            select(Clinic).where(Clinic.is_active == True).order_by(Clinic.created_at).limit(1)
        )
        default_clinic = clinic_result.scalar_one_or_none()
        if not default_clinic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active clinic is available for patient registration."
            )
        target_clinic_id = default_clinic.id

    # check if patient exists with email in this clinic
    query = select(Patient).where(
        Patient.clinic_id == target_clinic_id,
        (Patient.email == data.email)
    )
    result = await db.execute(query)
    existing_patient = result.scalar_one_or_none()
    
    if existing_patient:
        # Doctor may have pre-created patient record without portal password.
        # In that case, allow first-time portal activation with same email.
        if existing_patient.password_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please login."
            )

        existing_patient.password_hash = get_password_hash(data.password)
        existing_patient.name = data.name or existing_patient.name
        existing_patient.phone = data.phone or existing_patient.phone
        existing_patient.gender = data.gender or existing_patient.gender
        existing_patient.date_of_birth = data.date_of_birth or existing_patient.date_of_birth

        await db.commit()
        await db.refresh(existing_patient)
        return existing_patient

    hashed_password = get_password_hash(data.password)
    
    new_patient = Patient(
        clinic_id=target_clinic_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hashed_password,
        date_of_birth=data.date_of_birth,
        gender=data.gender
    )
    
    db.add(new_patient)
    await db.commit()
    await db.refresh(new_patient)
    
    return new_patient

@router.post("/login", response_model=TokenResponse)
async def login_patient(data: PatientLogin, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Authenticate a patient and return an access token.
    """
    stmt = select(Patient).where(Patient.email == data.email)
    result = await db.execute(stmt)
    patients = result.scalars().all()
    
    valid_patient = None
        
    for patient in patients:
        if patient.password_hash and verify_password(data.password, patient.password_hash):
            valid_patient = patient
            break
            
    if not valid_patient:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate token
    # Scope/Role: patient
    access_token = create_access_token(
        data={"sub": str(valid_patient.id), "role": "patient", "clinic_id": str(valid_patient.clinic_id)}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(valid_patient.id),
            "email": valid_patient.email,
            "name": valid_patient.name,
            "role": "patient",
            "clinic_id": str(valid_patient.clinic_id)
        }
    }


@router.get("/clinics", tags=["Public"])
async def list_clinics(db: AsyncSession = Depends(get_db)) -> Any:
    """
    List all active clinics (public endpoint for patient registration).
    """
    stmt = select(Clinic).where(Clinic.is_active == True)
    result = await db.execute(stmt)
    clinics = result.scalars().all()
    
    return [
        {
            "id": str(clinic.id),
            "name": clinic.name,
            "email": clinic.email,
            "phone": clinic.phone,
            "address": clinic.address,
        }
        for clinic in clinics
    ]


@router.post("/connect-via-code")
async def connect_via_code(
    data: ConnectCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
) -> Any:
    stmt = select(PatientDoctorLink).where(
        PatientDoctorLink.connection_code == data.code,
        PatientDoctorLink.patient_id == current_patient.id,
    )
    result = await db.execute(stmt)
    link = result.scalar_one_or_none()

    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired code")

    if link.connected_at is None:
        link.connected_at = datetime.utcnow()
        await db.commit()

    doctor_result = await db.execute(select(User).where(User.id == link.doctor_id))
    doctor = doctor_result.scalar_one_or_none()

    clinic_result = await db.execute(select(Clinic).where(Clinic.id == link.clinic_id))
    clinic = clinic_result.scalar_one_or_none()

    return {
        "message": "Doctor connected successfully",
        "doctor": {
            "id": str(doctor.id) if doctor else None,
            "name": doctor.name if doctor else "Doctor",
            "email": doctor.email if doctor else None,
        },
        "clinic": {
            "id": str(clinic.id) if clinic else None,
            "name": clinic.name if clinic else None,
        },
        "connected_at": link.connected_at,
    }


@router.get("/connected-doctors")
async def connected_doctors(
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
) -> Any:
    stmt = select(PatientDoctorLink).where(
        PatientDoctorLink.patient_id == current_patient.id,
        PatientDoctorLink.connected_at.is_not(None),
    ).order_by(PatientDoctorLink.connected_at.desc())
    result = await db.execute(stmt)
    links = result.scalars().all()

    items = []
    for link in links:
        doctor_result = await db.execute(select(User).where(User.id == link.doctor_id))
        doctor = doctor_result.scalar_one_or_none()

        clinic_result = await db.execute(select(Clinic).where(Clinic.id == link.clinic_id))
        clinic = clinic_result.scalar_one_or_none()

        items.append({
            "doctor": {
                "id": str(doctor.id) if doctor else None,
                "name": doctor.name if doctor else "Doctor",
                "email": doctor.email if doctor else None,
            },
            "clinic": {
                "id": str(clinic.id) if clinic else None,
                "name": clinic.name if clinic else None,
            },
            "connected_at": link.connected_at,
            "connection_code": link.connection_code,
        })

    return items


@router.post("/triage")
async def run_patient_triage(
    request: PatientTriageRequest,
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
) -> Any:
    result = await run_triage(
        clinic_id=str(current_patient.clinic_id),
        patient_message=request.message,
        patient_id=str(current_patient.id),
    )

    urgency_map = {
        "low": TriageUrgency.LOW,
        "medium": TriageUrgency.MEDIUM,
        "high": TriageUrgency.HIGH,
        "critical": TriageUrgency.CRITICAL,
    }
    urgency = urgency_map.get(result.get("urgency"), TriageUrgency.MEDIUM)

    await save_triage_log(
        db=db,
        clinic_id=current_patient.clinic_id,
        patient_id=current_patient.id,
        symptoms=", ".join(result.get("symptoms", [])),
        urgency_level=urgency,
        ai_response=result.get("response", ""),
    )

    return {
        "urgency": str(urgency),
        "symptoms": result.get("symptoms", []),
        "recommendation": result.get("response", ""),
        "action": result.get("action", "review"),
        "disclaimer": "This is AI guidance and not a medical diagnosis. Contact your doctor for final advice.",
    }
