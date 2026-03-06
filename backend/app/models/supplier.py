from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.import_log import ImportLog
    from app.models.supplier_column_mapping import SupplierColumnMapping
    from app.models.supplier_discount_rule import SupplierDiscountRule
    from app.models.supplier_product import SupplierProduct


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    discount_percent: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    supplier_products: Mapped[List["SupplierProduct"]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan"
    )
    import_logs: Mapped[List["ImportLog"]] = relationship(back_populates="supplier")
    discount_rules: Mapped[List["SupplierDiscountRule"]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan"
    )
    column_mappings: Mapped[List["SupplierColumnMapping"]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan"
    )
