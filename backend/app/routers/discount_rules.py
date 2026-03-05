"""CRUD + CSV-Import + Recalculate for supplier discount rules (Minderspannen)."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.supplier import Supplier
from app.models.supplier_discount_rule import SupplierDiscountRule
from app.models.user import User
from app.schemas.discount_rule import (
    DiscountRuleCreate,
    DiscountRuleResponse,
    DiscountRuleUpdate,
    RecalculationResult,
)
from app.services.discount_service import recalculate_for_supplier

router = APIRouter(prefix="/suppliers/{supplier_id}/discount-rules", tags=["discount-rules"])


async def _get_supplier_or_404(db: AsyncSession, supplier_id: int) -> Supplier:
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")
    return supplier


def _rule_response(rule: SupplierDiscountRule) -> DiscountRuleResponse:
    return DiscountRuleResponse(
        id=rule.id,
        supplier_id=rule.supplier_id,
        scope=rule.scope,
        pzn=rule.pzn,
        manufacturer_name=rule.manufacturer_name,
        discount_percent=float(rule.discount_percent),
        note=rule.note,
        created_at=rule.created_at,
        updated_at=rule.updated_at,
    )


@router.get("", response_model=list[DiscountRuleResponse])
async def list_discount_rules(
    supplier_id: int,
    scope: str | None = Query(None, description="Filter: pzn oder manufacturer"),
    search: str | None = Query(None, description="Suche in PZN oder Herstellername"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    await _get_supplier_or_404(db, supplier_id)

    q = select(SupplierDiscountRule).where(
        SupplierDiscountRule.supplier_id == supplier_id
    )

    if scope:
        q = q.where(SupplierDiscountRule.scope == scope)

    if search:
        pattern = f"%{search}%"
        q = q.where(
            SupplierDiscountRule.pzn.ilike(pattern)
            | SupplierDiscountRule.manufacturer_name.ilike(pattern)
        )

    q = q.order_by(SupplierDiscountRule.scope, SupplierDiscountRule.id)
    q = q.offset(offset).limit(limit)

    result = await db.execute(q)
    return [_rule_response(r) for r in result.scalars().all()]


@router.get("/count")
async def count_discount_rules(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    await _get_supplier_or_404(db, supplier_id)
    result = await db.execute(
        select(func.count(SupplierDiscountRule.id)).where(
            SupplierDiscountRule.supplier_id == supplier_id
        )
    )
    return {"count": result.scalar()}


@router.post("", response_model=DiscountRuleResponse, status_code=201)
async def create_discount_rule(
    supplier_id: int,
    data: DiscountRuleCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    await _get_supplier_or_404(db, supplier_id)

    # Check for duplicate
    q = select(SupplierDiscountRule).where(
        SupplierDiscountRule.supplier_id == supplier_id,
        SupplierDiscountRule.scope == data.scope,
    )
    if data.scope == "pzn":
        q = q.where(SupplierDiscountRule.pzn == data.pzn)
    else:
        q = q.where(SupplierDiscountRule.manufacturer_name == data.manufacturer_name)

    existing = (await db.execute(q)).scalar_one_or_none()
    if existing:
        key = data.pzn if data.scope == "pzn" else data.manufacturer_name
        raise HTTPException(409, f"Regel für {data.scope} '{key}' existiert bereits")

    rule = SupplierDiscountRule(
        supplier_id=supplier_id,
        **data.model_dump(),
    )
    db.add(rule)
    await db.flush()
    return _rule_response(rule)


@router.put("/{rule_id}", response_model=DiscountRuleResponse)
async def update_discount_rule(
    supplier_id: int,
    rule_id: int,
    data: DiscountRuleUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    rule = await db.get(SupplierDiscountRule, rule_id)
    if not rule or rule.supplier_id != supplier_id:
        raise HTTPException(404, "Regel nicht gefunden")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    await db.flush()
    return _rule_response(rule)


@router.delete("/{rule_id}", status_code=204)
async def delete_discount_rule(
    supplier_id: int,
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    rule = await db.get(SupplierDiscountRule, rule_id)
    if not rule or rule.supplier_id != supplier_id:
        raise HTTPException(404, "Regel nicht gefunden")

    await db.delete(rule)
    await db.flush()


@router.post("/import-csv")
async def import_discount_rules_csv(
    supplier_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    """
    CSV-Import für Minderspannen-Regeln.
    Format: scope;value;discount_percent;note
    """
    await _get_supplier_or_404(db, supplier_id)

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Nur CSV-Dateien erlaubt")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text), delimiter=";")

    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []

    for i, row in enumerate(reader, start=2):
        scope = (row.get("scope") or "").strip().lower()
        value = (row.get("value") or "").strip()
        discount_str = (row.get("discount_percent") or "").strip().replace(",", ".")
        note = (row.get("note") or "").strip() or None

        if scope not in ("pzn", "manufacturer"):
            errors.append(f"Zeile {i}: Ungültiger scope '{scope}'")
            skipped += 1
            continue

        if not value:
            errors.append(f"Zeile {i}: Leerer value")
            skipped += 1
            continue

        try:
            discount_percent = float(discount_str)
        except (ValueError, TypeError):
            errors.append(f"Zeile {i}: Ungültiger discount_percent '{discount_str}'")
            skipped += 1
            continue

        # Upsert
        q = select(SupplierDiscountRule).where(
            SupplierDiscountRule.supplier_id == supplier_id,
            SupplierDiscountRule.scope == scope,
        )
        if scope == "pzn":
            q = q.where(SupplierDiscountRule.pzn == value)
        else:
            q = q.where(SupplierDiscountRule.manufacturer_name == value)

        existing = (await db.execute(q)).scalar_one_or_none()

        if existing:
            existing.discount_percent = discount_percent
            if note:
                existing.note = note
            updated += 1
        else:
            rule = SupplierDiscountRule(
                supplier_id=supplier_id,
                scope=scope,
                pzn=value if scope == "pzn" else None,
                manufacturer_name=value if scope == "manufacturer" else None,
                discount_percent=discount_percent,
                note=note,
            )
            db.add(rule)
            created += 1

    await db.flush()

    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "errors": errors[:20],
    }


# ── Recalculate endpoint (on suppliers, not discount-rules) ───

recalculate_router = APIRouter(prefix="/suppliers/{supplier_id}", tags=["discount-rules"])


@recalculate_router.post("/recalculate", response_model=RecalculationResult)
async def recalculate_supplier_prices(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    """Alle Pharma-Produkt-Preise für diesen Lieferanten neu berechnen."""
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Lieferant nicht gefunden")

    result = await recalculate_for_supplier(db, supplier_id, user_id=_user.username)
    await db.commit()
    return result
