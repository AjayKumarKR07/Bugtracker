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

## Roadmap
- [x] Phase 7: Issue comments and file attachments
- [x] Phase 8: Real-time notifications and WebSocket
- [x] Phase 9: Advanced analytics and reporting
- [ ] Phase 10: Frontend Integration & Dashboard UI
