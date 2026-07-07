from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan
from app.utils.auth import get_current_user

PLAN_FEATURES = {
    "free": {"patients": 50, "messages": 100, "campaigns": 1, "ai_triage": False},
    "basic": {"patients": 500, "messages": 2000, "campaigns": 5, "ai_triage": True},
    "pro": {"patients": 5000, "messages": 20000, "campaigns": 20, "ai_triage": True},
    "enterprise": {"patients": -1, "messages": -1, "campaigns": -1, "ai_triage": True},
}


async def get_clinic_plan(
    clinic_id: UUID,
    db: AsyncSession,
) -> str:
    result = await db.execute(
        select(Subscription).where(Subscription.clinic_id == clinic_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return "free"

    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == sub.plan_id)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        return "free"

    return plan.name.lower()


def require_feature(feature: str):
    async def dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        plan_name = await get_clinic_plan(current_user.clinic_id, db)
        features = PLAN_FEATURES.get(plan_name, PLAN_FEATURES["free"])

        if not features.get(feature, False):
            limit_info = ""
            if isinstance(features.get(feature), (int, float)) and features[feature] >= 0:
                limit_info = f" (limit: {features[feature]})"
            raise HTTPException(
                status_code=403,
                detail=f"Your {plan_name} plan does not include {feature}{limit_info}. "
                       f"Please upgrade your plan to access this feature.",
            )
        return current_user

    return dependency


async def check_usage_limit(
    clinic_id: UUID,
    feature: str,
    current_usage: int,
    db: AsyncSession,
) -> bool:
    plan_name = await get_clinic_plan(clinic_id, db)
    features = PLAN_FEATURES.get(plan_name, PLAN_FEATURES["free"])
    limit = features.get(feature, 0)
    if limit < 0:
        return True
    return current_usage < limit
