from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProductBase(BaseModel):
    erp_sku: str | None = None
    ean: str | None = None
    pzn: str | None = None
    nan: str | None = None
    name: str
    description: str | None = None
    manufacturer: str | None = None
    category: str | None = None
    subcategory: str | None = None
    unit_size: str | None = None
    norm_size: str | None = None
    vat_rate: float | None = None
    weight_g: int | None = None
    width_mm: int | None = None
    height_mm: int | None = None
    length_mm: int | None = None
    is_medication: bool | None = None
    pharmacy_required: str | None = None
    market_status: str | None = None
    hs_code: str | None = None
    abda_pzn: str | None = None
    release_to_erp: bool = False
    release_to_channel: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    erp_sku: str | None = None
    ean: str | None = None
    pzn: str | None = None
    nan: str | None = None
    name: str | None = None
    description: str | None = None
    manufacturer: str | None = None
    category: str | None = None
    subcategory: str | None = None
    unit_size: str | None = None
    norm_size: str | None = None
    vat_rate: float | None = None
    weight_g: int | None = None
    width_mm: int | None = None
    height_mm: int | None = None
    length_mm: int | None = None
    is_medication: bool | None = None
    pharmacy_required: str | None = None
    market_status: str | None = None
    hs_code: str | None = None
    abda_pzn: str | None = None
    release_to_erp: bool | None = None
    release_to_channel: bool | None = None


class SupplierProductInfo(BaseModel):
    id: int
    supplier_id: int
    supplier_name: str | None = None
    supplier_sku: str | None = None
    purchase_price: float | None = None
    retail_price: float | None = None

    model_config = {"from_attributes": True}


class ProductResponse(ProductBase):
    id: int
    product_id: str
    version: int
    status: str
    supplier_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductDetailResponse(ProductResponse):
    suppliers: list[SupplierProductInfo] = []


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int
