from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.models.appointment import AppointmentStatus
from app.models.triage import TriageUrgency


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    appointment_time: datetime
    duration_minutes: int = 30
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    appointment_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[AppointmentStatus] = None
    doctor_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    clinic_id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: Optional[uuid.UUID]
    appointment_time: datetime
    duration_minutes: int
    status: AppointmentStatus
    reason: Optional[str]
    reminder_sent: bool
    follow_up_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TriageRequest(BaseModel):
    patient_id: Optional[uuid.UUID] = None
    message: str


class TriageResponse(BaseModel):
    urgency: TriageUrgency
    symptoms: List[str]
    recommendation: str
    action: str
    disclaimer: str = "This is not medical advice. Please consult a qualified healthcare professional."
