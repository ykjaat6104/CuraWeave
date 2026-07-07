from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr
from datetime import datetime

class PublicClinicResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class TimeSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    available: bool = True

class BookAppointmentRequest(BaseModel):
    clinic_id: UUID
    appointment_time: datetime
    reason: Optional[str] = None
