from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class IdentityMap(Base):
    __tablename__ = "identity_map"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    identity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    identity_value: Mapped[str] = mapped_column(String(100), nullable=False)
    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.product_id"),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        UniqueConstraint("identity_type", "identity_value", name="uq_identity_type_value"),
        Index("ix_identity_map_product_id", "product_id"),
    )
