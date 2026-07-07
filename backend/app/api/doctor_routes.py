from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_user, get_tenant_id
from app.models.user import User
from app.models.triage import TriageLog
from app.schemas.triage_schema import TriageNoteUpdate, TriageHistoryResponse
from app.services.triage_service import get_triage_logs, update_triage_note

router = APIRouter(prefix="/doctor", tags=["Doctor"])


@router.get("/triage-history", response_model=List[TriageHistoryResponse])
async def get_triage_history(
    patient_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    patient_uuid = uuid.UUID(patient_id) if patient_id else None
    logs = await get_triage_logs(db, clinic_id=tenant_id, patient_id=patient_uuid)
    result = []
    for log in logs:
        from sqlalchemy.orm import joinedload
        reviewer_name = None
        if log.reviewed_by:
            r_result = await db.execute(select(User).where(User.id == log.reviewed_by))
            reviewer = r_result.scalar_one_or_none()
            reviewer_name = reviewer.name if reviewer else None
        result.append(TriageHistoryResponse(
            id=log.id, patient_id=log.patient_id,
            symptoms=log.symptoms, urgency_level=log.urgency_level.value,
            ai_response=log.ai_response, doctor_note=log.doctor_note,
            reviewed_by=reviewer_name,
            created_at=log.created_at.isoformat() if log.created_at else "",
        ))
    return result


@router.post("/triage/{triage_id}/note", response_model=TriageHistoryResponse)
async def add_triage_note(
    triage_id: str,
    data: TriageNoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    log = await update_triage_note(
        db=db, triage_id=uuid.UUID(triage_id),
        doctor_note=data.doctor_note, reviewed_by=current_user.id,
    )
    if not log:
        raise HTTPException(status_code=404, detail="Triage log not found")
    reviewer_name = current_user.name
    return TriageHistoryResponse(
        id=log.id, patient_id=log.patient_id,
        symptoms=log.symptoms, urgency_level=log.urgency_level.value,
        ai_response=log.ai_response, doctor_note=log.doctor_note,
        reviewed_by=reviewer_name,
        created_at=log.created_at.isoformat() if log.created_at else "",
    )
