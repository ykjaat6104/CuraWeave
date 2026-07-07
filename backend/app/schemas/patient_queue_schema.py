from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class PatientQueueCreate(BaseModel):
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    notes: Optional[str] = None


class PatientQueueUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class PatientQueueResponse(BaseModel):
    id: UUID
    clinic_id: UUID
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    status: str
    checked_in_at: datetime
    status_changed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    urgency: Optional[str] = None

    model_config = {"from_attributes": True}
