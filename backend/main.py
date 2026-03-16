from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.database import init_db
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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(patient_auth_router, prefix=API_PREFIX)
app.include_router(patients_router, prefix=API_PREFIX)
app.include_router(appointments_router, prefix=API_PREFIX)
app.include_router(ai_router, prefix=API_PREFIX)
app.include_router(campaigns_router, prefix=API_PREFIX)
app.include_router(messages_router, prefix=API_PREFIX)
app.include_router(clinic_router, prefix=API_PREFIX)
app.include_router(billing_router, prefix=API_PREFIX)
app.include_router(webhooks_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)

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
