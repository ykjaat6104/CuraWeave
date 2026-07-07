import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_tenant_id
from app.models.user import User
from app.services.audit_service import get_audit_logs, log_action

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit-logs", tags=["Audit"])


@router.get("/")
async def list_audit_logs(
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    logs = await get_audit_logs(
        db=db, clinic_id=tenant_id,
        limit=min(limit, 500), offset=offset,
        action=action,
    )
    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "user_name": log.user.name if log.user else None,
            "user_role": log.user.role.value if log.user and hasattr(log.user.role, 'value') else (log.user.role if log.user else None),
            "action": log.action,
            "resource": log.resource,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
