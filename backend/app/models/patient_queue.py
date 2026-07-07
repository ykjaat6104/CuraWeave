import uuid
import enum
from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from app.database import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class QueueStatus(str, enum.Enum):
    AI_CONVERSING = "ai_conversing"
    PENDING_REVIEW = "pending_review"
    WAITING = "waiting"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"


class PatientQueue(Base):
    __tablename__ = "patient_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"))
    status = Column(Enum(QueueStatus), default=QueueStatus.AI_CONVERSING)
    checked_in_at = Column(DateTime(timezone=True), server_default=func.now())
    status_changed_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clinic = relationship("Clinic")
    patient = relationship("Patient")
    appointment = relationship("Appointment")
