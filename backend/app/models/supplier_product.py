from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.supplier import Supplier


class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False
    )
    supplier_sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    purchase_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    retail_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    source_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    valid_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    valid_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    # ABDA apo_ek in EUR (Listenpreis vor Rabatt)
    abda_ek: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    # How the purchase_price was derived: "pzn_override", "manufacturer_override", "supplier_default", None
    discount_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    product: Mapped["Product"] = relationship(back_populates="supplier_products")
    supplier: Mapped["Supplier"] = relationship(back_populates="supplier_products")

    __table_args__ = (
        Index("ix_supplier_products_product_id", "product_id"),
        Index("ix_supplier_products_supplier_id", "supplier_id"),
        Index("ix_supplier_products_product_supplier", "product_id", "supplier_id"),
    )
