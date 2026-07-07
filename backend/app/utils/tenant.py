from typing import Optional
from uuid import UUID

from fastapi import Request, HTTPException, Depends
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, tenant_id_var


def get_current_tenant_id() -> Optional[UUID]:
    return tenant_id_var.get()


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tenant_id: Optional[UUID] = None

        # Try JWT token first (authenticated routes)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ")
            try:
                from app.utils.security import decode_token
                payload = decode_token(token)
                cid = payload.get("clinic_id")
                if cid:
                    tenant_id = UUID(cid)
            except Exception:
                pass

        # Fallback to X-Clinic-ID header (public routes like booking)
        if tenant_id is None:
            header_cid = request.headers.get("X-Clinic-ID")
            if header_cid:
                try:
                    tenant_id = UUID(header_cid)
                except Exception:
                    pass

        # Set tenant context
        token = tenant_id_var.set(tenant_id)

        # Add helper to request state
        request.state.tenant_id = tenant_id

        try:
            response = await call_next(request)
        finally:
            tenant_id_var.reset(token)

        return response


async def get_tenant_id(request: Request) -> UUID:
    tenant_id = get_current_tenant_id()
    if tenant_id is None:
        raise HTTPException(status_code=401, detail="Tenant context required")
    return tenant_id


async def require_active_clinic(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    from app.models.clinic import Clinic
    tenant_id = await get_tenant_id(request)
    result = await db.execute(select(Clinic).where(Clinic.id == tenant_id))
    clinic = result.scalar_one_or_none()
    if not clinic or not clinic.is_active:
        raise HTTPException(status_code=403, detail="Clinic account is inactive. Please contact support.")
    return clinic
