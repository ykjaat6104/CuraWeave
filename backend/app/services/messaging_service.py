from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.models.message import Message, MessageStatus
from app.integrations.twilio_client import send_whatsapp
from app.integrations.email_client import send_email


async def save_message(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: Optional[uuid.UUID],
    message_text: str,
    channel: str = "whatsapp",
    direction: str = "outbound",
    status: MessageStatus = MessageStatus.SENT,
    campaign_id: Optional[uuid.UUID] = None
) -> Message:
    message = Message(
        clinic_id=clinic_id,
        patient_id=patient_id,
        message_text=message_text,
        channel=channel,
        direction=direction,
        status=status,
        campaign_id=campaign_id
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def get_messages(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: Optional[uuid.UUID] = None,
    limit: int = 50
) -> List[Message]:
    query = select(Message).where(Message.clinic_id == clinic_id)
    if patient_id:
        query = query.where(Message.patient_id == patient_id)
    query = query.order_by(Message.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def send_appointment_reminder(
    patient_name: str, patient_phone: str,
    appointment_time: str, clinic_name: str
) -> dict:
    message = (
        f"Hello {patient_name}! "
        f"This is a reminder that you have an appointment at {clinic_name} "
        f"scheduled for {appointment_time}. "
        f"Reply YES to confirm or NO to cancel/reschedule."
    )
    return await send_whatsapp(patient_phone, message)


async def send_follow_up(patient_name: str, patient_phone: str, clinic_name: str) -> dict:
    message = (
        f"Hi {patient_name}! "
        f"We hope your visit to {clinic_name} went well. "
        f"How are you feeling after your appointment? "
        f"If you have any concerns or need a follow-up, just reply to this message."
    )
    return await send_whatsapp(patient_phone, message)


async def send_welcome_message(patient_name: str, patient_phone: str, clinic_name: str) -> dict:
    message = (
        f"Welcome to {clinic_name}, {patient_name}! "
        f"You can use this number to book appointments, reschedule, cancel, "
        f"or ask general health questions. Type HELP anytime for assistance."
    )
    return await send_whatsapp(patient_phone, message)
