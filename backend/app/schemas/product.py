from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProductBase(BaseModel):
    # Identity
    erp_sku: str | None = None
    internal_sku: str | None = None
    ean: str | None = None
    pzn: str | None = None
    nan: str | None = None
    # Names
    name: str
    name_short: str | None = None
    name_long: str | None = None
    description: str | None = None
    # Manufacturer
    manufacturer: str | None = None
    manufacturer_id: int | None = None
    # Classification
    category: str | None = None
    subcategory: str | None = None
    warengruppe: str | None = None
    saisonartikel: bool | None = None
    bio_article: bool | None = None
    # Size / Packaging
    unit_size: str | None = None
    norm_size: str | None = None
    size_value: float | None = None
    size_unit: str | None = None
    units_per_ve: int | None = None
    ve_per_layer: int | None = None
    layers_per_palette: int | None = None
    ve_per_palette: int | None = None
    # Tax
    vat_rate: float | None = None
    # Weight
    weight_g: int | None = None
    weight_piece_g: int | None = None
    weight_ve_g: int | None = None
    weight_palette_g: int | None = None
    # Dimensions — Piece
    piece_width_mm: int | None = None
    piece_height_mm: int | None = None
    piece_length_mm: int | None = None
    # Dimensions — Case/VE
    case_width_mm: int | None = None
    case_height_mm: int | None = None
    case_length_mm: int | None = None
    # Compliance
    is_medication: bool | None = None
    pharmacy_required: str | None = None
    market_status: str | None = None
    country_of_origin: str | None = None
    pharma_flag: bool | None = None
    biozid_flag: bool | None = None
    dg_flag: bool | None = None
    shelf_life_days: int | None = None
    hs_code: str | None = None
    abda_pzn: str | None = None
    # Release
    release_to_erp: bool = False
    release_to_channel: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    field_locks: dict | None = None
    # Identity
    erp_sku: str | None = None
    internal_sku: str | None = None
    ean: str | None = None
    pzn: str | None = None
    nan: str | None = None
    # Names
    name: str | None = None
    name_short: str | None = None
    name_long: str | None = None
    description: str | None = None
    # Manufacturer
    manufacturer: str | None = None
    manufacturer_id: int | None = None
    # Classification
    category: str | None = None
    subcategory: str | None = None
    warengruppe: str | None = None
    saisonartikel: bool | None = None
    bio_article: bool | None = None
    # Size / Packaging
    unit_size: str | None = None
    norm_size: str | None = None
    size_value: float | None = None
    size_unit: str | None = None
    units_per_ve: int | None = None
    ve_per_layer: int | None = None
    layers_per_palette: int | None = None
    ve_per_palette: int | None = None
    # Tax
    vat_rate: float | None = None
    # Weight
    weight_g: int | None = None
    weight_piece_g: int | None = None
    weight_ve_g: int | None = None
    weight_palette_g: int | None = None
    # Dimensions — Piece
    piece_width_mm: int | None = None
    piece_height_mm: int | None = None
    piece_length_mm: int | None = None
    # Dimensions — Case/VE
    case_width_mm: int | None = None
    case_height_mm: int | None = None
    case_length_mm: int | None = None
    # Compliance
    is_medication: bool | None = None
    pharmacy_required: str | None = None
    market_status: str | None = None
    country_of_origin: str | None = None
    pharma_flag: bool | None = None
    biozid_flag: bool | None = None
    dg_flag: bool | None = None
    shelf_life_days: int | None = None
    hs_code: str | None = None
    abda_pzn: str | None = None
    # Release
    release_to_erp: bool | None = None
    release_to_channel: bool | None = None


class SupplierProductInfo(BaseModel):
    id: int
    supplier_id: int
    supplier_name: str | None = None
    supplier_sku: str | None = None
    purchase_price: float | None = None
    retail_price: float | None = None
    abda_ek: float | None = None
    discount_source: str | None = None

    model_config = {"from_attributes": True}


class ProductEanInfo(BaseModel):
    id: int
    ean_type: str
    ean_value: str
    is_primary: bool
    source: str | None = None
    valid_from: str | None = None
    valid_to: str | None = None

    model_config = {"from_attributes": True}


class ProductPriceInfo(BaseModel):
    id: int
    source: str
    price_type: str
    price: float
    currency: str
    valid_from: str | None = None
    valid_to: str | None = None

    model_config = {"from_attributes": True}


class ProductHsCodeInfo(BaseModel):
    id: int
    country: str
    hs_code: str
    source: str | None = None
    is_locked: bool = False
    updated_by: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}


class ProductHsCodeCreate(BaseModel):
    country: str
    hs_code: str


class ProductHsCodeUpdate(BaseModel):
    country: str | None = None
    hs_code: str | None = None
    is_locked: bool | None = None


class FieldLockUpdate(BaseModel):
    field_locks: dict


class ProductResponse(ProductBase):
    id: int
    product_id: str
    field_locks: dict = {}
    version: int
    status: str
    supplier_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductDetailResponse(ProductResponse):
    suppliers: list[SupplierProductInfo] = []
    eans: list[ProductEanInfo] = []
    prices: list[ProductPriceInfo] = []
    hs_codes: list[ProductHsCodeInfo] = []


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int
