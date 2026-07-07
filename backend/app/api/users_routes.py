import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from app.database import get_db
from app.dependencies import get_current_user, get_tenant_id
from app.models.user import User, UserRole
from app.utils.security import get_password_hash
from app.services.audit_service import log_action

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
async def list_users(
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    query = select(User).where(User.clinic_id == tenant_id, User.is_active == True)
    if role:
        query = query.where(User.role == role)
    query = query.order_by(User.name)
    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, 'value') else u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.post("/invite")
async def invite_user(
    body: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    name = body.get("name", "").strip()
    email = body.get("email", "").strip()
    role = body.get("role", "doctor")
    password = body.get("password", "")

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="name, email, and password are required")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    role_map = {"admin": UserRole.ADMIN, "doctor": UserRole.DOCTOR}
    user_role = role_map.get(role)
    if not user_role:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    existing = await db.execute(select(User).where(User.email == email, User.clinic_id == tenant_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    user = User(
        id=uuid.uuid4(),
        clinic_id=tenant_id,
        email=email,
        name=name,
        password_hash=get_password_hash(password),
        role=user_role,
        email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    asyncio.create_task(
        log_action(db, tenant_id, "invite", "user", user_id=current_user.id, details=f"{current_user.email} invited {email} as {role}", request=request)
    )

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
    }
