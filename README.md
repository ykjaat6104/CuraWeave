# 🏥 CuraWeave — AI-Powered Care Management Platform

> Production-grade clinic operations platform powered by **Google Gemini + LangGraph + FastAPI + React**

---

## 🚀 Quick Start (Production / Docker)

```bash
# 1. Clone & enter directory
cd curaweave

# 2. Create .env and add your Gemini API key (Required)
cp backend/.env.example .env
# Edit .env → set GEMINI_API_KEY=your-key-here

# 3. Start everything with Docker Compose
docker compose up -d --build
```

- **Frontend:** http://localhost:3000 (Uses Nginx in production build)
- **Backend API:** http://localhost:8000 (FastAPI)
- **API Docs:** http://localhost:8000/docs

---

## 🛠️ Manual Setup (Local Dev)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure env
cp .env.example .env
# Add your GEMINI_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

### Services (optional for full features)
```bash
# Redis (for Celery)
docker run -d -p 6379:6379 redis:alpine

# Celery Worker (reminders & campaigns)
celery -A app.tasks.celery_tasks.celery_app worker --loglevel=info

# Celery Beat (scheduler)
celery -A app.tasks.celery_tasks.celery_app beat --loglevel=info
```

---

## 🧠 Architecture

```
React Frontend (TypeScript + Tailwind)
       ↕ REST API
FastAPI Backend (Async Python)
       ↕
  ┌────────────────────────────────────┐
  │ PostgreSQL │ LangGraph AI │ Celery │
  │ (Multi-tenant) │ (Gemini) │ + Redis│
  └────────────────────────────────────┘
       ↕              ↕
  Twilio WhatsApp   Stripe Billing
```

---

## 📦 Core Modules

| Module | Description |
|--------|-------------|
| **Patient Management** | Full CRUD, search, tags, WhatsApp welcome |
| **Appointment System** | Schedule, confirm, complete, no-show tracking |
| **AI Symptom Triage** | LangGraph pipeline: extract → score → route |
| **Conversational AI** | Intent classification + contextual responses |
| **Campaign Engine** | AI-personalized bulk messaging via WhatsApp |
| **Auto Reminders** | 24h appointment reminders via Celery |
| **Follow-ups** | Post-appointment patient engagement |
| **Analytics Dashboard** | Charts, trends, urgency distribution |
| **Stripe Billing** | Free/Basic/Pro/Enterprise subscription tiers |
| **Multi-tenant** | Complete clinic data isolation via `clinic_id` |

---

## 🤖 LangGraph AI Pipeline

### Triage Flow
```
Patient Message
    → Node 1: extract_symptoms (Gemini)
    → Node 2: assess_urgency (low/medium/high/critical)
    → Node 3: generate_recommendation + routing action
    → Save to DB + Return response
```

### Conversation Flow
```
Patient Message
    → Node 1: classify_intent (book/reschedule/cancel/faq/triage)
    → Node 2: generate_response (context-aware)
    → Save conversation history
```

---

## 🔑 Environment Variables

```env
# Required
GEMINI_API_KEY=your-gemini-api-key

# Database
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://localhost:6379/0

# Optional (for full features)
TWILIO_ACCOUNT_SID=...       # WhatsApp messaging
TWILIO_AUTH_TOKEN=...
STRIPE_SECRET_KEY=...         # Billing
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register clinic |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/patients` | List patients |
| POST | `/api/v1/patients` | Add patient |
| GET | `/api/v1/appointments` | List appointments |
| POST | `/api/v1/ai/triage` | **AI symptom triage** |
| POST | `/api/v1/ai/chat` | **AI conversation** |
| POST | `/api/v1/campaigns/{id}/launch` | Launch campaign |
| GET | `/api/v1/analytics/dashboard` | Dashboard stats |
| POST | `/api/v1/billing/create-checkout-session` | Stripe checkout |
| POST | `/api/v1/webhooks/twilio/whatsapp` | Receive WhatsApp |

Full docs: `http://localhost:8000/docs`

---

## 💳 Subscription Plans

| Plan | Price | Patients | Messages | AI Triage |
|------|-------|---------|---------|-----------|
| Free | $0 | 50 | 100/mo | ❌ |
| Basic | $49/mo | 500 | 2,000/mo | ✅ |
| Pro | $149/mo | 5,000 | 20,000/mo | ✅ |
| Enterprise | $499/mo | Unlimited | Unlimited | ✅ |

---

## 🔐 Security

- JWT Bearer token authentication
- Role-based access control (owner/admin/staff/receptionist)
- Multi-tenant data isolation (clinic_id on every query)
- Password hashing with bcrypt
- HTTPS enforced in production
- Stripe webhook signature verification

---

## 🚢 Production Deployment

```bash
# Frontend → Vercel
cd frontend && vercel deploy

# Backend → Railway / Render / DigitalOcean
# Set all environment variables in your hosting platform

# Database → Supabase / Railway PostgreSQL
# Redis → Upstash / Railway Redis
```

---

## 🏆 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, Zustand |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2 |
| AI Engine | LangGraph, Google Gemini 1.5 Flash |
| Database | PostgreSQL (multi-tenant) |
| Queue | Celery + Redis |
| Messaging | Twilio WhatsApp API |
| Billing | Stripe Subscriptions |
| DevOps | Docker Compose, Nginx |

---

Built with ❤️ — Startup-level AI SaaS Architecture
