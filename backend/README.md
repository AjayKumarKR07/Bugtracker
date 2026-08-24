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

| Phase | Scope                               |
|-------|-------------------------------------|
| 1     | ✅ Foundation (current)              |
| 2     | Database models & migrations        |
| 3     | Authentication (JWT + OTP)          |
| 4     | Role-based API endpoints            |
| 5     | AI-assisted resolution features     |
| 6     | Frontend integration (React + Vite) |
