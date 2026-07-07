from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class PatientInvoiceCreate(BaseModel):
    patient_id: UUID
    amount: Decimal
    description: Optional[str] = None
    due_date: Optional[datetime] = None


class PatientInvoiceUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None


class PatientInvoiceResponse(BaseModel):
    id: UUID
    patient_id: UUID
    clinic_id: UUID
    amount: Decimal
    description: Optional[str] = None
    status: str
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    invoice_pdf_url: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None

    model_config = {"from_attributes": True}
