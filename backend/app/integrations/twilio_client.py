from app.config import settings


async def send_whatsapp(to_number: str, message: str) -> dict:
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"
        msg = client.messages.create(
            body=message,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=to_number
        )
        return {"success": True, "sid": msg.sid, "status": msg.status}
    except Exception:
        print(f"Twilio not configured, message not sent to {to_number}")
        return {"success": False, "mock": True}
