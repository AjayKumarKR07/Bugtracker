"""
DefectMind FastAPI application entry point.

Phase 1: Structural foundation only.
- No authentication
- No database models
- No AI features
- No CORS (added when frontend integration begins)
"""

from fastapi import FastAPI
from pydantic import BaseModel

from app.core.config import settings
from app.routes.health import router as health_router


class RootResponse(BaseModel):
    message: str


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Intelligent Software Defect Tracking System with Resolution Assistance. "
        "Built for the Infosys Batch 3 internship project."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    debug=settings.DEBUG,
)

# -----------------------------------------------------------------
# Routers
# -----------------------------------------------------------------
app.include_router(health_router)


# -----------------------------------------------------------------
# Root endpoint
# -----------------------------------------------------------------
@app.get("/", response_model=RootResponse, summary="Root", tags=["Root"])
async def root() -> RootResponse:
    """Confirm the API is reachable."""
    return RootResponse(message="DefectMind API is running")
