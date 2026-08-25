"""
DefectMind FastAPI application entry point.

Phase 1: Structural foundation
Phase 2: PostgreSQL + SQLAlchemy
Phase 3: Authentication + OTP + JWT + RBAC
Phase 4: Defect Management APIs (Projects + Issues)
Phase 5: Audit Logs & Activity Tracking
"""

from fastapi import FastAPI
from pydantic import BaseModel

from app.core.config import settings
from app.routes.audit import router as audit_router
from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.issues import router as issues_router
from app.routes.projects import router as projects_router


class RootResponse(BaseModel):
    message: str


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Intelligent Software Defect Tracking System with Resolution Assistance. "
        "Built for the Infosys Batch 3 internship project."
    ),
    version="0.5.0",
    docs_url="/docs",
    redoc_url="/redoc",
    debug=settings.DEBUG,
)

# -----------------------------------------------------------------
# Routers
# -----------------------------------------------------------------
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(issues_router)
app.include_router(audit_router)


# -----------------------------------------------------------------
# Root endpoint
# -----------------------------------------------------------------
@app.get("/", response_model=RootResponse, summary="Root", tags=["Root"])
async def root() -> RootResponse:
    """Confirm the API is reachable."""
    return RootResponse(message="DefectMind API is running")
