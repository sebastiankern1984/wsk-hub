"""Import Profile Mapping — column mappings per import profile.

Each import profile has its own set of CSV/Excel column → Hub field mappings.
"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.import_profile import ImportProfile


class ImportProfileMapping(Base):
    __tablename__ = "import_profile_mappings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(
        ForeignKey("import_profiles.id", ondelete="CASCADE"), nullable=False
    )
    csv_column: Mapped[str] = mapped_column(String(200), nullable=False)
    hub_field: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    profile: Mapped["ImportProfile"] = relationship(back_populates="mappings")

    __table_args__ = (
        UniqueConstraint("profile_id", "csv_column", name="uq_profile_csv_column"),
        Index("ix_import_profile_mappings_profile_id", "profile_id"),
    )
