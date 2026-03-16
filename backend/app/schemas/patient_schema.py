from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
import uuid


class PatientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = []


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class PatientResponse(BaseModel):
    id: uuid.UUID
    clinic_id: uuid.UUID
    name: str
    phone: Optional[str]
    email: Optional[str]
    gender: Optional[str]
    is_active: bool
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PatientRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    clinic_id: uuid.UUID
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None


class PatientLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True
