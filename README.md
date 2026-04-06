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

<table>
    <tr>
        <td width="50%" valign="top">

### Frontend

**Core Framework**
- React 18.3.1
- TypeScript 5.2.2
- Vite 7.3.1

**Navigation & Routing**
- React Router DOM 6.24.0

**Styling & UI**
- Tailwind CSS 3.4.4
- PostCSS 8.4.38
- Autoprefixer 10.4.19
- Lucide React 0.400.0

**State & Data**
- Zustand 4.5.2
- Axios 1.7.2
- Recharts 2.12.7
- date-fns 3.6.0

**UX**
- React Hot Toast 2.4.1

        </td>
        <td width="50%" valign="top">

### Backend

**Core Framework**
- FastAPI 0.111.0+
- Python 3.11+
- Uvicorn 0.29.0
- Gunicorn 21.2.0

**Database & ORM**
- PostgreSQL 16
- SQLAlchemy 2.0.30+
- asyncpg 0.29.0
- psycopg2-binary 2.9.9
- Alembic 1.13.1

**Validation & Security**
- Pydantic 2.7.4
- Pydantic Settings 2.2.1
- python-jose 3.3.0
- bcrypt 4.0.1
- passlib 1.7.4

**Task Queue & Scheduling**
- Celery 5.4.0
- Redis 5.0.4
- APScheduler 3.10.4

**AI & Integrations**
- LangGraph 0.1.5
- LangChain 0.2.5
- langchain-core 0.2.9
- langchain-google-genai 1.0.5
- google-genai 1.0.0
- Stripe 9.6.0
- Twilio 9.1.1
- httpx 0.27.0

        </td>
    </tr>
    <tr>
        <td width="50%" valign="top">

### Infrastructure

**Databases & Storage**
- PostgreSQL 16
- Supabase PostgreSQL
- Supabase Storage

**Caching & Messaging**
- Redis 7
- Celery Broker
- Session Store

**External Services**
- Google Gemini 2.5 Flash
- Stripe Connect
- Twilio API

**Containerization**
- Docker
- Docker Compose v3.9
- Alpine Linux
- Nginx

**Documentation**
- OpenAPI 3.0
- Swagger UI

        </td>
        <td width="50%" valign="top">

### DevOps

**Version Control**
- Git
- GitHub

**Package Management**
- npm
- pip
- pyproject.toml
- setuptools

**Build & Compilation**
- TypeScript Compiler
- Vite Build System
- npm scripts

**Environment Management**
- dotenv (.env)
- .env.example

**Process Management**
- Celery Worker
- Celery Beat
- Uvicorn

**CI/CD & Quality**
- GitHub Actions
- Docker Build
- Autoprefixer
- PostCSS

        </td>
    </tr>
</table>

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
