from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.models.subscription import SubscriptionPlan, Subscription, Invoice


async def get_plans(db: AsyncSession) -> List[SubscriptionPlan]:
    result = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.price))
    return result.scalars().all()


async def get_plan(db: AsyncSession, plan_id: uuid.UUID) -> Optional[SubscriptionPlan]:
    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    return result.scalar_one_or_none()


async def get_subscription(db: AsyncSession, clinic_id: uuid.UUID) -> Optional[Subscription]:
    result = await db.execute(
        select(Subscription).where(Subscription.clinic_id == clinic_id)
    )
    return result.scalar_one_or_none()


async def create_subscription(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    plan_id: uuid.UUID,
    stripe_customer_id: Optional[str] = None
) -> Subscription:
    sub = Subscription(
        clinic_id=clinic_id,
        plan_id=plan_id,
        stripe_customer_id=stripe_customer_id,
        status="trial"
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def update_subscription_status(
    db: AsyncSession,
    subscription: Subscription,
    status: str,
    stripe_customer_id: Optional[str] = None
) -> Subscription:
    subscription.status = status
    if stripe_customer_id:
        subscription.stripe_customer_id = stripe_customer_id
    await db.commit()
    await db.refresh(subscription)
    return subscription


async def create_invoice(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    subscription_id: uuid.UUID,
    amount: float,
    status: str = "pending"
) -> Invoice:
    invoice = Invoice(
        clinic_id=clinic_id,
        subscription_id=subscription_id,
        amount=amount,
        status=status
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


async def get_invoices(db: AsyncSession, clinic_id: uuid.UUID) -> List[Invoice]:
    result = await db.execute(
        select(Invoice).where(Invoice.clinic_id == clinic_id).order_by(Invoice.invoice_date.desc())
    )
    return result.scalars().all()
