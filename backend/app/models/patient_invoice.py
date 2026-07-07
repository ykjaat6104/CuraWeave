import uuid
import enum
from sqlalchemy import Column, String, DateTime, Text, DECIMAL, Enum, ForeignKey
from app.database import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PatientInvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PatientInvoice(Base):
    __tablename__ = "patient_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    description = Column(Text)
    status = Column(Enum(PatientInvoiceStatus), default=PatientInvoiceStatus.PENDING)
    due_date = Column(DateTime(timezone=True))
    paid_at = Column(DateTime(timezone=True))
    invoice_pdf_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    clinic = relationship("Clinic")
