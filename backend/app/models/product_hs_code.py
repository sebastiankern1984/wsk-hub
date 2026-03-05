from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    product: Mapped["Product"] = relationship(back_populates="hs_codes")

    __table_args__ = (
        UniqueConstraint("product_id", "country", name="uq_product_hs_code_country"),
    )
