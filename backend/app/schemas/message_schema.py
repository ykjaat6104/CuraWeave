from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class MessageSend(BaseModel):
    patient_id: uuid.UUID
    content: str
    channel: str = "whatsapp"


class MessageResponse(BaseModel):
    id: uuid.UUID
    patient_id: Optional[uuid.UUID]
    channel: str
    direction: str
    message_text: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignCreate(BaseModel):
    title: str
    message_template: str
    target_segment: Optional[str] = None


class CampaignResponse(BaseModel):
    id: uuid.UUID
    clinic_id: uuid.UUID
    title: str
    message_template: str
    target_segment: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
