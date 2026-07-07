import uuid
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from app.database import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PatientInsurance(Base):
    __tablename__ = "patient_insurance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    provider = Column(String(255), nullable=False)
    policy_number = Column(String(255), nullable=False)
    status = Column(String(50), default="active")
    expiry_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    clinic = relationship("Clinic")
