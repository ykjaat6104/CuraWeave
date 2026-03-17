from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database import get_db
from app.utils.security import create_access_token
from app.schemas.clinic_schema import LoginRequest, TokenResponse, ClinicCreate, ClinicResponse
from app.services.clinic_service import create_clinic, authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ClinicResponse, status_code=201)
async def register_clinic(data: ClinicCreate, db: AsyncSession = Depends(get_db)):
    clinic = await create_clinic(db, data)
    return clinic


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": str(user.id), "clinic_id": str(user.clinic_id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "clinic_id": str(user.clinic_id)
        }
    }
