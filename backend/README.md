# BugTracker — Backend

FastAPI backend for the Intelligent Software Defect Tracking System.

## Version: v0.9.0 (Phase 9 Completed)

BugTracker provides intelligent defect management, role-based workflows, audit logging, real-time notifications via WebSocket, and advanced analytics with CSV reporting.

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
| `GET /`           | `{"message": "BugTracker API is running"}`                |
| `GET /health`     | `{"status": "healthy", "service": "BugTracker API"}`      |
| `GET /docs`       | Swagger UI (OpenAPI v0.9.0)                               |

### 6. Run tests

```powershell
pytest
```

## Analytics & Reporting Endpoints (Phase 9)

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/analytics/overview` | `GET` | `ADMIN` | Global counts for users, projects, issues, and severities. |
| `/analytics/issues/status-distribution` | `GET` | Authenticated (RBAC) | Counts grouped by `IssueStatus` enum with optional `project_id`, `start_date`, `end_date`. |
| `/analytics/issues/severity-distribution` | `GET` | Authenticated (RBAC) | Counts grouped by `Severity` enum with optional `project_id`, `start_date`, `end_date`. |
| `/analytics/issues/trends` | `GET` | Authenticated (RBAC) | Time-series creation/resolution trends. Param `interval`: `day`, `week`, or `month`. |
| `/analytics/projects` | `GET` | Authenticated (RBAC) | Aggregated issue stats and resolution rates across all projects. |
| `/analytics/projects/{project_id}` | `GET` | Authenticated (RBAC) | Issue breakdown and resolution rate for a single project. |
| `/analytics/reports/issues/export` | `GET` | Authenticated (RBAC) | Download RFC 4180 compliant CSV of filtered issues. |
| `/analytics/developers` | `GET` | `ADMIN` | Developer metrics: assignments, resolved counts, resolution rate, and avg resolution time. |

### RBAC Isolation Rules
- **ADMIN**: Access to system-wide overview, developer metrics, and unrestricted issue data across all projects.
- **DEVELOPER**: Scoped strictly to assigned issues (`assignee_id == current_user.id`).
- **TESTER**: Scoped strictly to reported issues (`reporter_id == current_user.id`).

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
| 9     | Advanced Analytics, Reporting & Dashboard             | ✅ Completed  |
| 10    | Frontend Integration (React + Vite Dashboard)         | ⏳ Upcoming   |
