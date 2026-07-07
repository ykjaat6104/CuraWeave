from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import Optional, List
from decimal import Decimal
import uuid
from datetime import datetime

from app.models.patient_invoice import PatientInvoice, PatientInvoiceStatus


async def create_patient_invoice(
    db: AsyncSession,
    clinic_id: uuid.UUID,
    patient_id: uuid.UUID,
    amount: Decimal,
    description: Optional[str] = None,
    due_date: Optional[datetime] = None,
) -> PatientInvoice:
    invoice = PatientInvoice(
        clinic_id=clinic_id,
        patient_id=patient_id,
        amount=amount,
        description=description,
        due_date=due_date,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


async def get_patient_invoices(
    db: AsyncSession, clinic_id: uuid.UUID, patient_id: Optional[uuid.UUID] = None
) -> List[PatientInvoice]:
    query = (
        select(PatientInvoice)
        .options(joinedload(PatientInvoice.patient))
        .where(PatientInvoice.clinic_id == clinic_id)
    )
    if patient_id:
        query = query.where(PatientInvoice.patient_id == patient_id)
    query = query.order_by(PatientInvoice.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def update_invoice_status(
    db: AsyncSession,
    invoice_id: uuid.UUID,
    status: str,
) -> Optional[PatientInvoice]:
    result = await db.execute(select(PatientInvoice).where(PatientInvoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        return None
    invoice.status = PatientInvoiceStatus(status)
    if status == "paid":
        invoice.paid_at = datetime.utcnow()
    await db.commit()
    await db.refresh(invoice)
    return invoice
