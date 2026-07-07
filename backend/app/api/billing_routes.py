import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.subscription import SubscriptionPlan
from app.config import settings
from app.utils.features import PLAN_FEATURES
from app.services.payment import payment_gateway
from app.services.billing_service import (
    get_plans, get_subscription, get_subscription_by_customer,
    create_subscription, update_subscription_status,
    cancel_subscription, deactivate_clinic, reactivate_clinic,
    create_invoice, get_invoices
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["Billing"])

PLAN_PRICES_INR = {
    "basic": 49900,
    "pro": 149900,
    "enterprise": 499900,
}


@router.get("/plans")
async def list_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "currency": "INR",
                "interval": "month",
                "features": PLAN_FEATURES["free"],
                "description": "Perfect for small clinics getting started"
            },
            {
                "id": "basic",
                "name": "Basic",
                "price": 499,
                "currency": "INR",
                "interval": "month",
                "features": PLAN_FEATURES["basic"],
                "description": "For growing clinics with higher volume"
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 1499,
                "currency": "INR",
                "interval": "month",
                "features": PLAN_FEATURES["pro"],
                "description": "Full-featured for established clinics"
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price": 4999,
                "currency": "INR",
                "interval": "month",
                "features": PLAN_FEATURES["enterprise"],
                "description": "Unlimited scale for clinic chains"
            },
        ]
    }


@router.post("/create-order")
async def create_order(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = body.get("plan", "basic")
    amount_paisa = PLAN_PRICES_INR.get(plan)
    if not amount_paisa:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if not settings.RAZORPAY_KEY_ID:
        return {"demo": True, "plan": plan}

    receipt_id = f"sub_{current_user.clinic_id}_{uuid.uuid4().hex[:8]}"
    notes = {
        "clinic_id": str(current_user.clinic_id),
        "user_id": str(current_user.id),
        "plan": plan,
    }

    order = payment_gateway.create_order(amount_paisa, receipt_id, notes)
    return {
        "order_id": order["order_id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": settings.RAZORPAY_KEY_ID,
        "plan": plan,
        "receipt": receipt_id,
    }


@router.post("/verify-payment")
async def verify_payment(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan_name = body.get("plan", "basic")
    demo = body.get("demo", False)

    if not demo:
        razorpay_payment_id = body.get("razorpay_payment_id")
        razorpay_order_id = body.get("razorpay_order_id")
        razorpay_signature = body.get("razorpay_signature")
        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            raise HTTPException(status_code=400, detail="Missing payment verification fields")
        is_valid = payment_gateway.verify_payment(
            razorpay_payment_id, razorpay_order_id, razorpay_signature
        )
        if not is_valid:
            raise HTTPException(status_code=400, detail="Payment signature verification failed")

    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.name.ilike(plan_name)).limit(1)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=400, detail=f"Plan '{plan_name}' not found")

    sub = await get_subscription(db, current_user.clinic_id)
    if sub:
        await update_subscription_status(db, sub, "active")
    else:
        await create_subscription(db, current_user.clinic_id, plan.id, gateway_customer_id="demo_activation")

    await reactivate_clinic(db, current_user.clinic_id)

    amount_inr = PLAN_PRICES_INR.get(plan_name, 0) / 100.0
    target_sub = sub or await get_subscription(db, current_user.clinic_id)
    if target_sub:
        await create_invoice(db, current_user.clinic_id, target_sub.id, amount_inr, status="paid")

    mode = "demo" if demo else "live"
    logger.info(f"[{mode}] Plan activated for clinic {current_user.clinic_id}, plan={plan_name}")
    return {"status": "success", "plan": plan_name, "demo": demo}


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    payload = await request.body()
    sig_header = request.headers.get("x-razorpay-signature", "")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing webhook signature")

    if not payment_gateway.verify_webhook(payload, sig_header):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    import json
    event = json.loads(payload)
    event_type = event.get("event", "")
    logger.info(f"Razorpay webhook received: {event_type}")

    try:
        if event_type == "payment.captured":
            payment_entity = event["payload"]["payment"]["entity"]
            payment_id = payment_entity.get("id")
            notes = payment_entity.get("notes", {})
            clinic_id_str = notes.get("clinic_id")
            plan_name = notes.get("plan", "basic")

            if clinic_id_str:
                clinic_id = uuid.UUID(clinic_id_str)
                plan_result = await db.execute(
                    select(SubscriptionPlan).where(SubscriptionPlan.name.ilike(plan_name)).limit(1)
                )
                plan = plan_result.scalar_one_or_none()
                if plan:
                    sub = await get_subscription(db, clinic_id)
                    if sub:
                        await update_subscription_status(db, sub, "active")
                    else:
                        await create_subscription(db, clinic_id, plan.id, gateway_customer_id=payment_id)
                    await reactivate_clinic(db, clinic_id)
                    amount_inr = PLAN_PRICES_INR.get(plan_name, 0) / 100.0
                    sub = sub or await get_subscription(db, clinic_id)
                    if sub:
                        await create_invoice(db, clinic_id, sub.id, amount_inr, status="paid")
                    logger.info(f"Webhook activated clinic {clinic_id}, plan={plan_name}")
    except Exception as e:
        logger.error(f"Error processing webhook {event_type}: {e}", exc_info=True)

    return {"status": "ok"}


@router.get("/current-plan")
async def get_current_plan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = await get_subscription(db, current_user.clinic_id)
    plan_name = "free"
    if sub:
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
