from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta, date, time

from app.database import get_db
from app.models.clinic import Clinic
from app.models.patient import Patient
from app.models.appointment import Appointment, DoctorAvailability, WeekDay, AppointmentStatus
from app.schemas.public_schema import PublicClinicResponse, TimeSlot, BookAppointmentRequest
from app.utils.auth import get_current_patient

router = APIRouter(prefix="/public", tags=["Public"])

@router.get("/clinics", response_model=List[PublicClinicResponse])
async def list_public_clinics(db: AsyncSession = Depends(get_db)):
    """List all active clinics in the system."""
    query = select(Clinic).where(Clinic.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/clinics/{clinic_id}", response_model=PublicClinicResponse)
async def get_public_clinic(clinic_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get basic info for a specific clinic."""
    query = select(Clinic).where(and_(Clinic.id == clinic_id, Clinic.is_active == True))
    result = await db.execute(query)
    clinic = result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinic

@router.get("/clinics/{clinic_id}/slots", response_model=List[TimeSlot])
async def get_clinic_slots(
    clinic_id: UUID,
    target_date: date = Query(..., description="The date to check for slots (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate available time slots for a specific clinic on a given date.
    Intersects DoctorAvailability rules with existing Appointments.
    """
    # 1. Get availability rules for this clinic for the target weekday
    day_name = target_date.strftime("%A").lower()
    try:
        weekday_enum = WeekDay(day_name)
    except ValueError:
        return []

    query_avail = select(DoctorAvailability).where(
        and_(
            DoctorAvailability.clinic_id == clinic_id,
            DoctorAvailability.day_of_week == weekday_enum,
            DoctorAvailability.is_active == True
        )
    )
    result_avail = await db.execute(query_avail)
    avail_rules = result_avail.scalars().all()

    if not avail_rules:
        return []

    # 2. Get existing appointments for this clinic on that date
    start_of_day = datetime.combine(target_date, time.min)
    end_of_day = datetime.combine(target_date, time.max)

    query_apps = select(Appointment).where(
        and_(
            Appointment.clinic_id == clinic_id,
            Appointment.appointment_time >= start_of_day,
            Appointment.appointment_time <= end_of_day,
            Appointment.status != AppointmentStatus.CANCELLED
        )
    )
    result_apps = await db.execute(query_apps)
    existing_apps = result_apps.scalars().all()

    # 3. Calculate slots
    available_slots = []
    
    # We'll treat slots as unassigned to a specific doctor for now, 
    # or just list all unique slots from all active doctors.
    # For simplicity, we iterate through each doctor's availability.
    for rule in avail_rules:
        # Parse HH:MM
        try:
            start_h, start_m = map(int, rule.start_time.split(':'))
            end_h, end_m = map(int, rule.end_time.split(':'))
        except ValueError:
            continue

        current_time = datetime.combine(target_date, time(start_h, start_m))
        end_time_dt = datetime.combine(target_date, time(end_h, end_m))

        while current_time + timedelta(minutes=rule.slot_duration) <= end_time_dt:
            slot_end = current_time + timedelta(minutes=rule.slot_duration)
            
            # Check if this slot overlaps with any existing appointment for THIS doctor
            is_taken = any(
                app.doctor_id == rule.doctor_id and
                (
                    (app.appointment_time <= current_time < app.appointment_time + timedelta(minutes=app.duration_minutes)) or
                    (app.appointment_time < slot_end <= app.appointment_time + timedelta(minutes=app.duration_minutes))
                )
                for app in existing_apps
            )

            if not is_taken:
                # Basic check: Don't show past slots for today
                if current_time > datetime.now():
                    available_slots.append(TimeSlot(
                        start_time=current_time,
                        end_time=slot_end,
                        available=True
                    ))
            
            current_time = slot_end

    # Sort and remove duplicates (if multiple doctors have same slots)
    available_slots.sort(key=lambda x: x.start_time)
    
    # Simple deduplication by start time
    unique_slots = []
    seen_times = set()
    for s in available_slots:
        if s.start_time not in seen_times:
            unique_slots.append(s)
            seen_times.add(s.start_time)

    return unique_slots

@router.post("/book")
async def book_appointment(
    request: BookAppointmentRequest,
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient)
):
    """
    Finalize an appointment booking for an authenticated patient.
    Handles auto-onboarding (linking patient to clinic) if necessary.
    """
    # 1. Verify Clinic exists
    clinic_query = select(Clinic).where(Clinic.id == request.clinic_id)
    clinic_result = await db.execute(clinic_query)
    clinic = clinic_result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    # 2. Auto-onboarding: Check if patient belongs to this clinic
    if current_patient.clinic_id != request.clinic_id:
        # In a multi-tenant system, we might want to allow a patient to be in multiple clinics
        # but the current schema has clinic_id on Patient model. 
        # For Phase 1, we update the patient's primary clinic if they are booking there.
        current_patient.clinic_id = request.clinic_id
        db.add(current_patient)

    # 3. Find an available doctor for this slot
    day_name = request.appointment_time.strftime("%A").lower()
    weekday_enum = WeekDay(day_name)
    slot_time_str = request.appointment_time.strftime("%H:%M")

    # This is a bit simplified: find any active doctor at this clinic who has this time in their rules
    # and doesn't have a conflict.
    avail_query = select(DoctorAvailability).where(
        and_(
            DoctorAvailability.clinic_id == request.clinic_id,
            DoctorAvailability.day_of_week == weekday_enum,
            DoctorAvailability.start_time <= slot_time_str,
            DoctorAvailability.end_time > slot_time_str,
            DoctorAvailability.is_active == True
        )
    )
    avail_result = await db.execute(avail_query)
    avail_doctors = avail_result.scalars().all()

    assigned_doctor_id = None
    for rule in avail_doctors:
        # Check conflict for this specific doctor
        conflict_query = select(Appointment).where(
            and_(
                Appointment.doctor_id == rule.doctor_id,
                Appointment.appointment_time == request.appointment_time,
                Appointment.status != AppointmentStatus.CANCELLED
            )
        )
        conflict_result = await db.execute(conflict_query)
        if not conflict_result.scalar_one_or_none():
            assigned_doctor_id = rule.doctor_id
            break
    
    if not assigned_doctor_id:
        raise HTTPException(status_code=400, detail="Slot is no longer available")

    # 4. Create Appointment
    new_app = Appointment(
        clinic_id=request.clinic_id,
        patient_id=current_patient.id,
        doctor_id=assigned_doctor_id,
        appointment_time=request.appointment_time,
        status=AppointmentStatus.SCHEDULED,
        reason=request.reason
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)

    return {
        "message": "Appointment booked successfully",
        "appointment_id": new_app.id,
        "time": new_app.appointment_time
    }
