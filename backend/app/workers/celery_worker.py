from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "clinic_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.reminder_tasks", "app.workers.campaign_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "send-appointment-reminders": {
            "task": "app.workers.reminder_tasks.send_appointment_reminders",
            "schedule": crontab(minute="*/30"),
        },
        "send-followups": {
            "task": "app.workers.reminder_tasks.send_follow_ups",
            "schedule": crontab(hour="9", minute="0"),
        },
    }
)
