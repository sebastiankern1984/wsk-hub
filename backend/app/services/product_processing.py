from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.abda import AbdaAdrApo, AbdaPacApo, AbdaPgrApo
from app.models.identity_map import IdentityMap
from app.models.manufacturer import Manufacturer
from app.models.product import Product
from app.models.product_ean import ProductEan
from app.services.event_store import append_event

logger = logging.getLogger(__name__)

# Value maps from ABDA coded fields
MWST_MAP = {"0": None, "1": 7.0, "2": 19.0, "3": 0.0}
ARZNEI_MAP = {"0": None, "1": False, "2": True}
APOPFLICHT_MAP = {"0": None, "1": "nein", "2": "ja", "3": "verschreibungspflichtig"}
VERKEHR_MAP = {"0": None, "1": "nicht verkehrsfähig", "2": "verkehrsfähig", "3": "in Prüfung"}
NORMGROESSE_MAP = {"3": "N1", "4": "N2", "5": "N3"}


def _safe_int(val: str | None) -> int | None:
    if not val:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _safe_float(val: str | None) -> float | None:
    if not val:
        return None
    try:
        return float(val.replace(",", "."))
    except (ValueError, TypeError):
        return None


async def _get_or_create_manufacturer(db: AsyncSession, name: str) -> Manufacturer:
    result = await db.execute(select(Manufacturer).where(Manufacturer.name == name))
    mfr = result.scalar_one_or_none()
    if not mfr:
        mfr = Manufacturer(name=name)
        db.add(mfr)
        await db.flush()
    return mfr


async def process_abda_to_product(
    db: AsyncSession,
    pzn: str,
    user_id: Optional[str] = None,
) -> Product:
    """Create or update a Product from abda_pac_apo data."""

    # 1. Get ABDA record
    abda = await db.get(AbdaPacApo, pzn)
    if not abda:
        raise ValueError(f"PZN {pzn} nicht in ABDA-Daten gefunden")

    # 2. Look up manufacturer
    manufacturer_id = None
    manufacturer_name = abda.hersteller_name
    if not manufacturer_name and abda.key_adr_hersteller:
        adr = await db.get(AbdaAdrApo, abda.key_adr_hersteller)
        if adr:
            manufacturer_name = adr.firmenname

    if manufacturer_name:
        mfr = await _get_or_create_manufacturer(db, manufacturer_name)
        manufacturer_id = mfr.id

    # 3. Look up norm size from pgr_apo
    norm_size = abda.normgroesse
    if not norm_size:
        result = await db.execute(
            select(AbdaPgrApo).where(AbdaPgrApo.pzn == pzn).limit(1)
        )
        pgr = result.scalar_one_or_none()
        if pgr and pgr.einstufung:
            norm_size = NORMGROESSE_MAP.get(pgr.einstufung, pgr.einstufung)

    # 4. Check if product already exists via IdentityMap
    result = await db.execute(
        select(IdentityMap).where(
            IdentityMap.identity_type == "PZN",
            IdentityMap.identity_value == pzn,
        )
    )
    identity = result.scalar_one_or_none()

    existing_product = None
    if identity:
        result = await db.execute(
            select(Product).where(Product.product_id == identity.product_id)
        )
        existing_product = result.scalar_one_or_none()

    # 5. Extract fields
    vat_rate = MWST_MAP.get(abda.mwst) if abda.mwst else None
    is_medication = ARZNEI_MAP.get(abda.arzneimittel) if abda.arzneimittel else None
    pharmacy_required = APOPFLICHT_MAP.get(abda.apopflicht) if abda.apopflicht else None
    market_status = VERKEHR_MAP.get(abda.verkehrsstatus) if abda.verkehrsstatus else None

    product_data = {
        "pzn": pzn,
        "erp_sku": pzn,
        "name": abda.langname or abda.kurzname or f"PZN {pzn}",
        "name_short": abda.kurzname,
        "name_long": abda.langname_ungekuerzt or abda.langname,
        "manufacturer": manufacturer_name,
        "manufacturer_id": manufacturer_id,
        "unit_size": abda.packungsgroesse,
        "norm_size": norm_size,
        "vat_rate": vat_rate,
        "weight_g": _safe_int(abda.gewicht),
        "weight_piece_g": _safe_int(abda.gewicht),
        "width_mm": _safe_int(abda.breite),
        "height_mm": _safe_int(abda.hoehe),
        "length_mm": _safe_int(abda.laenge),
        "is_medication": is_medication,
        "pharmacy_required": pharmacy_required,
        "market_status": market_status,
        "abda_pzn": pzn,
        "hs_code": abda.hs_code,
        "pharma_flag": is_medication,
        "biozid_flag": abda.biozid == "1" if abda.biozid else None,
    }

    if existing_product:
        # 6a. Update existing product
        for key, value in product_data.items():
            if value is not None:
                setattr(existing_product, key, value)
        existing_product.version += 1
        product = existing_product
        event_type = "ProductUpdated"
    else:
        # 6b. Create new product
        product = Product(**product_data, status="draft")
        db.add(product)
        await db.flush()
        event_type = "ProductCreated"

        # Create IdentityMap entry
        db.add(IdentityMap(
            identity_type="PZN",
            identity_value=pzn,
            product_id=product.product_id,
            source="abda",
        ))

    # 7. Create ProductEan if EAN exists
    if abda.gtin:
        result = await db.execute(
            select(ProductEan).where(
                ProductEan.product_id == product.id,
                ProductEan.ean_type == "pack",
                ProductEan.ean_value == abda.gtin,
            )
        )
        if not result.scalar_one_or_none():
            db.add(ProductEan(
                product_id=product.id,
                ean_type="pack",
                ean_value=abda.gtin,
                is_primary=True,
                source="abda",
            ))

    # 8. Event store
    await append_event(
        db,
        event_type=event_type,
        aggregate_type="product",
        aggregate_id=product.product_id,
        aggregate_version=product.version,
        payload={"pzn": pzn, "name": product.name, "source": "abda"},
        source="abda_import",
        user_id=user_id,
    )

    await db.flush()
    return product
