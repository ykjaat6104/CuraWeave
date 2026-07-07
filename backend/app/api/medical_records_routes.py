import os
import uuid
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pathlib import Path

from app.database import get_db
from app.dependencies import get_current_user, get_tenant_id
from app.config import UPLOAD_DIR
from app.models.user import User
from app.models.patient import Patient
from app.schemas.medical_record_schema import MedicalRecordCreate, MedicalRecordResponse
from app.services.medical_record_service import create_record, get_records, get_patient_records, get_record_by_id
from app.utils.auth import decode_token

router = APIRouter(prefix="/medical-records", tags=["Medical Records"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"}
RECORD_TYPES = ["vital", "lab", "diagnosis", "note", "imaging", "prescription", "vaccination", "procedure", "other"]

def _record_to_response(r):
    file_url = None
    if r.value and isinstance(r.value, dict) and r.value.get("url"):
        file_url = f"/api/v1/medical-records/{r.id}/file"
    return MedicalRecordResponse(
        id=r.id, patient_id=r.patient_id, clinic_id=r.clinic_id,
        doctor_id=r.doctor_id, record_type=r.record_type, title=r.title,
        description=r.description, value=r.value, recorded_at=r.recorded_at,
        created_at=r.created_at,
        doctor_name=None, uploaded_by=None,
        file_url=file_url,
    )


@router.get("/", response_model=List[MedicalRecordResponse])
async def list_records(
    patient_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    patient_uuid = uuid.UUID(patient_id) if patient_id else None
    records = await get_records(db, clinic_id=tenant_id, patient_id=patient_uuid)
    return [_record_to_response(r) for r in records]


@router.get("/patient/{patient_id}", response_model=List[MedicalRecordResponse])
async def get_patient_records_route(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    records = await get_patient_records(db, patient_id=uuid.UUID(patient_id), clinic_id=tenant_id)
    return [_record_to_response(r) for r in records]


@router.post("/", response_model=MedicalRecordResponse)
async def create_record_route(
    data: MedicalRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    record = await create_record(
        db=db, clinic_id=tenant_id, patient_id=data.patient_id,
        doctor_id=current_user.id, record_type=data.record_type,
        title=data.title, description=data.description,
        value=data.value, recorded_at=str(data.recorded_at) if data.recorded_at else None,
    )
    return _record_to_response(record)


@router.post("/upload")
async def upload_doctor_record(
    patient_id: str = Form(...),
    record_type: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
):
    if record_type not in RECORD_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid record type. Must be one of: {', '.join(RECORD_TYPES)}")

    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}{ext}"
    clinic_dir = UPLOAD_DIR / str(tenant_id)
    clinic_dir.mkdir(exist_ok=True)
    file_path = clinic_dir / safe_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/{tenant_id}/{safe_name}"
    file_meta = {
        "url": file_url,
        "original_name": file.filename,
        "file_type": file.content_type,
        "file_size": os.path.getsize(file_path),
    }

    record = await create_record(
        db=db, clinic_id=tenant_id, patient_id=uuid.UUID(patient_id),
        doctor_id=current_user.id, record_type=record_type,
        title=title, description=description, value=file_meta,
    )
    return _record_to_response(record)


@router.get("/{record_id}/file")
async def get_record_file(
    record_id: str,
    request: Request,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    # Resolve tenant + user from Authorization header or ?token= query param
    auth_header = request.headers.get("Authorization", "")
    raw_token = ""
    if auth_header.startswith("Bearer "):
        raw_token = auth_header[len("Bearer "):]
    elif token:
        raw_token = token

    if not raw_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_token(raw_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    clinic_id_str = payload.get("clinic_id")
    if not clinic_id_str:
        raise HTTPException(status_code=401, detail="Invalid token: no clinic")
    try:
        clinic_id = uuid.UUID(clinic_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid clinic ID in token")

    record = await get_record_by_id(db, uuid.UUID(record_id), clinic_id=clinic_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if not record.value or not isinstance(record.value, dict) or not record.value.get("url"):
        raise HTTPException(status_code=404, detail="No file attached to this record")

    file_url = record.value["url"]
    if file_url.startswith("/uploads/"):
        relative_path = file_url[len("/uploads/"):]
        file_path = UPLOAD_DIR / relative_path
    else:
        file_path = Path(file_url)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    original_name = record.value.get("original_name", f"record_{record_id}")
    content_type = record.value.get("file_type", "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        media_type=content_type,
        filename=original_name,
    )
