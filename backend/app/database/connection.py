"""
Async SQLAlchemy engine.

Driver: psycopg (psycopg3) — required for Python 3.14 on Windows.
asyncpg has a known incompatibility with Python 3.14's ProactorEventLoop.

The engine is created once for the entire application lifetime.
"""

import asyncio
import selectors
import sys

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import settings

# Python 3.14 on Windows defaults to ProactorEventLoop, which is
# incompatible with psycopg async. Switch to SelectorEventLoop.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.DefaultEventLoopPolicy()
    )
    # Override the loop factory to use SelectorEventLoop
    _selector_loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
    asyncio.set_event_loop(_selector_loop)

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,          # Log SQL statements in development
    pool_pre_ping=True,           # Verify connections before use
    pool_size=5,
    max_overflow=10,
)
