from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierResponse, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def _supplier_to_response(supplier: Supplier) -> SupplierResponse:
    return SupplierResponse(
        id=supplier.id,
        name=supplier.name,
        type=supplier.type,
        discount_percent=float(supplier.discount_percent) if supplier.discount_percent is not None else 0,
        product_count=len(supplier.supplier_products) if supplier.supplier_products else 0,
        created_at=supplier.created_at,
        updated_at=supplier.updated_at,
    )


@router.get("", response_model=list[SupplierResponse])
async def list_suppliers(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Supplier)
        .options(selectinload(Supplier.supplier_products))
        .order_by(Supplier.name)
    )
    suppliers = result.unique().scalars().all()
    return [_supplier_to_response(s) for s in suppliers]


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Supplier)
        .options(selectinload(Supplier.supplier_products))
        .where(Supplier.id == supplier_id)
    )
    supplier = result.unique().scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return _supplier_to_response(supplier)


@router.post("", status_code=201, response_model=SupplierResponse)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    await db.flush()
    return SupplierResponse(
        id=supplier.id,
        name=supplier.name,
        type=supplier.type,
        discount_percent=float(supplier.discount_percent) if supplier.discount_percent is not None else 0,
        product_count=0,
        created_at=supplier.created_at,
        updated_at=supplier.updated_at,
    )


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("manager")),
):
    result = await db.execute(
        select(Supplier)
        .options(selectinload(Supplier.supplier_products))
        .where(Supplier.id == supplier_id)
    )
    supplier = result.unique().scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)

    return _supplier_to_response(supplier)
