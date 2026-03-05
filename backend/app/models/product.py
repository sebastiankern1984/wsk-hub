from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from app.database import Base

if TYPE_CHECKING:
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
    erp_sku: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True, index=True)
    ean: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    pzn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    nan: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(300), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    subcategory: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    unit_size: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    norm_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vat_rate: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    weight_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    width_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    length_mm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_medication: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    pharmacy_required: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    market_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hs_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    abda_pzn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    release_to_erp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    release_to_channel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="'active'")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    supplier_products: Mapped[List["SupplierProduct"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_products_name", "name"),
    )
