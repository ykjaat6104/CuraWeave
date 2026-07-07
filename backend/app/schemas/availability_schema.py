from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.appointment import WeekDay

class DoctorAvailabilityBase(BaseModel):
    day_of_week: WeekDay
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    slot_duration: int = 30
    is_active: bool = True

class DoctorAvailabilityCreate(DoctorAvailabilityBase):
    doctor_id: UUID

class DoctorAvailabilityUpdate(BaseModel):
    day_of_week: Optional[WeekDay] = None
    start_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    slot_duration: Optional[int] = None
    is_active: Optional[bool] = None

class DoctorAvailabilityResponse(DoctorAvailabilityBase):
    id: UUID
    doctor_id: UUID
    clinic_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
