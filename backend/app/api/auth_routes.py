import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.utils.security import create_access_token, get_password_hash, verify_password
from app.utils.password_policy import validate_password
from app.utils.auth import get_current_user
from app.models.user import User
from app.schemas.clinic_schema import (
    LoginRequest, TokenResponse, ClinicCreate, ClinicResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
    UserProfileUpdate, PasswordChangeRequest,
)
from app.services.clinic_service import create_clinic, authenticate_user
from app.services.audit_service import log_action
from app.services.verification_service import (
    send_verification_email, verify_token, mark_email_verified,
    send_password_reset_email, verify_password_reset_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ClinicResponse, status_code=201)
async def register_clinic(data: ClinicCreate, db: AsyncSession = Depends(get_db)):
    password_errors = validate_password(data.owner_password)
    if password_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "WEAK_PASSWORD", "errors": [{"code": c, "message": m} for c, m in password_errors]},
        )

    clinic = await create_clinic(db, data)

    # Trigger verification email in background (fire-and-forget)
    user_result = await db.execute(select(User).where(User.email == data.email))
    owner = user_result.scalar_one_or_none()
    if owner:
        asyncio.create_task(
            send_verification_email(owner.email, str(owner.id), owner.name or "User")
        )

    asyncio.create_task(
        log_action(db, clinic.id, "register", "clinic", user_id=owner.id if owner else None, details=f"Clinic '{clinic.name}' registered by {data.email}")
    )

    return clinic


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    asyncio.create_task(
        log_action(db, user.clinic_id, "login", "auth", user_id=user.id, details=f"User {user.email} logged in", request=request)
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
            "clinic_id": str(user.clinic_id),
            "email_verified": user.email_verified,
        }
    }


@router.post("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    success = await mark_email_verified(db, uuid.UUID(user_id))
    if not success:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        import asyncio
        asyncio.create_task(
            send_password_reset_email(user.email, str(user.id), user.name or "User")
        )
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    payload = verify_password_reset_token(data.token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    password_errors = validate_password(data.new_password)
    if password_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "WEAK_PASSWORD", "errors": [{"code": c, "message": m} for c, m in password_errors]},
        )

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(data.new_password)
    await db.commit()

    return {"message": "Password reset successfully"}


@router.get("/profile")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "clinic_id": str(current_user.clinic_id),
        "email_verified": current_user.email_verified,
    }


@router.patch("/profile")
async def update_my_profile(
    data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "clinic_id": str(current_user.clinic_id),
        "email_verified": current_user.email_verified,
    }


@router.post("/change-password")
async def change_password(
    data: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    password_errors = validate_password(data.new_password)
    if password_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "WEAK_PASSWORD", "errors": [{"code": c, "message": m} for c, m in password_errors]},
        )

    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}


@router.post("/resend-verification")
async def resend_verification(
    email: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email_verified:
        return {"message": "Email already verified"}

    sent = await send_verification_email(user.email, str(user.id), user.name or "User")
    return {"message": "Verification email sent" if sent else "Failed to send verification email"}
