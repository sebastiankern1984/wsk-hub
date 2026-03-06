"""Pharma wholesale discount calculation service.

Resolves the applicable discount for a supplier+product pair using
a priority cascade:
  1. PZN-level override (Minderspanne per article)
  2. Manufacturer-level override (Minderspanne per manufacturer)
  3. Supplier default discount

Then calculates: apo_ek * (1 - discount_percent / 100)
"""
from __future__ import annotations

import logging
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.abda import AbdaPacApo
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.supplier_discount_rule import SupplierDiscountRule
from app.models.supplier_product import SupplierProduct

logger = logging.getLogger(__name__)


def _safe_decimal(val: str | None) -> Decimal | None:
    if not val or not val.strip():
        return None
    try:
        return Decimal(val.strip().replace(",", "."))
    except Exception:
        return None


async def resolve_discount(
    db: AsyncSession,
    supplier_id: int,
    product: Product,
) -> tuple[Decimal, str]:
    """
    Resolve the applicable discount for a supplier+product pair.

    Returns (discount_percent, source) where source is one of:
      "pzn_override", "manufacturer_override", "supplier_default"
    """
    # Priority 1: PZN-level override
    if product.pzn:
        result = await db.execute(
            select(SupplierDiscountRule).where(
                SupplierDiscountRule.supplier_id == supplier_id,
                SupplierDiscountRule.scope == "pzn",
                SupplierDiscountRule.pzn == product.pzn,
            )
        )
        pzn_rule = result.scalar_one_or_none()
        if pzn_rule:
            return Decimal(str(pzn_rule.discount_percent)), "pzn_override"

    # Priority 2: Manufacturer-level override
    if product.manufacturer:
        result = await db.execute(
            select(SupplierDiscountRule).where(
                SupplierDiscountRule.supplier_id == supplier_id,
                SupplierDiscountRule.scope == "manufacturer",
                SupplierDiscountRule.manufacturer_name == product.manufacturer,
            )
        )
        mfr_rule = result.scalar_one_or_none()
        if mfr_rule:
            return Decimal(str(mfr_rule.discount_percent)), "manufacturer_override"

    # Priority 3: Supplier default discount
    supplier = await db.get(Supplier, supplier_id)
    default_discount = Decimal(str(supplier.discount_percent or 0))
    return default_discount, "supplier_default"


def calculate_purchase_price(
    apo_ek: Decimal,
    discount_percent: Decimal,
) -> Decimal:
    """Calculate: apo_ek * (1 - discount_percent / 100), rounded to 2 decimals."""
    factor = Decimal("1") - (discount_percent / Decimal("100"))
    return (apo_ek * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


async def recalculate_supplier_product(
    db: AsyncSession,
    sp: SupplierProduct,
    product: Product,
    trigger: str = "manual",
    user_id: str | None = None,
) -> bool:
    """
    Recalculate a single supplier_product's purchase_price.
    Returns True if price changed.
    """
    if not product.pzn:
        return False

    # Get ABDA apo_ek
    abda = await db.get(AbdaPacApo, product.pzn)
    if not abda or not abda.apo_ek:
        return False

    # ABDA speichert Preise als Ganzzahl in Cent (z.B. 779 = 7.79 EUR)
    apo_ek_raw = _safe_decimal(abda.apo_ek)
    if not apo_ek_raw or apo_ek_raw <= 0:
        return False
    apo_ek = apo_ek_raw / Decimal("100")

    discount_percent, discount_source = await resolve_discount(
        db, sp.supplier_id, product
    )

    new_price = calculate_purchase_price(apo_ek, discount_percent)
    old_price = Decimal(str(sp.purchase_price)) if sp.purchase_price else None

    changed = old_price is None or old_price != new_price

    sp.abda_ek = float(apo_ek)
    sp.purchase_price = float(new_price)
    sp.discount_source = discount_source

    return changed


async def recalculate_for_supplier(
    db: AsyncSession,
    supplier_id: int,
    user_id: str | None = None,
) -> dict:
    """Recalculate all pharma product prices for a supplier.

    For pharma_grosshandel suppliers: also auto-links all PZN products
    that are not yet linked (since they supply everything in ABDA).
    """
    supplier = await db.get(Supplier, supplier_id)

    # For pharma wholesalers: auto-link all PZN products not yet linked
    linked = 0
    if supplier and supplier.type == "pharma_grosshandel":
        # Find PZN products that are NOT yet linked to this supplier
        existing_product_ids = select(SupplierProduct.product_id).where(
            SupplierProduct.supplier_id == supplier_id
        ).scalar_subquery()

        result = await db.execute(
            select(Product).where(
                Product.pzn.isnot(None),
                Product.id.notin_(existing_product_ids),
            )
        )
        unlinked = result.scalars().all()

        for product in unlinked:
            sp = SupplierProduct(
                product_id=product.id,
                supplier_id=supplier_id,
            )
            db.add(sp)
            linked += 1

        if linked > 0:
            await db.flush()

    # Now recalculate all linked PZN products
    result = await db.execute(
        select(SupplierProduct)
        .join(Product)
        .options(joinedload(SupplierProduct.product))
        .where(
            SupplierProduct.supplier_id == supplier_id,
            Product.pzn.isnot(None),
        )
    )
    supplier_products = result.unique().scalars().all()

    updated = 0
    for sp in supplier_products:
        changed = await recalculate_supplier_product(
            db, sp, sp.product, trigger="manual", user_id=user_id
        )
        if changed:
            updated += 1

    await db.flush()
    return {"total": len(supplier_products), "updated": updated, "linked": linked}
