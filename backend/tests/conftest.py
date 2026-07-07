import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.utils.security import get_password_hash, create_access_token

# Use test database
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/curaweave_test"
settings.DATABASE_URL = TEST_DATABASE_URL
settings.SYNC_DATABASE_URL = "postgresql://postgres:password@localhost:5432/curaweave_test"


@pytest_asyncio.fixture(scope="session")
async def db_engine():
    # Import all models so they register with Base.metadata
    import app.models.clinic  # noqa: F401
    import app.models.user  # noqa: F401
    import app.models.patient  # noqa: F401
    import app.models.appointment  # noqa: F401
    import app.models.message  # noqa: F401
    import app.models.triage  # noqa: F401
    import app.models.campaign  # noqa: F401
    import app.models.subscription  # noqa: F401
    import app.models.patient_doctor_link  # noqa: F401
    import app.models.knowledge_base  # noqa: F401
    import app.models.audit  # noqa: F401

    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()
        await session.close()


@pytest_asyncio.fixture
async def client(db_engine) -> AsyncGenerator[AsyncClient, None]:
    from app.database import AsyncSessionLocal

    original_factory = AsyncSessionLocal

    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    from main import app
    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_clinic(db_session: AsyncSession) -> dict:
    from app.models.clinic import Clinic
    from app.models.user import User, UserRole

    clinic_id = uuid.uuid4()
    clinic = Clinic(
        id=clinic_id,
        name="Test Clinic",
        email=f"testclinic-{uuid.uuid4().hex[:8]}@example.com",
        phone="+1234567890",
        is_active=True,
    )
    db_session.add(clinic)

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        clinic_id=clinic_id,
        name="Test Doctor",
        email=f"doctor-{uuid.uuid4().hex[:8]}@testclinic.com",
        password_hash=get_password_hash("password123"),
        role=UserRole.DOCTOR,
    )
    db_session.add(user)

    from app.models.subscription import SubscriptionPlan, Subscription
    plan = SubscriptionPlan(
        id=uuid.uuid4(),
        name="basic",
        price=29.99,
        message_limit=1000,
        ai_requests_limit=100,
    )
    db_session.add(plan)
    sub = Subscription(
        id=uuid.uuid4(),
        clinic_id=clinic_id,
        plan_id=plan.id,
        status="active",
    )
    db_session.add(sub)
    await db_session.commit()

    token = create_access_token({"sub": str(user_id), "clinic_id": str(clinic_id)})

    return {
        "clinic_id": clinic_id,
        "user_id": user_id,
        "user_email": user.email,
        "token": token,
        "user": user,
        "clinic": clinic,
    }


@pytest_asyncio.fixture
async def test_patient(db_session: AsyncSession, test_clinic: dict) -> dict:
    from app.models.patient import Patient

    patient_id = uuid.uuid4()
    patient = Patient(
        id=patient_id,
        clinic_id=test_clinic["clinic_id"],
        name="Test Patient",
        phone="+9876543210",
        email=f"patient-{uuid.uuid4().hex[:8]}@example.com",
        password_hash=get_password_hash("patient123"),
    )
    db_session.add(patient)
    await db_session.commit()

    token = create_access_token({
        "sub": str(patient_id),
        "role": "patient",
        "clinic_id": str(test_clinic["clinic_id"]),
    })

    return {
        "patient_id": patient_id,
        "patient_email": patient.email,
        "token": token,
        "patient": patient,
    }


@pytest_asyncio.fixture
async def test_appointment(db_session: AsyncSession, test_clinic: dict, test_patient: dict) -> dict:
    from app.models.appointment import Appointment
    from datetime import datetime, timedelta

    appointment_id = uuid.uuid4()
    appointment = Appointment(
        id=appointment_id,
        clinic_id=test_clinic["clinic_id"],
        patient_id=test_patient["patient_id"],
        doctor_id=test_clinic["user_id"],
        appointment_time=datetime.utcnow() + timedelta(days=1),
        reason="Test checkup",
    )
    db_session.add(appointment)
    await db_session.commit()

    return {"appointment_id": appointment_id, "appointment": appointment}
