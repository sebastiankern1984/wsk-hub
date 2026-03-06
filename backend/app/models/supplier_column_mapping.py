from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier


class SupplierColumnMapping(Base):
    __tablename__ = "supplier_column_mappings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False
    )
    csv_column: Mapped[str] = mapped_column(String(200), nullable=False)
    hub_field: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    supplier: Mapped["Supplier"] = relationship(back_populates="column_mappings")

    __table_args__ = (
        UniqueConstraint("supplier_id", "csv_column", name="uq_supplier_csv_column"),
        Index("ix_supplier_column_mappings_supplier_id", "supplier_id"),
    )
