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
from app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductListResponse,
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
        erp_sku=product.erp_sku,
        ean=product.ean,
        pzn=product.pzn,
        nan=product.nan,
        name=product.name,
        description=product.description,
        manufacturer=product.manufacturer,
        category=product.category,
        subcategory=product.subcategory,
        unit_size=product.unit_size,
        norm_size=product.norm_size,
        vat_rate=float(product.vat_rate) if product.vat_rate is not None else None,
        weight_g=product.weight_g,
        width_mm=product.width_mm,
        height_mm=product.height_mm,
        length_mm=product.length_mm,
        is_medication=product.is_medication,
        pharmacy_required=product.pharmacy_required,
        market_status=product.market_status,
        hs_code=product.hs_code,
        abda_pzn=product.abda_pzn,
        release_to_erp=product.release_to_erp,
        release_to_channel=product.release_to_channel,
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
        .options(selectinload(Product.supplier_products).selectinload(SupplierProduct.supplier))
        .where(Product.id == product_id)
    )
    product = result.unique().scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    suppliers = []
    for sp in product.supplier_products:
        suppliers.append(
            SupplierProductInfo(
                id=sp.id,
                supplier_id=sp.supplier_id,
                supplier_name=sp.supplier.name if sp.supplier else None,
                supplier_sku=sp.supplier_sku,
                purchase_price=float(sp.purchase_price) if sp.purchase_price is not None else None,
                retail_price=float(sp.retail_price) if sp.retail_price is not None else None,
            )
        )

    resp = _product_to_response(product)
    return ProductDetailResponse(
        **resp.model_dump(),
        suppliers=suppliers,
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
    changes = {}
    for field, value in update_data.items():
        old_value = getattr(product, field)
        if old_value != value:
            changes[field] = {"old": old_value, "new": value}
            setattr(product, field, value)

    if changes:
        product.version += 1
        await append_event(
            db=db,
            event_type="ProductUpdated",
            aggregate_type="product",
            aggregate_id=str(product.product_id),
            aggregate_version=product.version,
            payload={"changes": changes},
            user_id=user.username,
        )

    return _product_to_response(product)
