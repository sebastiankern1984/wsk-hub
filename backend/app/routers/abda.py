from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.abda import AbdaImportLog, AbdaPacApo, AbdaPriceHistory
from app.models.identity_map import IdentityMap
from app.models.user import User
from app.schemas.abda import (
    AbdaLookupResult,
    AbdaPriceHistoryResponse,
    AbdaStatsResponse,
)
from app.services.product_processing import process_abda_to_product

router = APIRouter(prefix="/abda", tags=["abda"])


@router.get("/lookup", response_model=list[AbdaLookupResult])
async def lookup_abda(
    search: str = Query(..., min_length=1),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Search abda_pac_apo by PZN prefix or name."""
    # Check if search looks like a PZN (numeric)
    if search.isdigit():
        condition = AbdaPacApo.pzn.startswith(search)
    else:
        condition = AbdaPacApo.langname.ilike(f"%{search}%")

    result = await db.execute(
        select(AbdaPacApo).where(condition).limit(limit)
    )
    articles = result.scalars().all()

    # Check which PZNs are already in hub
    pzns = [a.pzn for a in articles]
    hub_pzns: set[str] = set()
    if pzns:
        id_result = await db.execute(
            select(IdentityMap.identity_value).where(
                IdentityMap.identity_type == "PZN",
                IdentityMap.identity_value.in_(pzns),
            )
        )
        hub_pzns = {row[0] for row in id_result.all()}

    return [
        AbdaLookupResult(
            pzn=a.pzn,
            ean=a.gtin,
            name=a.langname,
            manufacturer=a.hersteller_name,
            pack_size=a.packungsgroesse,
            norm_size=a.normgroesse,
            apo_ek=a.apo_ek,
            is_medication=a.arzneimittel,
            pharmacy_required=a.apopflicht,
            market_status=a.verkehrsstatus,
            distribution_status=a.vertriebsstatus,
            already_in_hub=a.pzn in hub_pzns,
        )
        for a in articles
    ]


@router.post("/add-to-hub/{pzn}")
async def add_abda_to_hub(
    pzn: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    """Create a Product from ABDA data."""
    # Check if already in hub
    result = await db.execute(
        select(IdentityMap).where(
            IdentityMap.identity_type == "PZN",
            IdentityMap.identity_value == pzn,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(409, f"PZN {pzn} ist bereits im Hub")

    try:
        product = await process_abda_to_product(db, pzn, user_id=user.username)
        await db.commit()
        return {
            "id": product.id,
            "product_id": product.product_id,
            "pzn": product.pzn,
            "name": product.name,
            "status": product.status,
        }
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/price-history/{pzn}", response_model=list[AbdaPriceHistoryResponse])
async def get_price_history(
    pzn: str,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AbdaPriceHistory)
        .where(AbdaPriceHistory.pzn == pzn)
        .order_by(AbdaPriceHistory.changed_at.desc())
        .limit(limit)
    )
    return [
        {
            "id": h.id,
            "pzn": h.pzn,
            "old_apo_ek": h.old_apo_ek,
            "new_apo_ek": h.new_apo_ek,
            "old_gdat_preise": h.old_gdat_preise,
            "new_gdat_preise": h.new_gdat_preise,
            "change_source": h.change_source,
            "changed_at": h.changed_at.isoformat(),
        }
        for h in result.scalars().all()
    ]


@router.get("/stats", response_model=AbdaStatsResponse)
async def abda_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    # Total articles
    total_result = await db.execute(select(func.count()).select_from(AbdaPacApo))
    total = total_result.scalar() or 0

    # Last import
    last_import = await db.execute(
        select(AbdaImportLog)
        .order_by(AbdaImportLog.created_at.desc())
        .limit(1)
    )
    last = last_import.scalar_one_or_none()

    # Total imports
    import_count = await db.execute(select(func.count()).select_from(AbdaImportLog))

    return AbdaStatsResponse(
        total_articles=total,
        last_import_date=last.completed_at.isoformat() if last and last.completed_at else None,
        last_import_status=last.status if last else None,
        total_imports=import_count.scalar() or 0,
    )
