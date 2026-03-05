from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Float, cast, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.abda import AbdaImportLog, AbdaPacApo, AbdaPriceHistory
from app.models.identity_map import IdentityMap
from app.models.user import User
from app.schemas.abda import (
    AbdaLookupResponse,
    AbdaLookupResult,
    AbdaPriceHistoryResponse,
    AbdaStatsResponse,
)
from app.services.product_processing import process_abda_to_product

router = APIRouter(prefix="/abda", tags=["abda"])

_OPERATOR_RE = re.compile(r"^(>=|<=|!=|>|<|=)(.+)$")


def _parse_operator(value: str) -> tuple[str, str]:
    """Parse operator prefix from filter value. Returns (operator, raw_value)."""
    m = _OPERATOR_RE.match(value.strip())
    if m:
        return m.group(1), m.group(2).strip()
    return "default", value.strip()


@router.get("/lookup", response_model=AbdaLookupResponse)
async def lookup_abda(
    # Legacy single-search param (backward compat)
    search: str | None = Query(None),
    # Per-field filters
    filter_pzn: str | None = Query(None),
    filter_ean: str | None = Query(None),
    filter_name: str | None = Query(None),
    filter_manufacturer: str | None = Query(None),
    filter_apo_ek: str | None = Query(None),
    filter_norm_size: str | None = Query(None),
    # Controls
    exclude_medication: bool = Query(False),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Search abda_pac_apo with per-field filters and operator support."""
    conditions = []

    # Check if any per-field filter is set
    has_field_filters = any([
        filter_pzn, filter_ean, filter_name,
        filter_manufacturer, filter_apo_ek, filter_norm_size,
    ])

    if has_field_filters:
        # Per-field filters
        if filter_pzn:
            conditions.append(AbdaPacApo.pzn.startswith(filter_pzn))
        if filter_ean:
            conditions.append(AbdaPacApo.gtin.startswith(filter_ean))
        if filter_name:
            conditions.append(AbdaPacApo.langname.ilike(f"%{filter_name}%"))
        if filter_manufacturer:
            conditions.append(AbdaPacApo.hersteller_name.ilike(f"%{filter_manufacturer}%"))
        if filter_norm_size:
            conditions.append(AbdaPacApo.normgroesse.ilike(f"%{filter_norm_size}%"))
        if filter_apo_ek:
            op, val = _parse_operator(filter_apo_ek)
            try:
                numeric_val = float(val.replace(",", "."))
            except ValueError:
                pass  # ignore invalid numeric input
            else:
                # Only consider rows where apo_ek is a valid number
                conditions.append(AbdaPacApo.apo_ek.isnot(None))
                conditions.append(text("apo_ek ~ '^[0-9]+(\\.[0-9]+)?$'"))
                apo_ek_num = cast(AbdaPacApo.apo_ek, Float)
                if op == ">":
                    conditions.append(apo_ek_num > numeric_val)
                elif op == "<":
                    conditions.append(apo_ek_num < numeric_val)
                elif op == ">=":
                    conditions.append(apo_ek_num >= numeric_val)
                elif op == "<=":
                    conditions.append(apo_ek_num <= numeric_val)
                elif op == "!=":
                    conditions.append(apo_ek_num != numeric_val)
                elif op == "=":
                    conditions.append(apo_ek_num == numeric_val)
                else:
                    # default: exact match
                    conditions.append(apo_ek_num == numeric_val)

    elif search:
        # Legacy single-search fallback
        if search.isdigit():
            conditions.append(AbdaPacApo.pzn.startswith(search))
        else:
            conditions.append(AbdaPacApo.langname.ilike(f"%{search}%"))
    else:
        # No filters at all — return empty
        return AbdaLookupResponse(items=[], total=0, limit=limit, offset=offset)

    # Exclude medication
    if exclude_medication:
        conditions.append(
            or_(AbdaPacApo.arzneimittel.is_(None), AbdaPacApo.arzneimittel != "J")
        )

    # Count total
    count_query = select(func.count()).select_from(AbdaPacApo).where(*conditions)
    total = (await db.execute(count_query)).scalar() or 0

    # Fetch page
    query = (
        select(AbdaPacApo)
        .where(*conditions)
        .order_by(AbdaPacApo.langname)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
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

    items = [
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

    return AbdaLookupResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("/add-to-hub/{pzn}")
async def add_abda_to_hub(
    pzn: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    """Create a Product from ABDA data."""
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
    total_result = await db.execute(select(func.count()).select_from(AbdaPacApo))
    total = total_result.scalar() or 0

    last_import = await db.execute(
        select(AbdaImportLog)
        .order_by(AbdaImportLog.created_at.desc())
        .limit(1)
    )
    last = last_import.scalar_one_or_none()

    import_count = await db.execute(select(func.count()).select_from(AbdaImportLog))

    return AbdaStatsResponse(
        total_articles=total,
        last_import_date=last.completed_at.isoformat() if last and last.completed_at else None,
        last_import_status=last.status if last else None,
        total_imports=import_count.scalar() or 0,
    )
