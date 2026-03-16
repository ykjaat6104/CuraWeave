from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.models.triage import TriageLog, TriageUrgency


async def save_triage_log(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: Optional[uuid.UUID],
    symptoms: str,
    urgency_level: TriageUrgency,
    ai_response: str
) -> TriageLog:
    log = TriageLog(
        clinic_id=clinic_id,
        patient_id=patient_id,
        symptoms=symptoms,
        urgency_level=urgency_level,
        ai_response=ai_response,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_triage_logs(
    db: AsyncSession, clinic_id: uuid.UUID,
    patient_id: Optional[uuid.UUID] = None,
    limit: int = 50
) -> List[TriageLog]:
    query = select(TriageLog).where(TriageLog.clinic_id == clinic_id)
    if patient_id:
        query = query.where(TriageLog.patient_id == patient_id)
    query = query.order_by(TriageLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
