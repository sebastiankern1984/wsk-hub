from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.manufacturer import Manufacturer
from app.models.user import User
from app.schemas.manufacturer import ManufacturerCreate, ManufacturerResponse

router = APIRouter(prefix="/manufacturers", tags=["manufacturers"])


def _to_response(m: Manufacturer) -> dict:
    return {
        "id": m.id,
        "name": m.name,
        "country": m.country,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.get("", response_model=list[ManufacturerResponse])
async def list_manufacturers(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Manufacturer).order_by(Manufacturer.name))
    return [_to_response(m) for m in result.scalars().all()]


@router.post("", response_model=ManufacturerResponse, status_code=201)
async def create_manufacturer(
    data: ManufacturerCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    existing = await db.execute(select(Manufacturer).where(Manufacturer.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Hersteller '{data.name}' existiert bereits")

    mfr = Manufacturer(name=data.name, country=data.country)
    db.add(mfr)
    await db.commit()
    await db.refresh(mfr)
    return _to_response(mfr)


@router.get("/{manufacturer_id}", response_model=ManufacturerResponse)
async def get_manufacturer(
    manufacturer_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    mfr = await db.get(Manufacturer, manufacturer_id)
    if not mfr:
        raise HTTPException(404, "Hersteller nicht gefunden")
    return _to_response(mfr)
