from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier


class SupplierDiscountRule(Base):
    __tablename__ = "supplier_discount_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False
    )

    # "pzn" or "manufacturer"
    scope: Mapped[str] = mapped_column(String(20), nullable=False)

    # For scope=pzn
    pzn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # For scope=manufacturer
    manufacturer_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    # Override discount percentage
    discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    supplier: Mapped["Supplier"] = relationship(back_populates="discount_rules")

    __table_args__ = (
        Index("ix_sdr_supplier_scope", "supplier_id", "scope"),
        Index("ix_sdr_supplier_pzn", "supplier_id", "pzn"),
        Index("ix_sdr_supplier_manufacturer", "supplier_id", "manufacturer_name"),
        UniqueConstraint("supplier_id", "pzn", name="uq_sdr_supplier_pzn"),
        UniqueConstraint(
            "supplier_id", "manufacturer_name", name="uq_sdr_supplier_manufacturer"
        ),
        CheckConstraint(
            "(scope = 'pzn' AND pzn IS NOT NULL AND manufacturer_name IS NULL) OR "
            "(scope = 'manufacturer' AND manufacturer_name IS NOT NULL AND pzn IS NULL)",
            name="ck_sdr_scope_fields",
        ),
    )
