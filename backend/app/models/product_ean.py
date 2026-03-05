from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from app.database import Base

if TYPE_CHECKING:
    from app.models.product import Product


class ProductEan(Base):
    __tablename__ = "product_eans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    ean_type: Mapped[str] = mapped_column(String(20), nullable=False)  # pack, ve, palette
    ean_value: Mapped[str] = mapped_column(String(50), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    valid_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    valid_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    product: Mapped["Product"] = relationship(back_populates="eans")

    __table_args__ = (
        Index("ix_product_eans_product_id", "product_id"),
        Index("ix_product_eans_ean_value", "ean_value"),
        Index(
            "uq_product_ean_active",
            "ean_type",
            "ean_value",
            unique=True,
            postgresql_where=text("valid_to IS NULL"),
        ),
    )
