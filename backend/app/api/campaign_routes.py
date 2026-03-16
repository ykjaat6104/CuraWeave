from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.schemas.message_schema import CampaignCreate, CampaignResponse, MessageSend
from app.services.campaign_service import create_campaign, get_campaigns, get_campaign
from app.services.messaging_service import save_message, get_messages
from app.integrations.twilio_client import send_whatsapp
from app.services.patient_service import get_patient

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])
messages_router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/", response_model=List[CampaignResponse])
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_campaigns(db, current_user.clinic_id)


@router.post("/", response_model=CampaignResponse, status_code=201)
async def create_new_campaign(
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await create_campaign(db, current_user.clinic_id, data)


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign_detail(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = await get_campaign(db, current_user.clinic_id, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post("/{campaign_id}/launch")
async def launch_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = await get_campaign(db, current_user.clinic_id, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status != "draft":
        raise HTTPException(status_code=400, detail="Campaign cannot be launched in current state")

    from app.workers.campaign_tasks import send_campaign_messages
    send_campaign_messages.delay(str(campaign_id), str(current_user.clinic_id))

    campaign.status = "active"
    await db.commit()
    return {"message": "Campaign launched", "campaign_id": str(campaign_id)}


# ─── Messages ─────────────────────────────────────────────────────────────────
@messages_router.post("/send")
async def send_message_to_patient(
    data: MessageSend,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = await get_patient(db, current_user.clinic_id, data.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    result = await send_whatsapp(patient.phone, data.content)
    msg = await save_message(
        db=db,
        clinic_id=current_user.clinic_id,
        patient_id=data.patient_id,
        message_text=data.content,
        channel=data.channel,
        direction="outbound",
    )
    return {"message": "Message sent", "id": str(msg.id), "status": str(msg.status)}


@messages_router.get("/")
async def list_messages(
    patient_id: Optional[uuid.UUID] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msgs = await get_messages(db, current_user.clinic_id, patient_id, limit)
    return [
        {
            "id": str(m.id),
            "patient_id": str(m.patient_id) if m.patient_id else None,
            "channel": m.channel,
            "direction": m.direction,
            "message_text": m.message_text,
            "status": str(m.status),
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in msgs
    ]
