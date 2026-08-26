# DefectMind — Backend

FastAPI backend for the Intelligent Software Defect Tracking System.

## Phase 1: Foundation

This phase establishes the project structure, configuration, and health check endpoints.

No database models, authentication, or AI features are implemented yet.

## Quick Start

### 1. Create and activate the virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in values as needed:

```powershell
Copy-Item ..\.env.example .env
```

### 4. Run the development server

```powershell
uvicorn app.main:app --reload --port 8000
```

### 5. Verify endpoints

| Endpoint          | Expected response                                         |
|-------------------|-----------------------------------------------------------|
| `GET /`           | `{"message": "DefectMind API is running"}`                |
| `GET /health`     | `{"status": "healthy", "service": "DefectMind API"}`      |
| `GET /docs`       | Swagger UI                                                |

### 6. Run tests

```powershell
pytest
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Centralised settings (pydantic-settings)
│   ├── routes/
│   │   ├── __init__.py
│   │   └── health.py        # Health check router
│   ├── services/            # Business logic (future phases)
│   ├── models/              # SQLAlchemy models (future phases)
│   ├── schemas/             # Pydantic schemas (future phases)
│   ├── database/            # DB session / engine (future phases)
│   └── utils/               # Shared utilities (future phases)
├── tests/
│   ├── __init__.py
│   └── test_health.py
├── .venv/                   # Local virtual environment (git-ignored)
├── .env                     # Local environment variables (git-ignored)
├── requirements.txt
└── README.md
```

## Phases

| Phase | Scope                                                 | Status       |
|-------|-------------------------------------------------------|--------------|
| 1     | Foundation & Configuration                            | ✅ Completed  |
| 2     | PostgreSQL Database Models & Alembic Migrations       | ✅ Completed  |
| 3     | Authentication (JWT + Email OTP + RBAC)               | ✅ Completed  |
| 4     | Defect & Project Management APIs                      | ✅ Completed  |
| 5     | Audit Logging & Activity Tracking                     | ✅ Completed  |
| 6     | Admin User Management & Dashboard Analytics           | ✅ Completed  |
| 7     | Issue Comments & File Attachments                     | ✅ Completed  |
| 8     | Real-Time Notifications & WebSocket Stream            | ✅ Completed  |
| 9     | AI-Assisted Defect Resolution (Gemini Integration)    | ⏳ Upcoming   |
| 10    | Frontend Integration (React + Vite Dashboard)         | ⏳ Upcoming   |
