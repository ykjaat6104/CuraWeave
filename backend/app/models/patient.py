import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Date, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    password_hash = Column(String(255), nullable=True)  # Nullable because existing patients might not have login
    date_of_birth = Column(Date)
    gender = Column(String(20))
    notes = Column(Text)
    tags = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clinic = relationship("Clinic", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")
    messages = relationship("Message", back_populates="patient")
    triage_logs = relationship("TriageLog", back_populates="patient")
