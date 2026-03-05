from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_role
from app.models.user import User
from app.schemas.settings import SettingResponse, SettingUpdate
from app.services.settings_service import get_all_settings, set_setting

router = APIRouter(prefix="/settings", tags=["settings"])


def _to_response(s) -> dict:
    return {
        "key": s.key,
        "value": "***" if s.is_secret and s.value else s.value,
        "description": s.description,
        "is_secret": s.is_secret,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


@router.get("", response_model=list[SettingResponse])
async def list_settings(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    settings = await get_all_settings(db)
    return [_to_response(s) for s in settings]


@router.put("/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    data: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    setting = await set_setting(db, key, data.value)
    await db.commit()
    await db.refresh(setting)
    return _to_response(setting)
