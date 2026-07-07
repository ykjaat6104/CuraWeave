from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_user, get_tenant_id
from app.models.user import User
from app.models.patient_insurance import PatientInsurance
from app.schemas.patient_invoice_schema import PatientInvoiceCreate, PatientInvoiceUpdate, PatientInvoiceResponse
from app.services.patient_invoice_service import create_patient_invoice, get_patient_invoices, update_invoice_status

router = APIRouter(prefix="/patient-invoices", tags=["Patient Invoices"])
insurance_router = APIRouter(prefix="/patient-insurance", tags=["Patient Insurance"])


@router.get("/", response_model=List[PatientInvoiceResponse])
async def list_invoices(
    patient_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    patient_uuid = uuid.UUID(patient_id) if patient_id else None
    invoices = await get_patient_invoices(db, clinic_id=tenant_id, patient_id=patient_uuid)
    result = []
    for inv in invoices:
        result.append(PatientInvoiceResponse(
            id=inv.id, patient_id=inv.patient_id, clinic_id=inv.clinic_id,
            amount=inv.amount, description=inv.description, status=inv.status.value,
            due_date=inv.due_date, paid_at=inv.paid_at,
            invoice_pdf_url=inv.invoice_pdf_url, created_at=inv.created_at,
            patient_name=inv.patient.name if inv.patient else None,
            patient_phone=inv.patient.phone if inv.patient else None,
        ))
    return result


@router.post("/", response_model=PatientInvoiceResponse)
async def create_invoice_route(
    data: PatientInvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    inv = await create_patient_invoice(
        db=db, clinic_id=tenant_id, patient_id=data.patient_id,
        amount=data.amount, description=data.description, due_date=data.due_date,
    )
    return PatientInvoiceResponse(
        id=inv.id, patient_id=inv.patient_id, clinic_id=inv.clinic_id,
        amount=inv.amount, description=inv.description, status=inv.status.value,
        due_date=inv.due_date, paid_at=inv.paid_at,
        invoice_pdf_url=inv.invoice_pdf_url, created_at=inv.created_at,
    )


@router.patch("/{invoice_id}/status", response_model=PatientInvoiceResponse)
async def update_invoice_status_route(
    invoice_id: str,
    data: PatientInvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    inv = await update_invoice_status(db, invoice_id=uuid.UUID(invoice_id), status=data.status)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return PatientInvoiceResponse(
        id=inv.id, patient_id=inv.patient_id, clinic_id=inv.clinic_id,
        amount=inv.amount, description=inv.description, status=inv.status.value,
        due_date=inv.due_date, paid_at=inv.paid_at,
        invoice_pdf_url=inv.invoice_pdf_url, created_at=inv.created_at,
    )


@insurance_router.get("/")
async def list_insurance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    result = await db.execute(
        select(PatientInsurance).where(PatientInsurance.clinic_id == tenant_id)
    )
    records = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "patient_name": r.patient.name if r.patient else None,
            "provider": r.provider,
            "policy_number": r.policy_number,
            "status": r.status,
            "expiry_date": r.expiry_date.isoformat() if r.expiry_date else None,
        }
        for r in records
    ]
