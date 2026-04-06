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
<td width="50%">

### Frontend

**Core Framework**
* React 18.3.1
* TypeScript 5.2.2
* Vite 7.3.1 (Build Tool)

**Routing & Navigation**
* React Router DOM 6.24.0

**Styling & UI**
* Tailwind CSS 3.4.4
* PostCSS 8.4.38
* Autoprefixer 10.4.19
* Lucide React 0.400.0 (Icons)

**State Management**
* Zustand 4.5.2

**HTTP & APIs**
* Axios 1.7.2
* React Hot Toast 2.4.1 (Notifications)

**Data & Utilities**
* Recharts 2.12.7 (Data Visualization)
* date-fns 3.6.0 (Date Manipulation)

**Dev Dependencies**
* @vitejs/plugin-react 4.3.1
* @types/react 18.3.3
* @types/react-dom 18.3.0

</td>
<td width="50%">

### Backend

**Core Framework**
* FastAPI 0.111.0+
* Python 3.11+
* Uvicorn 0.29.0 (ASGI Server)
* Gunicorn 21.2.0 (Production Server)

**Database & ORM**
* SQLAlchemy 2.0.30+
* PostgreSQL 16 (Database)
* asyncpg 0.29.0 (Async Driver)
* psycopg2-binary 2.9.9 (Sync Driver)
* Alembic 1.13.1 (Migrations)

**Validation & Schemas**
* Pydantic 2.7.4
* Pydantic Settings 2.2.1

**Authentication & Security**
* python-jose 3.3.0 (JWT)
* passlib 1.7.4 (Password Hashing)
* bcrypt 4.0.1 (Encryption)
* python-multipart (Form Data)

**Task Queue & Scheduling**
* Celery 5.4.0 (Background Tasks)
* Redis 5.0.4 (Broker/Cache)
* APScheduler 3.10.4 (Job Scheduling)

**AI & ML**
* LangGraph 0.1.5
* LangChain 0.2.5
* langchain-core 0.2.9
* langchain-google-genai 1.0.5
* google-genai 1.0.0 (Google Gemini)

**Integrations**
* Stripe 9.6.0 (Payments)
* Twilio 9.1.1 (SMS/WhatsApp)
* httpx 0.27.0 (HTTP Client)

**Utilities**
* python-dotenv 1.0.1 (Environment Variables)

</td>
</tr>
<tr>
<td width="50%">

### Infrastructure & Data

**Databases**
* PostgreSQL 16 (Primary Database)
  * Async: asyncpg 0.29.0
  * Sync: psycopg2-binary 2.9.9

**Caching & Messaging**
* Redis 7 (Cache, Session Store, Celery Broker)

**APIs & External Services**
* Stripe Connect (Payment Processing)
* Twilio API (SMS, WhatsApp Messaging)
* Google Gemini 2.5 Flash (LLM)
* OpenAPI/Swagger (API Documentation)

**File & Data Storage**
* Supabase PostgreSQL
* Supabase Storage (Cloud Files)

**Containerization**
* Docker (Container Runtime)
* Docker Compose (Container Orchestration)
* Alpine Linux (Minimal Base Images)

**Web Server**
* Nginx (Reverse Proxy, Static Serving)

</td>
<td width="50%">

### DevOps & Development Tools

**Version Control**
* Git
* GitHub (Repository Hosting)

**Containerization & Deployment**
* Docker & Docker Compose (v3.9)
* Dockerfile (Backend, Frontend)
* docker-compose.yml (Multi-service Orchestration)

**Package Management**
* npm (Frontend Dependencies)
* pip (Python Package Manager)
* pyproject.toml (Python Packaging Configuration)
* setuptools (Python Build System)

**Environment Management**
* .env & .env.example (Configuration)
* dotenv (Environment Variable Loading)

**Build & Compilation**
* TypeScript Compiler (tsc)
* Vite Build System
* npm build scripts

**API Documentation**
* OpenAPI 3.0 (FastAPI Auto-generated)
* Swagger UI (Interactive API Docs)

**Code Quality & Development**
* Autoprefixer (CSS Vendor Prefixes)
* PostCSS (CSS Processing)
* Hot Module Replacement (HMR)

**CI/CD (Ready)**
* GitHub Actions (Workflow Automation)

**Process Management**
* Celery Worker (Background Task Processing)
* Celery Beat (Scheduled Task Execution)
* Uvicorn (Development Server)

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
