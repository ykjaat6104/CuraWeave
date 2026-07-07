import asyncio
import uuid
from datetime import datetime, date, time
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models.clinic import Clinic
from app.models.user import User, UserRole
from app.models.appointment import DoctorAvailability, WeekDay
from app.utils.security import get_password_hash

async def setup_test_data():
    # 1. Initialize DB tables
    await init_db()
    
    async with AsyncSessionLocal() as db:
        # 2. Check if a clinic already exists
        result = await db.execute(select(Clinic).limit(1))
        existing_clinic = result.scalar_one_or_none()
        
        if existing_clinic:
            print(f"Using existing clinic: {existing_clinic.name} ({existing_clinic.id})")
            clinic_id = existing_clinic.id
        else:
            # Create a test clinic
            new_clinic = Clinic(
                id=uuid.uuid4(),
                name="Test Wellness Clinic",
                email="contact@testclinic.com",
                phone="123-456-7890",
                address="123 Health St, Medical City",
                is_active=True
            )
            db.add(new_clinic)
            await db.commit()
            await db.refresh(new_clinic)
            clinic_id = new_clinic.id
            print(f"Created new clinic: {new_clinic.name} ({clinic_id})")

        # 3. Create/Get a test doctor
        result = await db.execute(select(User).where(User.clinic_id == clinic_id, User.role == UserRole.DOCTOR).limit(1))
        doctor = result.scalar_one_or_none()
        
        if not doctor:
            doctor = User(
                id=uuid.uuid4(),
                clinic_id=clinic_id,
                email="doctor@curaweave.dev",
                password_hash=get_password_hash("password123"),
                name="Dr. Smith",
                role=UserRole.DOCTOR
            )
            db.add(doctor)
            await db.commit()
            await db.refresh(doctor)
            print(f"Created doctor: {doctor.name} ({doctor.id})")
        else:
            print(f"Using existing doctor: {doctor.name} ({doctor.email})")

        # 4. Add Availability (9 AM to 5 PM for Monday-Friday)
        days = [WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY, WeekDay.FRIDAY]
        
        # Check existing availability
        avail_result = await db.execute(select(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor.id))
        if not avail_result.scalars().first():
            for day in days:
                avail = DoctorAvailability(
                    id=uuid.uuid4(),
                    doctor_id=doctor.id,
                    clinic_id=clinic_id,
                    day_of_week=day,
                    start_time="09:00",
                    end_time="17:00",
                    slot_duration=30,
                    is_active=True
                )
                db.add(avail)
            await db.commit()
            print("Added availability rules for Dr. Smith (Mon-Fri, 09:00-17:00)")
        else:
            print("Doctor already has availability rules.")

        print("\nSETUP COMPLETE.")
        print(f"Booking URL: http://localhost:5173/book/{clinic_id}")

if __name__ == "__main__":
    asyncio.run(setup_test_data())
