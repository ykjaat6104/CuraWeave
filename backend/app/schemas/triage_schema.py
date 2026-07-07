from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class TriageNoteUpdate(BaseModel):
    doctor_note: str


class TriageHistoryResponse(BaseModel):
    id: UUID
    patient_id: UUID
    symptoms: str
    urgency_level: str
    ai_response: str
    doctor_note: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}
