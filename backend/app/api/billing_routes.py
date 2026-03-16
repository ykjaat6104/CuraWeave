from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.config import settings
from app.integrations.stripe_client import PLAN_PRICES, PLAN_FEATURES
from app.services.billing_service import (
    get_plans, get_subscription, create_subscription, update_subscription_status, create_invoice
)

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/plans")
async def list_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "currency": "USD",
                "interval": "month",
                "features": PLAN_FEATURES["free"],
                "description": "Perfect for small clinics getting started"
            },
            {
                "id": "basic",
                "name": "Basic",
                "price": 49,
                "currency": "USD",
                "interval": "month",
                "features": PLAN_FEATURES["basic"],
                "description": "For growing clinics with higher volume"
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 149,
                "currency": "USD",
                "interval": "month",
                "features": PLAN_FEATURES["pro"],
                "description": "Full-featured for established clinics"
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price": 499,
                "currency": "USD",
                "interval": "month",
                "features": PLAN_FEATURES["enterprise"],
                "description": "Unlimited scale for clinic chains"
            },
        ]
    }


@router.post("/create-checkout-session")
async def create_checkout_session(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        plan = body.get("plan", "basic")
        price_id = PLAN_PRICES.get(plan)

        if not price_id:
            raise HTTPException(status_code=400, detail="Invalid plan")

        session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{settings.APP_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.APP_URL}/billing/cancel",
            metadata={"clinic_id": str(current_user.clinic_id), "plan": plan}
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            import uuid
            clinic_id = uuid.UUID(session["metadata"]["clinic_id"])
            stripe_customer_id = session.get("customer")

            sub = await get_subscription(db, clinic_id)
            if sub:
                await update_subscription_status(db, sub, "active", stripe_customer_id)
            else:
                from sqlalchemy import select
                from app.models.subscription import SubscriptionPlan
                plan_result = await db.execute(
                    select(SubscriptionPlan).where(SubscriptionPlan.name.ilike("basic")).limit(1)
                )
                plan = plan_result.scalar_one_or_none()
                if plan:
                    await create_subscription(db, clinic_id, plan.id, stripe_customer_id)

        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/current-plan")
async def get_current_plan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = await get_subscription(db, current_user.clinic_id)
    plan_name = "free"
    if sub:
        from sqlalchemy import select
        from app.models.subscription import SubscriptionPlan
        plan_result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == sub.plan_id)
        )
        plan = plan_result.scalar_one_or_none()
        if plan:
            plan_name = plan.name.lower()

    return {
        "plan": plan_name,
        "status": sub.status if sub else "none",
        "features": PLAN_FEATURES.get(plan_name, PLAN_FEATURES["free"])
    }
