from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SupplierBase(BaseModel):
    name: str
    type: str | None = None
    discount_percent: float | None = 0


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    discount_percent: float | None = None


class SupplierResponse(SupplierBase):
    id: int
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
