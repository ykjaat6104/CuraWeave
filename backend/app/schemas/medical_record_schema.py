from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class MedicalRecordCreate(BaseModel):
    patient_id: UUID
    record_type: str  # vital, lab, diagnosis, note
    title: str
    description: Optional[str] = None
    value: Optional[Any] = None
    recorded_at: Optional[datetime] = None


class MedicalRecordUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    value: Optional[Any] = None


class MedicalRecordResponse(BaseModel):
    id: UUID
    patient_id: UUID
    clinic_id: UUID
    doctor_id: Optional[UUID] = None
    record_type: str
    title: str
    description: Optional[str] = None
    value: Optional[Any] = None
    recorded_at: datetime
    created_at: datetime
    doctor_name: Optional[str] = None
    uploaded_by: Optional[str] = None
    file_url: Optional[str] = None

    model_config = {"from_attributes": True}
