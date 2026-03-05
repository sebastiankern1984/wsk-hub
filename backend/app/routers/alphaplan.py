from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.alphaplan_client import AlphaplanClient
from app.services.settings_service import get_setting

router = APIRouter(prefix="/alphaplan", tags=["alphaplan"])


@router.get("/status")
async def alphaplan_status(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    enabled = await get_setting(db, "alphaplan_rest_enabled")
    if enabled != "true":
        return {"status": "disabled", "message": "Alphaplan ist deaktiviert"}

    try:
        client = await AlphaplanClient.from_settings(db)
        return await client.check_connection()
    except ValueError as e:
        return {"status": "not_configured", "message": str(e)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/stock/{artikel_nr}")
async def get_stock(
    artikel_nr: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    enabled = await get_setting(db, "alphaplan_rest_enabled")
    if enabled != "true":
        return {"error": "Alphaplan ist deaktiviert"}

    try:
        client = await AlphaplanClient.from_settings(db)
        return await client.get_stock(artikel_nr)
    except ValueError as e:
        return {"error": str(e)}
