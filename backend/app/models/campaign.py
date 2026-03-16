import uuid
from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message_template = Column(Text, nullable=False)
    target_segment = Column(String(255))
    status = Column(Enum("draft", "active", "completed", name="campaign_status"), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clinic = relationship("Clinic", back_populates="campaigns")
    campaign_messages = relationship("CampaignMessage", back_populates="campaign")


class CampaignMessage(Base):
    __tablename__ = "campaign_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    status = Column(Enum("sent", "delivered", "failed", name="campaign_msg_status"), default="sent")
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    campaign = relationship("Campaign", back_populates="campaign_messages")
    patient = relationship("Patient")
