# 🏥 CuraWeave — Intelligent Clinic Management Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18.3+-61dafb.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg)
![Docker](https://img.shields.io/badge/docker-compose-2496ed.svg)

> **A multi-tenant, AI-orchestrated Clinic Operations Platform.** Leverages **stateful LangGraph agents** to automate patient onboarding, intelligent symptom routing, appointment management, marketing workflows, and subscription billing.

---

## 🌟 Overview

**CuraWeave** is a comprehensive full-stack healthcare platform designed to bridge the gap between patients and clinics. It features a dual-portal architecture (Doctor & Patient) and leverages **Generative AI (Google Gemini + LangGraph)** to perform intelligent symptom triage, automate appointment booking, and manage patient communication.

Built with performance and scalability in mind, CuraWeave uses **FastAPI** for high-concurrency backend operations and **React (Vite)** for a responsive, modern frontend experience.

## ✨ Key Features

### 🤖 AI-Powered Triage & Automation
*   **Intelligent Symptom Checker:** Uses LangChart/LangGraph agents to interview patients about symptoms and recommend urgency levels.
*   **Automated Scheduling:** AI suggests available slots based on doctor availability and triage urgency.
*   **Smart Campaigns:** Run health awareness campaigns (e.g., flu shots) with automated patient targeting via SMS/Email.

### 👨‍⚕️ Clinic Portal (For Doctors/Staff)
*   **Command Center Dashboard:** Real-time overview of appointments, urgent triage cases, and revenue.
*   **Patient CRM:** Detailed records, medical history, and communication logs.
*   **Appointment Management:** Drag-and-drop calendar with status tracking (Confirmed, Pending, Completed).
*   **Billing & Invoicing:** Integrated Stripe payments and invoice generation.

### 👤 Patient Portal
*   **Self-Service Booking:** Book appointments online 24/7.
*   **Secure Messaging:** HIPAA-compliant chat with the clinic.
*   **Medical Records:** Access prescriptions and visit summaries.
*   **Mobile-First Design:** Fully responsive interface for access on any device.

---

## 🏗️ Tech Stack

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">

<div style="padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">

### 🎨 Frontend Layer

**Core Framework**
- React 18.3.1 — Component-based UI
- TypeScript 5.2.2 — Type-safe development
- Vite 7.3.1 — Lightning-fast build tool

**Navigation & Routing**
- React Router DOM 6.24.0 — Client-side routing

**Styling & Design**
- Tailwind CSS 3.4.4 — Utility-first styling
- PostCSS 8.4.38 — CSS transformation
- Lucide React 0.400.0 — Beautiful icons

**State & Data**
- Zustand 4.5.2 — Lightweight state management
- Axios 1.7.2 — Promise-based HTTP client
- Recharts 2.12.7 — Data visualization library
- date-fns 3.6.0 — Modern date utilities

**UX Enhancements**
- React Hot Toast 2.4.1 — Toast notifications

</div>

<div style="padding: 2rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; color: white;">

### ⚡ Backend Architecture

**Foundation**
- FastAPI 0.111.0+ — Modern, fast web framework
- Python 3.11+ — High-performance runtime
- Uvicorn 0.29.0 — ASGI server
- Gunicorn 21.2.0 — Production-grade server

**Database Layer**
- PostgreSQL 16 — Enterprise-grade database
- SQLAlchemy 2.0.30+ — SQL toolkit & ORM
- asyncpg 0.29.0 — Async PostgreSQL driver
- Alembic 1.13.1 — Database migrations

**Validation & Security**
- Pydantic 2.7.4 — Data validation
- python-jose 3.3.0 — JWT tokens
- bcrypt 4.0.1 — Password encryption
- passlib 1.7.4 — Hashing framework

**Async & Background Tasks**
- Celery 5.4.0 — Distributed task queue
- Redis 5.0.4 — Cache & message broker
- APScheduler 3.10.4 — Job scheduling

**AI & Intelligence**
- LangGraph 0.1.5 + LangChain 0.2.5 — AI workflows
- google-genai 1.0.0 — Google Gemini integration

**Integrations**
- Stripe 9.6.0 — Payment processing
- Twilio 9.1.1 — SMS & WhatsApp
- httpx 0.27.0 — Async HTTP client

</div>

<div style="padding: 2rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; color: white;">

### 🗄️ Infrastructure & Data

**Database Systems**
- PostgreSQL 16 — Primary data store
  - asyncpg 0.29.0 — Async operations
  - psycopg2-binary 2.9.9 — Sync operations

**Caching & Queuing**
- Redis 7 — In-memory data store
  - Celery Broker — Task queuing
  - Session Store — User sessions
  - Cache Layer — Performance optimization

**External APIs**
- Google Gemini 2.5 Flash — AI/LLM
- Stripe Connect — Payment gateway
- Twilio API — Communications
- Supabase — Cloud database & storage

**Containerization**
- Docker — Container runtime
- Docker Compose v3.9 — Orchestration
- Alpine Linux — Minimal base images
- Nginx — Reverse proxy & static serving

**API Documentation**
- OpenAPI 3.0 — API specification
- Swagger UI — Interactive documentation

</div>

<div style="padding: 2rem; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); border-radius: 12px; color: white;">

### 🚀 DevOps & Development

**Version Control & Collaboration**
- Git — Distributed version control
- GitHub — Repository hosting & CI/CD

**Package Management**
- npm — Frontend dependencies
- pip — Python package manager
- pyproject.toml — Python project config
- setuptools — Python build system

**Build & Compilation**
- TypeScript Compiler — Type checking
- Vite Build System — Frontend bundling
- npm scripts — Task automation

**Environment & Configuration**
- dotenv (.env files) — Configuration management
- .env.example — Documentation template

**Process Management**
- Celery Worker — Background task execution
- Celery Beat — Scheduled task runner
- Uvicorn — ASGI development server

**CI/CD Pipeline**
- GitHub Actions — Workflow automation
- Docker Build — Container building
- Automated Testing — Quality assurance

**Code Quality**
- Autoprefixer — CSS vendor prefixes
- PostCSS — CSS processing pipeline
- Hot Module Replacement (HMR) — Fast development

</div>

</div>

---

## 🚀 Getting Started

### Prerequisites
*   Docker & Docker Compose
*   Node.js 18+ (for local dev)
*   Python 3.11+ (for local dev)

### 🐳 Quick Start (Docker)

The easiest way to run the full stack (Frontend + Backend + DB + Redis + Worker).

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ykjaat6104/CuraWeave.git
    cd CuraWeave
    ```

2.  **Configure Environment:**
    Create a `.env` file in the `backend` directory.
    ```bash
    cp backend/.env.example backend/.env
    ```
    *Update `GEMINI_API_KEY` in `backend/.env` with your Google AI Studio key.*

3.  **Launch Services:**
    ```bash
    docker-compose up -d --build
    ```

4.  **Access the App:**
    *   **Frontend:** [http://localhost:3000](http://localhost:3000)
    *   **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Default Login Credentials (Seeded)
*   **Doctor Portal:** `admin@curaweave.com` / `password123`
*   **Patient Portal:** Register a new account.

---

## 📂 Project Structure

```bash
CuraWeave/
├── backend/                 # FastAPI Application
│   ├── app/
│   │   ├── ai/              # AI Agents & LangGraph workflows
│   │   ├── api/             # API Routes (v1)
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── schemas/         # Pydantic Schemas
│   │   ├── services/        # Business Logic Layer
│   │   └── workers/         # Celery Tasks
│   ├── main.py              # Entry point
│   └── Dockerfile
├── frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Reusable UI Components
│   │   ├── pages/           # Page Views (Doctor & Patient)
│   │   ├── services/        # API Client (Axios)
│   │   └── store/           # Global State (Zustand)
│   └── Dockerfile
└── docker-compose.yml       # Orchestration
```

---

## 📸 Screen Previews

| Doctor Dashboard | Patient Portal |
|:---:|:---:|
| *Manage appointments & analytics* | *Book visits & view history* |
| ![Dashboard Mockup](https://via.placeholder.com/600x300?text=Doctor+Dashboard) | ![Patient Mockup](https://via.placeholder.com/600x300?text=Patient+Portal) |

*(Note: Replace placeholders with actual screenshots after deployment)*

---

## 🤝 Contributing

Contributions are welcome!
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
