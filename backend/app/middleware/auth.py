from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_jwt

ROLE_LEVEL = {"admin": 4, "manager": 3, "worker": 2, "viewer": 1}


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ", 1)[1]
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.username == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles: str):
    """Factory for role-based access control dependency."""

    async def check_role(user: User = Depends(get_current_user)) -> User:
        min_level = min(ROLE_LEVEL.get(r, 0) for r in roles)
        user_level = ROLE_LEVEL.get(user.role, 0)
        if user_level < min_level:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return check_role
