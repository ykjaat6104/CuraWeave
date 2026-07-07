from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class ClinicCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    owner_name: str
    owner_password: str
    role: str = "admin"


class ClinicResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str
