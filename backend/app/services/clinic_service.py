from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from app.models.clinic import Clinic
from app.models.user import User, UserRole
from app.schemas.clinic_schema import ClinicCreate
from app.utils.security import get_password_hash, verify_password


async def create_clinic(db: AsyncSession, data: ClinicCreate) -> Clinic:
    clinic = Clinic(
        name=data.name,
        email=data.email,
        phone=data.phone,
        address=data.address,
    )
    db.add(clinic)
    await db.flush()

    owner = User(
        clinic_id=clinic.id,
        email=data.email,
        password_hash=get_password_hash(data.owner_password),
        name=data.owner_name,
        role=UserRole.ADMIN,
    )
    db.add(owner)
    await db.commit()
    await db.refresh(clinic)
    return clinic


async def get_clinic(db: AsyncSession, clinic_id: uuid.UUID) -> Optional[Clinic]:
    result = await db.execute(select(Clinic).where(Clinic.id == clinic_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user
