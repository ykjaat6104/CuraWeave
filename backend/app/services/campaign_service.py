from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.models.campaign import Campaign
from app.schemas.message_schema import CampaignCreate


async def create_campaign(db: AsyncSession, clinic_id: uuid.UUID, data: CampaignCreate) -> Campaign:
    campaign = Campaign(clinic_id=clinic_id, **data.model_dump())
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def get_campaigns(db: AsyncSession, clinic_id: uuid.UUID) -> List[Campaign]:
    result = await db.execute(
        select(Campaign).where(Campaign.clinic_id == clinic_id).order_by(Campaign.created_at.desc())
    )
    return result.scalars().all()


async def get_campaign(db: AsyncSession, clinic_id: uuid.UUID, campaign_id: uuid.UUID) -> Optional[Campaign]:
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.clinic_id == clinic_id)
    )
    return result.scalar_one_or_none()
