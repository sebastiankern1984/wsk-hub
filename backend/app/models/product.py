from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from app.database import Base

if TYPE_CHECKING:
    from app.models.manufacturer import Manufacturer
    from app.models.product_ean import ProductEan
    from app.models.product_hs_code import ProductHsCode
    from app.models.product_price import ProductPrice
    from app.models.product_source_value import ProductSourceValue
    from app.models.supplier_product import SupplierProduct


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        unique=True,
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )

    # Identity
    erp_sku: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True, index=True)
    internal_sku: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, unique=True, index=True)
    ean: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)  # legacy, use product_eans
    pzn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    nan: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)

    # Names
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    name_short: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    name_long: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Manufacturer
    manufacturer: Mapped[Optional[str]] = mapped_column(String(300), nullable=True, index=True)  # legacy string
    manufacturer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("manufacturers.id"), nullable=True
    )

    # Classification
    category: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    subcategory: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    warengruppe: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    saisonartikel: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    bio_article: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Size
    unit_size: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    norm_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    size_value: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    size_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Tax
    vat_rate: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    # Weight (all in grams)
    weight_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # legacy
    weight_piece_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight_ve_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight_palette_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Dimensions — Piece (mm)
    piece_width_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piece_height_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piece_length_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Dimensions — Case/VE (mm)
    case_width_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    case_height_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    case_length_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Packaging hierarchy
    units_per_ve: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ve_per_layer: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    layers_per_palette: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ve_per_palette: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Compliance
    is_medication: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    pharmacy_required: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    market_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    country_of_origin: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    pharma_flag: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    biozid_flag: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    dg_flag: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    shelf_life_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hs_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # legacy, use product_hs_codes
    abda_pzn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Release gates
    release_to_erp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    release_to_channel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    # Status: draft → reviewed → released
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", server_default="'draft'")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    # Field-level lock map  {"field_name": true} — locked fields are protected from import overwrite
    field_locks: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, server_default=text("'{}'::jsonb"))

    # Relationships
    manufacturer_rel: Mapped[Optional["Manufacturer"]] = relationship(back_populates="products")
    supplier_products: Mapped[List["SupplierProduct"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    eans: Mapped[List["ProductEan"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    prices: Mapped[List["ProductPrice"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    hs_codes: Mapped[List["ProductHsCode"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    source_values: Mapped[List["ProductSourceValue"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_products_name", "name"),
    )
