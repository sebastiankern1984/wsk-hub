from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.product import Product


class ProductHsCode(Base):
    __tablename__ = "product_hs_codes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    country: Mapped[str] = mapped_column(String(5), nullable=False)
    hs_code: Mapped[str] = mapped_column(String(20), nullable=False)

    # Tracking
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    updated_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=True)

    product: Mapped["Product"] = relationship(back_populates="hs_codes")

    __table_args__ = (
        UniqueConstraint("product_id", "country", name="uq_product_hs_code_country"),
    )
