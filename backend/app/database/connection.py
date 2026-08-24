"""
Async SQLAlchemy engine.

Driver: psycopg (psycopg3) — required for Python 3.14 on Windows.
asyncpg has a known incompatibility with Python 3.14's ProactorEventLoop.

Python 3.14 on Windows defaults to ProactorEventLoop, which is
incompatible with psycopg async. We override the event loop policy to
use SelectorEventLoop before the engine is created.

This module is imported at application startup, so the policy is set
before any async operation runs.
"""

import asyncio
import selectors
import sys

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import settings

# --------------------------------------------------------------------------- #
# Force SelectorEventLoop on Windows (Python 3.14 compat)                     #
# ProactorEventLoop (Windows default) is incompatible with psycopg async.     #
# This must run before the engine is constructed AND before any test loop      #
# is started by pytest/TestClient.                                              #
# --------------------------------------------------------------------------- #
if sys.platform == "win32":
    # Set the policy so every new event loop (including TestClient's) uses Selector
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()  # type: ignore[attr-defined]
    )

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,          # Log SQL statements in development
    pool_pre_ping=True,           # Verify connections before use
    pool_size=5,
    max_overflow=10,
)
