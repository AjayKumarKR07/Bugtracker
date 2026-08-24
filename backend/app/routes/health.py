"""
Health check router.

Keeps health-related endpoints separated from main.py.
No business logic lives here.
"""

from fastapi import APIRouter
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    """Return the current health status of the API."""
    return HealthResponse(status="healthy", service="DefectMind API")
