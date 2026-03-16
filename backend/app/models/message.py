import uuid
import enum
from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MessageStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"))
    channel = Column(Enum("whatsapp", "email", name="message_channel"), default="whatsapp")
    direction = Column(Enum("inbound", "outbound", name="message_direction"), default="outbound")
    message_text = Column(Text, nullable=False)
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="messages")
    clinic = relationship("Clinic")
