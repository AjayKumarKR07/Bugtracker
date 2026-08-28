# BugTracker
BugTracker is a full-stack intelligent defect tracking and management platform built with React, FastAPI, PostgreSQL, JWT authentication, and role-based access control.

## Latest Update
- Phase 9 completed: Advanced Analytics, Reporting & Dashboard.
- BugTracker API version: v0.9.0.

## Analytics & Reporting Features (Phase 9)
- **System Overview**: High-level platform statistics for users, projects, issues, and severity metrics (Admin only).
- **Status Distribution**: Real-time issue status distribution with project and date range filters (RBAC enforced).
- **Severity Distribution**: Real-time issue severity breakdown with project and date range filters (RBAC enforced).
- **Issue Trends**: Time-series defect creation and resolution trends grouped by `day`, `week`, or `month`.
- **Project Analytics**: Per-project defect metrics, open/in-progress counts, and resolution rate calculations.
- **Developer Performance**: Workload metrics, resolution counts, resolution rate, and average resolution time in hours (Admin only).
- **CSV Reporting**: RFC 4180 compliant filtered defect data export with custom headers and proper CSV escaping.
- **Admin Dashboard Enhancement**: Live metrics for notifications (total, unread) and system content (comments, attachments).

## Frontend Application (Phase 10)
- **Tech Stack**: React 19, TypeScript, Vite, React Router v7, Axios, Lucide React.
- **Authentication**: JWT auth, OTP email verification flow, session restoration (`/auth/me`), protected routes.
- **Role-Based Access Control (RBAC)**: Dedicated UI views and permissions for `ADMIN`, `DEVELOPER`, and `TESTER`.
- **Defect Lifecycle Management**: Full defect reporting, assignments, status transitions, resolution summaries, comments, and file attachments.
- **Real-Time Notifications**: Resilient WebSocket stream (`/ws/notifications?token=<JWT>`) with live badges and toast alerts.
- **Analytics & Reporting**: Live metrics, status and severity distributions, creation vs resolution trends, and CSV report export.
- **Admin Management**: Live dashboard stats, user directory, role provisioning, and account activations.

## Quick Start

### 1. Backend Startup
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
API docs available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Startup
```powershell
cd frontend
npm install
npm run dev
```
Frontend application available at: `http://localhost:5173`

## Roadmap
- [x] Phase 7: Issue comments and file attachments
- [x] Phase 8: Real-time notifications and WebSocket
- [x] Phase 9: Advanced analytics and reporting
- [x] Phase 10: Frontend Integration & Dashboard UI
