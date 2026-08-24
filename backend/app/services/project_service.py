"""
Project service — business logic for project management.

Keeps all database queries and business rules out of route handlers.
All functions are async and accept an AsyncSession.
"""

import math

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, ProjectStatus
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectResponse, ProjectUpdate


# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #

async def _get_project_or_404(project_id: int, db: AsyncSession) -> Project:
    """Fetch a project by ID or raise 404."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )
    return project


# --------------------------------------------------------------------------- #
# CRUD                                                                         #
# --------------------------------------------------------------------------- #

async def create_project(body: ProjectCreate, db: AsyncSession) -> ProjectResponse:
    """Create a new project. Raises 409 if project_key already exists."""
    # Duplicate key check
    exists = await db.execute(
        select(Project).where(Project.project_key == body.project_key)
    )
    if exists.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project key '{body.project_key}' already exists.",
        )

    project = Project(
        project_key=body.project_key,
        name=body.name,
        description=body.description,
        status=body.status,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


async def get_project(project_id: int, db: AsyncSession) -> ProjectResponse:
    """Retrieve a single project by ID."""
    project = await _get_project_or_404(project_id, db)
    return ProjectResponse.model_validate(project)


async def list_projects(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status: ProjectStatus | None = None,
) -> ProjectListResponse:
    """Return paginated list of projects, optionally filtered by status."""
    query = select(Project)
    if status is not None:
        query = query.where(Project.status == status)

    # Total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    # Paginated items
    offset = (page - 1) * page_size
    result = await db.execute(
        query.order_by(Project.created_at.desc()).offset(offset).limit(page_size)
    )
    projects = result.scalars().all()

    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


async def update_project(
    project_id: int, body: ProjectUpdate, db: AsyncSession
) -> ProjectResponse:
    """Partially update a project. ADMIN only."""
    project = await _get_project_or_404(project_id, db)

    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    if body.status is not None:
        project.status = body.status

    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


async def deactivate_project(project_id: int, db: AsyncSession) -> ProjectResponse:
    """Set project status to INACTIVE. ADMIN only."""
    project = await _get_project_or_404(project_id, db)

    if project.status == ProjectStatus.INACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is already inactive.",
        )

    project.status = ProjectStatus.INACTIVE
    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)
