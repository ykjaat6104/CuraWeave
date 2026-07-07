import uuid
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from app.database import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    record_type = Column(String(50), nullable=False)  # vital, lab, diagnosis, note
    title = Column(String(255), nullable=False)
    description = Column(Text)
    value = Column(JSON)
    recorded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    clinic = relationship("Clinic")
    doctor = relationship("User")
