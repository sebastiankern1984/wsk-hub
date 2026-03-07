from __future__ import annotations

import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.product import Product
from app.models.supplier_product import SupplierProduct
from app.models.user import User
from app.models.product_hs_code import ProductHsCode
from app.schemas.product import (
    FieldLockUpdate,
    ProductCreate,
    ProductDetailResponse,
    ProductEanInfo,
    ProductHsCodeCreate,
    ProductHsCodeInfo,
    ProductHsCodeUpdate,
    ProductListResponse,
    ProductPriceInfo,
    ProductResponse,
    ProductUpdate,
    SupplierProductInfo,
)
from app.services.event_store import append_event

router = APIRouter(prefix="/products", tags=["products"])


def _product_to_response(product: Product) -> ProductResponse:
    return ProductResponse(
        id=product.id,
        product_id=str(product.product_id),
        # Identity
        erp_sku=product.erp_sku,
        internal_sku=product.internal_sku,
        ean=product.ean,
        pzn=product.pzn,
        nan=product.nan,
        # Names
        name=product.name,
        name_short=product.name_short,
        name_long=product.name_long,
        description=product.description,
        # Manufacturer
        manufacturer=product.manufacturer,
        manufacturer_id=product.manufacturer_id,
        # Classification
        category=product.category,
        subcategory=product.subcategory,
        warengruppe=product.warengruppe,
        saisonartikel=product.saisonartikel,
        bio_article=product.bio_article,
        # Size / Packaging
        unit_size=product.unit_size,
        norm_size=product.norm_size,
        size_value=float(product.size_value) if product.size_value is not None else None,
        size_unit=product.size_unit,
        units_per_ve=product.units_per_ve,
        ve_per_layer=product.ve_per_layer,
        layers_per_palette=product.layers_per_palette,
        ve_per_palette=product.ve_per_palette,
        # Tax
        vat_rate=float(product.vat_rate) if product.vat_rate is not None else None,
        # Weight
        weight_g=product.weight_g,
        weight_piece_g=product.weight_piece_g,
        weight_ve_g=product.weight_ve_g,
        weight_palette_g=product.weight_palette_g,
        # Dimensions — Piece
        piece_width_mm=product.piece_width_mm,
        piece_height_mm=product.piece_height_mm,
        piece_length_mm=product.piece_length_mm,
        # Dimensions — Case/VE
        case_width_mm=product.case_width_mm,
        case_height_mm=product.case_height_mm,
        case_length_mm=product.case_length_mm,
        # Compliance
        is_medication=product.is_medication,
        pharmacy_required=product.pharmacy_required,
        market_status=product.market_status,
        country_of_origin=product.country_of_origin,
        pharma_flag=product.pharma_flag,
        biozid_flag=product.biozid_flag,
        dg_flag=product.dg_flag,
        shelf_life_days=product.shelf_life_days,
        hs_code=product.hs_code,
        abda_pzn=product.abda_pzn,
        # Release
        release_to_erp=product.release_to_erp,
        release_to_channel=product.release_to_channel,
        # Meta
        field_locks=product.field_locks or {},
        version=product.version,
        status=product.status,
        supplier_count=len(product.supplier_products) if product.supplier_products else 0,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.get("", response_model=ProductListResponse)
async def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    manufacturer: Optional[str] = Query(None),
    release_to_erp: Optional[bool] = Query(None),
    release_to_channel: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(Product)
    count_query = select(func.count(Product.id))

    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.ean.ilike(f"%{search}%"),
            Product.pzn.ilike(f"%{search}%"),
            Product.erp_sku.ilike(f"%{search}%"),
            Product.manufacturer.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if category:
        query = query.where(Product.category == category)
        count_query = count_query.where(Product.category == category)
    if manufacturer:
        query = query.where(Product.manufacturer == manufacturer)
        count_query = count_query.where(Product.manufacturer == manufacturer)
    if release_to_erp is not None:
        query = query.where(Product.release_to_erp == release_to_erp)
        count_query = count_query.where(Product.release_to_erp == release_to_erp)
    if release_to_channel is not None:
        query = query.where(Product.release_to_channel == release_to_channel)
        count_query = count_query.where(Product.release_to_channel == release_to_channel)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = (
        query.options(selectinload(Product.supplier_products))
        .order_by(Product.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    products = result.unique().scalars().all()

    return ProductListResponse(
        items=[_product_to_response(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/stats")
async def product_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    total = (await db.execute(select(func.count(Product.id)))).scalar() or 0
    released_erp = (
        await db.execute(
            select(func.count(Product.id)).where(Product.release_to_erp.is_(True))
        )
    ).scalar() or 0
    released_channel = (
        await db.execute(
            select(func.count(Product.id)).where(Product.release_to_channel.is_(True))
        )
    ).scalar() or 0

    return {
        "total": total,
        "released_to_erp": released_erp,
        "released_to_channel": released_channel,
    }


@router.get("/{product_id}", response_model=ProductDetailResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.supplier_products).selectinload(SupplierProduct.supplier),
            selectinload(Product.eans),
            selectinload(Product.prices),
            selectinload(Product.hs_codes),
        )
        .where(Product.id == product_id)
    )
    product = result.unique().scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    suppliers = [
        SupplierProductInfo(
            id=sp.id,
            supplier_id=sp.supplier_id,
            supplier_name=sp.supplier.name if sp.supplier else None,
            supplier_sku=sp.supplier_sku,
            purchase_price=float(sp.purchase_price) if sp.purchase_price is not None else None,
            retail_price=float(sp.retail_price) if sp.retail_price is not None else None,
            abda_ek=float(sp.abda_ek) if sp.abda_ek is not None else None,
            discount_source=sp.discount_source,
        )
        for sp in product.supplier_products
    ]

    eans = [
        ProductEanInfo(
            id=e.id,
            ean_type=e.ean_type,
            ean_value=e.ean_value,
            is_primary=e.is_primary,
            source=e.source,
            valid_from=e.valid_from.isoformat() if e.valid_from else None,
            valid_to=e.valid_to.isoformat() if e.valid_to else None,
        )
        for e in product.eans
    ]

    prices = [
        ProductPriceInfo(
            id=p.id,
            source=p.source,
            price_type=p.price_type,
            price=float(p.price),
            currency=p.currency,
            valid_from=p.valid_from.isoformat() if p.valid_from else None,
            valid_to=p.valid_to.isoformat() if p.valid_to else None,
        )
        for p in product.prices
    ]

    hs_codes_list = [
        ProductHsCodeInfo(
            id=h.id,
            country=h.country,
            hs_code=h.hs_code,
            source=h.source,
            is_locked=h.is_locked,
            updated_by=h.updated_by,
            updated_at=h.updated_at.isoformat() if h.updated_at else None,
        )
        for h in product.hs_codes
    ]

    resp = _product_to_response(product)
    return ProductDetailResponse(
        **resp.model_dump(),
        suppliers=suppliers,
        eans=eans,
        prices=prices,
        hs_codes=hs_codes_list,
    )


@router.post("", status_code=201, response_model=ProductResponse)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    product = Product(**data.model_dump(), version=1)
    db.add(product)
    await db.flush()

    await append_event(
        db=db,
        event_type="ProductCreated",
        aggregate_type="product",
        aggregate_id=str(product.product_id),
        aggregate_version=1,
        payload=data.model_dump(),
        user_id=user.username,
    )

    # Eagerly load supplier_products for response
    await db.refresh(product, ["supplier_products"])
    return _product_to_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.supplier_products))
        .where(Product.id == product_id)
    )
    product = result.unique().scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)

    # Handle field_locks merge separately
    explicit_locks = update_data.pop("field_locks", None)

    changes = {}
    current_locks = dict(product.field_locks or {})

    for field, value in update_data.items():
        old_value = getattr(product, field)
        if old_value != value:
            changes[field] = {"old": old_value, "new": value}
            setattr(product, field, value)
            # Auto-lock field when manually edited
            current_locks[field] = True

    # Merge explicit lock/unlock requests (e.g. user clicks lock icon)
    if explicit_locks is not None:
        for field, locked in explicit_locks.items():
            if locked:
                current_locks[field] = True
            else:
                current_locks.pop(field, None)

    product.field_locks = current_locks

    if changes or explicit_locks is not None:
        product.version += 1
        await append_event(
            db=db,
            event_type="ProductUpdated",
            aggregate_type="product",
            aggregate_id=str(product.product_id),
            aggregate_version=product.version,
            payload={"changes": changes, "field_locks": current_locks},
            user_id=user.username,
        )

    return _product_to_response(product)


# ── HS-Code CRUD ──────────────────────────────────────────────


@router.post("/{product_id}/hs-codes", status_code=201, response_model=ProductHsCodeInfo)
async def create_hs_code(
    product_id: int,
    data: ProductHsCodeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = await db.execute(
        select(ProductHsCode).where(
            ProductHsCode.product_id == product_id,
            ProductHsCode.country == data.country,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"HS-Code for country '{data.country}' already exists")

    hs = ProductHsCode(
        product_id=product_id,
        country=data.country,
        hs_code=data.hs_code,
        source="manual",
        is_locked=True,
        updated_by=user.username,
    )
    db.add(hs)
    await db.flush()

    await append_event(
        db=db,
        event_type="HsCodeCreated",
        aggregate_type="product",
        aggregate_id=str(product.product_id),
        aggregate_version=product.version,
        payload={"country": data.country, "hs_code": data.hs_code},
        user_id=user.username,
    )

    return ProductHsCodeInfo(
        id=hs.id,
        country=hs.country,
        hs_code=hs.hs_code,
        source=hs.source,
        is_locked=hs.is_locked,
        updated_by=hs.updated_by,
        updated_at=hs.updated_at.isoformat() if hs.updated_at else None,
    )


@router.put("/{product_id}/hs-codes/{hs_code_id}", response_model=ProductHsCodeInfo)
async def update_hs_code(
    product_id: int,
    hs_code_id: int,
    data: ProductHsCodeUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    result = await db.execute(
        select(ProductHsCode).where(
            ProductHsCode.id == hs_code_id,
            ProductHsCode.product_id == product_id,
        )
    )
    hs = result.scalar_one_or_none()
    if not hs:
        raise HTTPException(status_code=404, detail="HS-Code not found")

    if data.country is not None:
        hs.country = data.country
    if data.hs_code is not None:
        hs.hs_code = data.hs_code
    if data.is_locked is not None:
        hs.is_locked = data.is_locked

    hs.source = "manual"
    hs.updated_by = user.username

    product = await db.get(Product, product_id)
    if product:
        await append_event(
            db=db,
            event_type="HsCodeUpdated",
            aggregate_type="product",
            aggregate_id=str(product.product_id),
            aggregate_version=product.version,
            payload={"hs_code_id": hs_code_id, "country": hs.country, "hs_code": hs.hs_code},
            user_id=user.username,
        )

    return ProductHsCodeInfo(
        id=hs.id,
        country=hs.country,
        hs_code=hs.hs_code,
        source=hs.source,
        is_locked=hs.is_locked,
        updated_by=hs.updated_by,
        updated_at=hs.updated_at.isoformat() if hs.updated_at else None,
    )


@router.delete("/{product_id}/hs-codes/{hs_code_id}", status_code=204)
async def delete_hs_code(
    product_id: int,
    hs_code_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    result = await db.execute(
        select(ProductHsCode).where(
            ProductHsCode.id == hs_code_id,
            ProductHsCode.product_id == product_id,
        )
    )
    hs = result.scalar_one_or_none()
    if not hs:
        raise HTTPException(status_code=404, detail="HS-Code not found")

    product = await db.get(Product, product_id)
    if product:
        await append_event(
            db=db,
            event_type="HsCodeDeleted",
            aggregate_type="product",
            aggregate_id=str(product.product_id),
            aggregate_version=product.version,
            payload={"hs_code_id": hs_code_id, "country": hs.country, "hs_code": hs.hs_code},
            user_id=user.username,
        )

    await db.delete(hs)


@router.put("/{product_id}/field-locks", response_model=dict)
async def update_field_locks(
    product_id: int,
    data: FieldLockUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("manager")),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.supplier_products))
        .where(Product.id == product_id)
    )
    product = result.unique().scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    current_locks = dict(product.field_locks or {})
    for field, locked in data.field_locks.items():
        if locked:
            current_locks[field] = True
        else:
            current_locks.pop(field, None)

    product.field_locks = current_locks

    await append_event(
        db=db,
        event_type="FieldLocksUpdated",
        aggregate_type="product",
        aggregate_id=str(product.product_id),
        aggregate_version=product.version,
        payload={"field_locks": current_locks},
        user_id=user.username,
    )

    return current_locks
