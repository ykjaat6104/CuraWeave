import asyncio
from sqlalchemy import select
from app.workers.celery_worker import celery_app
from app.utils.helpers import run_async


@celery_app.task(name="app.workers.campaign_tasks.send_campaign_messages", bind=True, max_retries=3)
def send_campaign_messages(self, campaign_id: str, clinic_id: str):
    async def _run():
        from app.database import AsyncSessionLocal
        from app.models.campaign import Campaign, CampaignMessage
        from app.models.patient import Patient
        from app.integrations.twilio_client import send_whatsapp
        from app.ai.langgraph_workflow import generate_campaign_message

        async with AsyncSessionLocal() as db:
            campaign = (await db.execute(
                select(Campaign).where(Campaign.id == campaign_id, Campaign.clinic_id == clinic_id)
            )).scalar_one_or_none()
            if not campaign:
                return

            campaign.status = "active"
            await db.commit()

            query = select(Patient).where(Patient.clinic_id == clinic_id, Patient.is_active == True)
            patients = (await db.execute(query)).scalars().all()

            sent_count = 0
            for patient in patients:
                if not patient.phone:
                    continue

                message = await generate_campaign_message(
                    campaign.message_template, patient.name, "Your Clinic"
                )
                result = await send_whatsapp(patient.phone, message)
                status = "sent" if result.get("success") else "failed"

                db.add(CampaignMessage(
                    campaign_id=campaign.id,
                    patient_id=patient.id,
                    status=status
                ))
                if result.get("success"):
                    sent_count += 1
                await asyncio.sleep(0.5)

            campaign.status = "completed"
            await db.commit()
            print(f"Campaign {campaign_id}: sent {sent_count} messages")

    run_async(_run())
