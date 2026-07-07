#!/usr/bin/env python3
"""
Seed script for CuraWeave test credentials.

Creates:
  - A test clinic (admin@curaweave.com)
  - Admin user + Doctor user (email_verified=True)
  - A test patient (email_verified=True)
  - Subscription plans + a basic plan subscription

This is IDEMPOTENT — safe to run multiple times. It skips existing
records and updates password hashes to ensure they stay in sync.

Usage:
  cd backend && python scripts/seed.py
"""

import asyncio
import uuid
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models.clinic import Clinic
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.appointment import DoctorAvailability, WeekDay
from app.utils.security import get_password_hash

SEED_CLINIC_EMAIL = "admin@curaweave.com"
SEED_CLINIC_NAME = "CuraWeave Demo Clinic"

SEED_ADMIN_EMAIL = "admin@curaweave.com"
SEED_ADMIN_PASSWORD = "Admin@123!"

SEED_DOCTOR_EMAIL = "doctor@curaweave.com"
SEED_DOCTOR_PASSWORD = "Doctor@123!"

SEED_PATIENT_EMAIL = "patient@curaweave.com"
SEED_PATIENT_PASSWORD = "Patient@123!"

PLANS = [
    {"name": "free", "price": "0.00", "message_limit": 100, "ai_requests_limit": 10},
    {"name": "basic", "price": "29.00", "message_limit": 2000, "ai_requests_limit": 500},
    {"name": "pro", "price": "99.00", "message_limit": 20000, "ai_requests_limit": 5000},
    {"name": "enterprise", "price": "299.00", "message_limit": -1, "ai_requests_limit": -1},
]


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        for pdata in PLANS:
            result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == pdata["name"]))
            if not result.scalar_one_or_none():
                plan = SubscriptionPlan(
                    id=uuid.uuid4(),
                    name=pdata["name"],
                    price=Decimal(pdata["price"]),
                    message_limit=pdata["message_limit"],
                    ai_requests_limit=pdata["ai_requests_limit"],
                )
                db.add(plan)
        await db.commit()

        result = await db.execute(select(Clinic).where(Clinic.email == SEED_CLINIC_EMAIL))
        clinic = result.scalar_one_or_none()
        if not clinic:
            clinic = Clinic(
                id=uuid.uuid4(),
                name=SEED_CLINIC_NAME,
                email=SEED_CLINIC_EMAIL,
                phone="+1-555-0100",
                address="123 Health St, Medical City, MC 12345",
                is_active=True,
            )
            db.add(clinic)
            await db.commit()
            await db.refresh(clinic)
            print(f"✓ Created clinic: {clinic.name}")
        else:
            print(f"✓ Using existing clinic: {clinic.name}")

        result = await db.execute(select(Subscription).where(Subscription.clinic_id == clinic.id))
        sub = result.scalar_one_or_none()
        if not sub:
            result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == "basic"))
            basic_plan = result.scalar_one_or_none()
            if basic_plan:
                sub = Subscription(
                    id=uuid.uuid4(),
                    clinic_id=clinic.id,
                    plan_id=basic_plan.id,
                    status="active",
                )
                db.add(sub)
                await db.commit()
                print("✓ Created basic subscription for clinic")
        else:
            print("✓ Clinic already has a subscription")

        result = await db.execute(select(User).where(User.email == SEED_ADMIN_EMAIL))
        admin = result.scalar_one_or_none()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                clinic_id=clinic.id,
                email=SEED_ADMIN_EMAIL,
                password_hash=get_password_hash(SEED_ADMIN_PASSWORD),
                name="Admin User",
                role=UserRole.ADMIN,
                email_verified=True,
            )
            db.add(admin)
            print(f"✓ Created admin: {SEED_ADMIN_EMAIL}")
        else:
            admin.password_hash = get_password_hash(SEED_ADMIN_PASSWORD)
            admin.clinic_id = clinic.id
            admin.email_verified = True
            print(f"✓ Updated admin: {SEED_ADMIN_EMAIL}")

        result = await db.execute(select(User).where(User.email == SEED_DOCTOR_EMAIL))
        doctor = result.scalar_one_or_none()
        if not doctor:
            doctor = User(
                id=uuid.uuid4(),
                clinic_id=clinic.id,
                email=SEED_DOCTOR_EMAIL,
                password_hash=get_password_hash(SEED_DOCTOR_PASSWORD),
                name="Dr. Smith",
                role=UserRole.DOCTOR,
                email_verified=True,
            )
            db.add(doctor)
            print(f"✓ Created doctor: {SEED_DOCTOR_EMAIL}")
        else:
            doctor.password_hash = get_password_hash(SEED_DOCTOR_PASSWORD)
            doctor.clinic_id = clinic.id
            doctor.email_verified = True
            print(f"✓ Updated doctor: {SEED_DOCTOR_EMAIL}")

        # Seed DoctorAvailability rules (Mon-Fri 09:00-17:00, 30-min slots)
        existing_rules = await db.execute(
            select(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor.id)
        )
        if not existing_rules.scalars().first():
            for day in [WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY, WeekDay.FRIDAY]:
                rule = DoctorAvailability(
                    id=uuid.uuid4(),
                    doctor_id=doctor.id,
                    clinic_id=clinic.id,
                    day_of_week=day,
                    start_time="09:00",
                    end_time="17:00",
                    slot_duration=30,
                    is_active=True,
                )
                db.add(rule)
            print("✓ Created doctor availability (Mon-Fri 09:00-17:00)")
        else:
            print("✓ Doctor availability already exists")

        result = await db.execute(
            select(Patient).where(Patient.email == SEED_PATIENT_EMAIL, Patient.clinic_id == clinic.id)
        )
        patient = result.scalar_one_or_none()
        if not patient:
            patient = Patient(
                id=uuid.uuid4(),
                clinic_id=clinic.id,
                name="Test Patient",
                email=SEED_PATIENT_EMAIL,
                phone="+1-555-0200",
                password_hash=get_password_hash(SEED_PATIENT_PASSWORD),
                email_verified=True,
            )
            db.add(patient)
            print(f"✓ Created patient: {SEED_PATIENT_EMAIL}")
        else:
            patient.password_hash = get_password_hash(SEED_PATIENT_PASSWORD)
            patient.email_verified = True
            print(f"✓ Updated patient: {SEED_PATIENT_EMAIL}")

        await db.commit()

    print()
    print("=" * 50)
    print("  SEED COMPLETE")
    print("=" * 50)
    print()
    print("Admin / Doctor Portal (login at /auth/login):")
    print(f"  Email:    {SEED_ADMIN_EMAIL}")
    print(f"  Password: {SEED_ADMIN_PASSWORD}")
    print()
    print("  Email:    {0}".format(SEED_DOCTOR_EMAIL))
    print(f"  Password: {SEED_DOCTOR_PASSWORD}")
    print()
    print("Patient Portal (login at /auth/patient/login):")
    print(f"  Email:    {SEED_PATIENT_EMAIL}")
    print(f"  Password: {SEED_PATIENT_PASSWORD}")
    print()
    print("All users have email_verified=True — no verification needed.")


if __name__ == "__main__":
    asyncio.run(seed())
