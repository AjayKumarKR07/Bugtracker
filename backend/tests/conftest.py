"""
conftest.py — Phase 4 test fixtures.

Creates verified test users directly in the database (bypassing the
registration/OTP flow) so that all Phase 4 tests work regardless of
prior test runs.

All test emails use the @example.com domain with the p4ci suffix,
distinct from Phase 3 test data.
"""

import asyncio
import selectors
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.main import app
from app.models.user import User, UserRole
from app.utils.security import hash_password


# --------------------------------------------------------------------------- #
# Shared TestClient                                                            #
# --------------------------------------------------------------------------- #
@pytest.fixture(scope="session")
def api_client() -> TestClient:
    return TestClient(app)


# --------------------------------------------------------------------------- #
# Internal async helper                                                        #
# --------------------------------------------------------------------------- #

async def _ensure_verified_user(
    email: str,
    full_name: str,
    role: UserRole,
    password: str = "SecurePass123",
) -> None:
    """Insert a verified+active user if they don't already exist."""
    from app.database.connection import engine
    from sqlalchemy.ext.asyncio import AsyncSession

    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing is None:
            user = User(
                full_name=full_name,
                email=email,
                password_hash=hash_password(password),
                role=role,
                is_active=True,
                is_email_verified=True,
            )
            session.add(user)
            await session.commit()
        elif not existing.is_active or not existing.is_email_verified:
            # Fix existing unverified user
            existing.is_active = True
            existing.is_email_verified = True
            await session.commit()


def _run_sync(coro):
    """Run an async coroutine synchronously using SelectorEventLoop."""
    loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


# --------------------------------------------------------------------------- #
# Session-scoped user setup                                                    #
# --------------------------------------------------------------------------- #

_CI_SUFFIX = "p4ci"
_PASSWORD = "SecurePass123"

_USERS = {
    "admin":   ("admin",   UserRole.ADMIN,     "Admin CI"),
    "dev":     ("dev",     UserRole.DEVELOPER, "Developer CI"),
    "dev2":    ("dev2",    UserRole.DEVELOPER, "Developer2 CI"),
    "tester":  ("tester",  UserRole.TESTER,    "Tester CI"),
    "tester2": ("tester2", UserRole.TESTER,    "Tester2 CI"),
}


def _ci_email(tag: str) -> str:
    return f"{tag}.{_CI_SUFFIX}@example.com"


def _setup_test_users() -> None:
    for tag, (_, role, name) in _USERS.items():
        _run_sync(_ensure_verified_user(
            email=_ci_email(tag),
            full_name=name,
            role=role,
        ))


def _login(client: TestClient, tag: str) -> str:
    r = client.post("/auth/login", json={
        "email": _ci_email(tag),
        "password": _PASSWORD,
    })
    assert r.status_code == 200, f"Login failed for {tag}: {r.status_code} {r.text}"
    return r.json()["access_token"]


# --------------------------------------------------------------------------- #
# Session fixtures (tokens)                                                    #
# --------------------------------------------------------------------------- #

_setup_test_users()  # run at import time so tokens are available throughout
_CLIENT = TestClient(app)

_SESSION_TOKENS: dict[str, str] = {}


def get_token(tag: str) -> str:
    if tag not in _SESSION_TOKENS:
        _SESSION_TOKENS[tag] = _login(_CLIENT, tag)
    return _SESSION_TOKENS[tag]


def admin_token() -> str:
    return get_token("admin")


def dev_token() -> str:
    return get_token("dev")


def dev2_token() -> str:
    return get_token("dev2")


def tester_token() -> str:
    return get_token("tester")


def tester2_token() -> str:
    return get_token("tester2")


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
