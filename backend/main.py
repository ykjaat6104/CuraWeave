from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging

from app.config import settings, UPLOAD_DIR
from app.database import init_db
from app.utils.tenant import TenantMiddleware, require_active_clinic
from app.utils.rate_limiter import RateLimitMiddleware
from app.utils.https_redirect import HTTPSRedirectMiddleware
from app.utils.errors import register_error_handlers
from app.api.auth_routes import router as auth_router
from app.api.auth_patient_routes import router as patient_auth_router
from app.api.patient_routes import router as patients_router
from app.api.appointment_routes import router as appointments_router
from app.api.ai_routes import router as ai_router
from app.api.campaign_routes import router as campaigns_router, messages_router
from app.api.clinic_routes import router as clinic_router
from app.api.billing_routes import router as billing_router
from app.api.webhooks import router as webhooks_router
from app.api.analytics_routes import router as analytics_router
from app.api.public_routes import router as public_router
from app.api.medical_records_routes import router as medical_records_router
from app.api.patient_queue_routes import router as patient_queue_router
from app.api.patient_invoice_routes import router as patient_invoice_router, insurance_router
from app.api.doctor_routes import router as doctor_router
from app.api.users_routes import router as users_router
from app.api.audit_routes import router as audit_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # Don't raise, let app start even if DB connection fails, to report errors?
        # No, if DB fails app should probably hard fail. But user sees 500, so app is running.
        raise e
    yield
    print("Shutting down")


app = FastAPI(
    title="CuraWeave API",
    description="AI-Powered Multi-Tenant Care Management & Patient Engagement SaaS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

register_error_handlers(app)

if settings.SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.5,
        profiles_sample_rate=0.2,
    )
    logger.info(f"Sentry initialized for {settings.ENVIRONMENT}")

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(TenantMiddleware)
app.add_middleware(RateLimitMiddleware)

API_PREFIX = "/api/v1"
app.include_router(public_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(patient_auth_router, prefix=API_PREFIX)
auth_routers = [
    (patients_router, "/patients"),
    (appointments_router, "/appointments"),
    (ai_router, "/ai"),
    (campaigns_router, "/campaigns"),
    (messages_router, "/messages"),
    (clinic_router, "/clinic"),
    (billing_router, "/billing"),
    (analytics_router, "/analytics"),
    (medical_records_router, "/medical-records"),
    (patient_queue_router, "/patient-queue"),
    (patient_invoice_router, "/patient-invoices"),
    (insurance_router, "/patient-insurance"),
    (doctor_router, "/doctor"),
    (users_router, "/users"),
    (audit_router, "/audit-logs"),
]
for router, _ in auth_routers:
    app.include_router(router, prefix=API_PREFIX, dependencies=[Depends(require_active_clinic)])

@app.get("/")
async def root():
    return {
        "app": "CuraWeave",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
