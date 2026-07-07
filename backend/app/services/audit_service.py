import uuid
import logging
from typing import Optional
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog

logger = logging.getLogger(__name__)


async def log_action(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    details: Optional[str] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    ip_address = None
    if request:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else None

    log_entry = AuditLog(
        clinic_id=clinic_id,
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log_entry)
    await db.commit()
    return log_entry


async def get_audit_logs(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    limit: int = 100,
    offset: int = 0,
    action: Optional[str] = None,
) -> list:
    from sqlalchemy import select
    query = select(AuditLog).where(AuditLog.clinic_id == clinic_id)
    if action:
        query = query.where(AuditLog.action == action)
    query = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
