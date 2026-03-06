"""Import Profile model — allows multiple import profiles per supplier.

Each supplier can have multiple profiles (e.g. "Bünting Komplett",
"Bünting Ordersatz", "Bünting Preisänderung") with different column mappings.
"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.import_profile_mapping import ImportProfileMapping
    from app.models.supplier import Supplier


class ImportProfile(Base):
    __tablename__ = "import_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False
    )
    profile_code: Mapped[str] = mapped_column(String(50), nullable=False)
    profile_name: Mapped[str] = mapped_column(String(200), nullable=False)
    file_type: Mapped[str] = mapped_column(
        String(10), nullable=False, server_default="csv"
    )  # "csv" or "xlsx"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    supplier: Mapped["Supplier"] = relationship(back_populates="import_profiles")
    mappings: Mapped[List["ImportProfileMapping"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("supplier_id", "profile_code", name="uq_supplier_profile_code"),
        Index("ix_import_profiles_supplier_id", "supplier_id"),
    )
