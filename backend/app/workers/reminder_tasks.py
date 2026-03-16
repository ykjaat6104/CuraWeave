import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select, and_
from app.workers.celery_worker import celery_app
from app.utils.helpers import run_async


@celery_app.task(name="app.workers.reminder_tasks.send_appointment_reminders", bind=True, max_retries=3)
def send_appointment_reminders(self):
    async def _run():
        from app.database import AsyncSessionLocal
        from app.models.appointment import Appointment, AppointmentStatus
        from app.models.patient import Patient
        from app.models.clinic import Clinic
        from app.services.messaging_service import send_appointment_reminder

        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()
            window_start = now + timedelta(hours=23)
            window_end = now + timedelta(hours=25)

            result = await db.execute(
                select(Appointment).where(
                    and_(
                        Appointment.appointment_time >= window_start,
                        Appointment.appointment_time <= window_end,
                        Appointment.status == AppointmentStatus.SCHEDULED,
                        Appointment.reminder_sent == False
                    )
                )
            )
            appointments = result.scalars().all()

            for appt in appointments:
                patient = (await db.execute(
                    select(Patient).where(Patient.id == appt.patient_id)
                )).scalar_one_or_none()
                clinic = (await db.execute(
                    select(Clinic).where(Clinic.id == appt.clinic_id)
                )).scalar_one_or_none()

                if patient and clinic:
                    appt_time = appt.appointment_time.strftime("%B %d at %I:%M %p")
                    await send_appointment_reminder(patient.name, patient.phone, appt_time, clinic.name)
                    appt.reminder_sent = True

            await db.commit()
            print(f"Sent {len(appointments)} appointment reminders")

    run_async(_run())


@celery_app.task(name="app.workers.reminder_tasks.send_follow_ups", bind=True, max_retries=3)
def send_follow_ups(self):
    async def _run():
        from app.database import AsyncSessionLocal
        from app.models.appointment import Appointment, AppointmentStatus
        from app.models.patient import Patient
        from app.models.clinic import Clinic
        from app.services.messaging_service import send_follow_up

        async with AsyncSessionLocal() as db:
            yesterday_start = (datetime.utcnow() - timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            yesterday_end = yesterday_start + timedelta(days=1)

            result = await db.execute(
                select(Appointment).where(
                    and_(
                        Appointment.appointment_time >= yesterday_start,
                        Appointment.appointment_time < yesterday_end,
                        Appointment.status == AppointmentStatus.COMPLETED,
                        Appointment.follow_up_sent == False
                    )
                )
            )
            appointments = result.scalars().all()

            for appt in appointments:
                patient = (await db.execute(
                    select(Patient).where(Patient.id == appt.patient_id)
                )).scalar_one_or_none()
                clinic = (await db.execute(
                    select(Clinic).where(Clinic.id == appt.clinic_id)
                )).scalar_one_or_none()

                if patient and clinic:
                    await send_follow_up(patient.name, patient.phone, clinic.name)
                    appt.follow_up_sent = True

            await db.commit()
            print(f"Sent {len(appointments)} follow-ups")

    run_async(_run())
