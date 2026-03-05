from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from app.services.auth_service import authenticate_ldap, create_jwt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    ad_user = authenticate_ldap(credentials.username, credentials.password)
    if not ad_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = await db.execute(select(User).where(User.username == ad_user["username"]))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=ad_user["username"],
            display_name=ad_user["display_name"],
            role="viewer",
        )
        db.add(user)
        await db.flush()

        # First user auto-promoted to admin
        count_result = await db.execute(select(func.count(User.id)))
        if count_result.scalar() == 1:
            user.role = "admin"
            logger.info(f"First user {user.username} auto-promoted to admin")
    else:
        user.display_name = ad_user["display_name"]

    token = create_jwt(user.username, user.role)

    return LoginResponse(
        token=token,
        user=UserInfo(
            username=user.username,
            display_name=user.display_name,
            role=user.role,
        ),
    )


@router.get("/me", response_model=UserInfo)
async def get_me(user: User = Depends(get_current_user)):
    return UserInfo(
        username=user.username,
        display_name=user.display_name,
        role=user.role,
    )
