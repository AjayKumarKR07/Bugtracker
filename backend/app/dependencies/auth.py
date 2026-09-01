"""
Authentication and authorization FastAPI dependencies.

get_current_user  — extract and validate JWT from Authorization header,
                    return the active User ORM object.
require_role      — factory that returns a dependency enforcing one or
                    more allowed UserRole values.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import User, UserRole
from app.utils.security import decode_access_token

# HTTPBearer extracts the raw token from "Authorization: Bearer <token>"
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_bearer_scheme),
    ],
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency — return the authenticated active User.

    Flow:
      1. Extract Bearer token from Authorization header.
      2. Decode and validate JWT signature + expiry.
      3. Query the database for the user referenced in the token.
      4. Verify the user account is active.

    Raises:
      HTTP 401 — missing/invalid/expired token, unknown user.
      HTTP 403 — user exists but is_active is False.
    """
    _401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise _401

    payload = decode_access_token(credentials.credentials)  # raises 401 on bad token

    user_id_str: str | None = payload.get("sub")
    if not user_id_str or not user_id_str.isdigit():
        raise _401

    user_id = int(user_id_str)
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        print(f"[DEBUG RBAC] get_current_user: User {user_id} not found in DB")
        raise _401

    if not user.is_active:
        print(f"[DEBUG RBAC] get_current_user: User {user.id} ({user.email}) is NOT active!")
        with open("rbac_debug.log", "a") as f:
            f.write(f"403 INACTIVE: user_id={user.id} email={user.email}\n")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    return user


def require_role(*roles: UserRole):
    """Return a FastAPI dependency that restricts access to *roles*.

    Usage:
        @router.get("/admin-only")
        async def admin_route(
            user: User = Depends(require_role(UserRole.ADMIN)),
        ): ...
    """
    async def _check_role(
        current_user: User = Depends(get_current_user),
    ) -> User:
        print(f"[DEBUG RBAC] User ID: {current_user.id}, DB Role: {repr(current_user.role)}, Required: {roles}")
        if current_user.role not in roles:
            print(f"[DEBUG RBAC] FAILED! {current_user.role} not in {roles}")
            with open("rbac_debug.log", "a") as f:
                f.write(f"403 ROLE MISMATCH: user_id={current_user.id} email={current_user.email} db_role={current_user.role} required={roles}\n")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return _check_role
