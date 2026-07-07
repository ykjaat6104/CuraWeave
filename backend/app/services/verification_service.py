import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, Union

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.utils.security import create_access_token, decode_token
from app.integrations.email_client import send_email

logger = logging.getLogger(__name__)


def generate_verification_token(user_id: str, email: str) -> str:
    return create_access_token(
        data={"sub": user_id, "email": email, "purpose": "email_verification"},
        expires_delta=timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS),
    )


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = decode_token(token)
        if payload.get("purpose") != "email_verification":
            return None
        return payload
    except Exception:
        return None


async def send_verification_email(
    email: str,
    user_id: str,
    user_name: str,
    is_patient: bool = False,
) -> bool:
    token = generate_verification_token(user_id, email)
    verification_url = f"{settings.APP_URL}/{ 'patient' if is_patient else 'doctor' }/verify-email?token={token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to {settings.APP_NAME}!</h2>
        <p>Hi {user_name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{verification_url}"
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
           Verify Email
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This link expires in {settings.VERIFICATION_TOKEN_EXPIRE_HOURS} hours. If you didn't create an account, you can ignore this email.
        </p>
    </div>
    """

    result = await send_email(
        to_email=email,
        subject=f"Verify your {settings.APP_NAME} account",
        body=f"Welcome to {settings.APP_NAME}! Verify your email: {verification_url}",
        html_body=html_body,
    )
    return result.get("success", False)


def generate_password_reset_token(user_id: str, email: str) -> str:
    return create_access_token(
        data={"sub": user_id, "email": email, "purpose": "password_reset"},
        expires_delta=timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
    )


def verify_password_reset_token(token: str) -> Optional[dict]:
    try:
        payload = decode_token(token)
        if payload.get("purpose") != "password_reset":
            return None
        return payload
    except Exception:
        return None


async def send_password_reset_email(
    email: str,
    user_id: str,
    user_name: str,
    is_patient: bool = False,
) -> bool:
    token = generate_password_reset_token(user_id, email)
    reset_url = f"{settings.APP_URL}/{'patient' if is_patient else 'doctor'}/reset-password?token={token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your {settings.APP_NAME} Password</h2>
        <p>Hi {user_name},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <a href="{reset_url}"
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
           Reset Password
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This link expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.
            If you didn't request a password reset, you can ignore this email.
        </p>
    </div>
    """

    result = await send_email(
        to_email=email,
        subject=f"Reset your {settings.APP_NAME} password",
        body=f"Reset your {settings.APP_NAME} password: {reset_url}",
        html_body=html_body,
    )
    return result.get("success", False)


async def mark_email_verified(
    db: AsyncSession,
    user_id: uuid.UUID,
    is_patient: bool = False,
) -> bool:
    if is_patient:
        from app.models.patient import Patient
        result = await db.execute(select(Patient).where(Patient.id == user_id))
        user = result.scalar_one_or_none()
    else:
        from app.models.user import User
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

    if not user:
        return False

    user.email_verified = True
    await db.commit()
    return True
