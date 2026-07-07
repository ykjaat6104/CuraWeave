import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.database import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(String(255), nullable=False)
    resource = Column(String(255), nullable=False)
    resource_id = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clinic = relationship("Clinic")
