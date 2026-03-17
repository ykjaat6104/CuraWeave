from app.config import settings

PLAN_PRICES = {
    "basic": settings.STRIPE_PRICE_BASIC,
    "pro": settings.STRIPE_PRICE_PRO,
    "enterprise": settings.STRIPE_PRICE_ENTERPRISE,
}

PLAN_FEATURES = {
    "free": {"patients": 50, "messages": 100, "campaigns": 1, "ai_triage": False},
    "basic": {"patients": 500, "messages": 2000, "campaigns": 5, "ai_triage": True},
    "pro": {"patients": 5000, "messages": 20000, "campaigns": 20, "ai_triage": True},
    "enterprise": {"patients": -1, "messages": -1, "campaigns": -1, "ai_triage": True},
}


async def create_checkout_session(clinic_id: str, clinic_email: str, plan: str) -> dict:
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    price_id = PLAN_PRICES.get(plan)
    if not price_id:
        raise ValueError(f"Invalid plan: {plan}")
    session = stripe.checkout.Session.create(
        customer_email=clinic_email,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.APP_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.APP_URL}/billing/cancel",
        metadata={"clinic_id": str(clinic_id), "plan": plan}
    )
    return {"checkout_url": session.url, "session_id": session.id}


def construct_webhook_event(payload: bytes, sig_header: str):
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
