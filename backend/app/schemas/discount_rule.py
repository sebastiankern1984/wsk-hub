from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, model_validator


class DiscountRuleCreate(BaseModel):
    scope: Literal["pzn", "manufacturer"]
    pzn: str | None = None
    manufacturer_name: str | None = None
    discount_percent: float
    note: str | None = None

    @model_validator(mode="after")
    def check_scope_fields(self):
        if self.scope == "pzn" and not self.pzn:
            raise ValueError("pzn ist Pflichtfeld bei scope='pzn'")
        if self.scope == "manufacturer" and not self.manufacturer_name:
            raise ValueError("manufacturer_name ist Pflichtfeld bei scope='manufacturer'")
        if self.scope == "pzn":
            self.manufacturer_name = None
        if self.scope == "manufacturer":
            self.pzn = None
        return self


class DiscountRuleUpdate(BaseModel):
    discount_percent: float | None = None
    note: str | None = None


class DiscountRuleResponse(BaseModel):
    id: int
    supplier_id: int
    scope: str
    pzn: str | None = None
    manufacturer_name: str | None = None
    discount_percent: float
    note: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecalculationResult(BaseModel):
    total: int
    updated: int
