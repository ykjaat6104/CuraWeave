import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "CuraWeave"
    assert "docs" in data


@pytest.mark.asyncio
async def test_register_clinic(client: AsyncClient):
    payload = {
        "name": "New Clinic",
        "email": "newclinic@test.com",
        "phone": "+123456789",
        "address": "123 Test St",
        "owner_name": "Dr. Owner",
        "owner_password": "SecurePass123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Clinic"
    assert "id" in data


@pytest.mark.asyncio
async def test_login_doctor(client: AsyncClient, test_clinic: dict):
    payload = {
        "email": test_clinic["user_email"],
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_clinic["user_email"]


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_clinic: dict):
    payload = {
        "email": test_clinic["user_email"],
        "password": "wrongpassword",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_patients_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/patients/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_patients_authenticated(client: AsyncClient, test_clinic: dict):
    headers = {"Authorization": f"Bearer {test_clinic['token']}"}
    response = await client.get("/api/v1/patients/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_patient(client: AsyncClient, test_clinic: dict):
    headers = {"Authorization": f"Bearer {test_clinic['token']}"}
    payload = {
        "name": "Jane Patient",
        "email": "jane@patient.com",
        "phone": "+5551234567",
    }
    response = await client.post("/api/v1/patients/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Patient"


@pytest.mark.asyncio
async def test_list_appointments(client: AsyncClient, test_clinic: dict, test_appointment: dict):
    headers = {"Authorization": f"Bearer {test_clinic['token']}"}
    response = await client.get("/api/v1/appointments/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_billing_plans(client: AsyncClient):
    response = await client.get("/api/v1/billing/plans")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert len(data["plans"]) == 4


@pytest.mark.asyncio
async def test_current_plan(client: AsyncClient, test_clinic: dict):
    headers = {"Authorization": f"Bearer {test_clinic['token']}"}
    response = await client.get("/api/v1/billing/current-plan", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "plan" in data
    assert "features" in data


@pytest.mark.asyncio
async def test_patient_register(client: AsyncClient, test_clinic: dict):
    payload = {
        "name": "Portal Patient",
        "email": "portal@patient.com",
        "password": "SecurePass123!",
        "phone": "+1112223333",
        "clinic_id": str(test_clinic["clinic_id"]),
    }
    response = await client.post("/api/v1/auth/patient/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "portal@patient.com"


@pytest.mark.asyncio
async def test_patient_login_then_triage(client: AsyncClient, test_patient: dict):
    payload = {
        "email": test_patient["patient_email"],
        "password": "patient123",
    }
    login_resp = await client.post("/api/v1/auth/patient/login", json=payload)
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    triage_payload = {"message": "I have a headache and fever since yesterday"}
    triage_resp = await client.post("/api/v1/auth/patient/triage", json=triage_payload, headers=headers)
    assert triage_resp.status_code == 200
    data = triage_resp.json()
    assert "urgency" in data
    assert "recommendation" in data


@pytest.mark.asyncio
async def test_generate_connection_code(client: AsyncClient, test_clinic: dict, test_patient: dict):
    headers = {"Authorization": f"Bearer {test_clinic['token']}"}
    response = await client.post(
        f"/api/v1/patients/{test_patient['patient_id']}/generate-connection-code",
        headers=headers,
        params={"send_email_flag": False, "send_sms_flag": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert "connection_code" in data
    assert data["patient_id"] == str(test_patient["patient_id"])


@pytest.mark.asyncio
async def test_clinic_dashboard(client: AsyncClient, test_clinic: dict):
    headers = {"Authorization": f"Bearer {test_clinic['token']}"}
    response = await client.get("/api/v1/analytics/dashboard", headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_create_appointment(client: AsyncClient, test_clinic: dict, test_patient: dict):
    headers = {"Authorization": f"Bearer {test_clinic['token']}"}
    from datetime import datetime, timedelta
    payload = {
        "patient_id": str(test_patient["patient_id"]),
        "appointment_time": (datetime.utcnow() + timedelta(days=3)).isoformat(),
        "reason": "Follow-up visit",
    }
    response = await client.post("/api/v1/appointments/", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["reason"] == "Follow-up visit"
