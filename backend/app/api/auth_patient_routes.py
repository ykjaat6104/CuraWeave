from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.patient import Patient
from app.schemas.patient_schema import PatientRegister, PatientLogin, PatientResponse
from app.schemas.clinic_schema import TokenResponse
from app.utils.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth/patient", tags=["Patient Authentication"])

@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def register_patient(data: PatientRegister, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Register a new patient account.
    """
    # check if patient exists with email in this clinic
    query = select(Patient).where(
        Patient.clinic_id == data.clinic_id,
        (Patient.email == data.email)
    )
    result = await db.execute(query)
    existing_patient = result.scalar_one_or_none()
    
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient with this email already exists in this clinic."
        )

    hashed_password = get_password_hash(data.password)
    
    new_patient = Patient(
        clinic_id=data.clinic_id,
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
