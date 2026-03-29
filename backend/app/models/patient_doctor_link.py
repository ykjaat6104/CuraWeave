import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class PatientDoctorLink(Base):
    __tablename__ = "patient_doctor_links"
    __table_args__ = (
        UniqueConstraint("clinic_id", "doctor_id", "patient_id", name="uq_patient_doctor_per_clinic"),
        UniqueConstraint("connection_code", name="uq_patient_doctor_connection_code"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)

    # Doctor-shared secure code used by patient to connect to this doctor.
    connection_code = Column(String(64), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_sent_at = Column(DateTime(timezone=True), nullable=True)
    connected_at = Column(DateTime(timezone=True), nullable=True)
