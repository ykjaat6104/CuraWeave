from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.triage import TriageUrgency
from app.schemas.appointment_schema import TriageRequest, TriageResponse
from app.ai.langgraph_workflow import run_triage, run_conversation, generate_campaign_message
from app.services.triage_service import save_triage_log, get_triage_logs

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/triage", response_model=TriageResponse)
async def run_ai_triage(
    request: TriageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await run_triage(
        clinic_id=str(current_user.clinic_id),
        patient_message=request.message,
        patient_id=str(request.patient_id) if request.patient_id else None
    )

    urgency_map = {"low": TriageUrgency.LOW, "medium": TriageUrgency.MEDIUM, "high": TriageUrgency.HIGH}
    urgency = urgency_map.get(result["urgency"], TriageUrgency.MEDIUM)

    await save_triage_log(
        db=db,
        clinic_id=current_user.clinic_id,
        patient_id=request.patient_id,
        symptoms=", ".join(result["symptoms"]),
        urgency_level=urgency,
        ai_response=result["response"]
    )

    return TriageResponse(
        urgency=urgency,
        symptoms=result["symptoms"],
        recommendation=result["response"],
        action=result["action"]
    )


@router.post("/chat")
async def ai_chat(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = body.get("messages", [])
    patient_id = body.get("patient_id")

    if not messages:
        raise HTTPException(status_code=400, detail="Messages array is required")

    result = await run_conversation(
        clinic_id=str(current_user.clinic_id),
        messages=messages,
        patient_id=str(patient_id) if patient_id else None
    )
    return result


@router.post("/generate-message")
async def generate_message(
    body: dict,
    current_user: User = Depends(get_current_user)
):
    template = body.get("template", "")
    patient_name = body.get("patient_name", "Patient")
    clinic_name = body.get("clinic_name", "Our Clinic")
    message = await generate_campaign_message(template, patient_name, clinic_name)
    return {"message": message}


@router.get("/triage-logs")
async def list_triage_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = await get_triage_logs(db, current_user.clinic_id, limit=limit)
    return [
        {
            "id": str(log.id),
            "patient_id": str(log.patient_id) if log.patient_id else None,
            "symptoms": log.symptoms,
            "urgency": str(log.urgency_level),
            "ai_response": log.ai_response,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]
