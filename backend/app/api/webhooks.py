from fastapi import APIRouter, Depends, Request, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.patient import Patient
from app.models.clinic import Clinic
from app.ai.langgraph_workflow import run_conversation, run_triage
from app.integrations.twilio_client import send_whatsapp
from app.services.messaging_service import save_message

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

conversation_store: dict = {}


@router.post("/twilio/whatsapp")
async def twilio_whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    To: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    phone_number = From.replace("whatsapp:", "")
    message_body = Body.strip()

    result = await db.execute(select(Patient).where(Patient.phone == phone_number))
    patient = result.scalar_one_or_none()

    if not patient:
        await send_whatsapp(From, "Hello! I don't have your records. Please contact our clinic directly to register.")
        return {"status": "ok"}

    clinic_result = await db.execute(select(Clinic).where(Clinic.id == patient.clinic_id))
    clinic = clinic_result.scalar_one_or_none()

    await save_message(
        db=db,
        clinic_id=patient.clinic_id,
        patient_id=patient.id,
        message_text=message_body,
        channel="whatsapp",
        direction="inbound",
    )

    triage_keywords = ["pain", "hurt", "fever", "sick", "symptom", "ache", "bleeding", "dizzy", "nausea", "vomit"]
    is_triage = any(kw in message_body.lower() for kw in triage_keywords)

    if is_triage:
        ai_result = await run_triage(
            clinic_id=str(patient.clinic_id),
            patient_message=message_body,
            patient_id=str(patient.id)
        )
        response_text = ai_result["response"]
    else:
        conv_key = f"{patient.clinic_id}_{patient.id}"
        history = conversation_store.get(conv_key, [])
        history.append({"role": "user", "content": message_body})

        ai_result = await run_conversation(
            clinic_id=str(patient.clinic_id),
            messages=history,
            patient_id=str(patient.id)
        )
        response_text = ai_result["response"]
        history.append({"role": "assistant", "content": response_text})
        conversation_store[conv_key] = history[-10:]

    await send_whatsapp(From, response_text)

    await save_message(
        db=db,
        clinic_id=patient.clinic_id,
        patient_id=patient.id,
        message_text=response_text,
        channel="whatsapp",
        direction="outbound",
    )

    return {"status": "ok"}
