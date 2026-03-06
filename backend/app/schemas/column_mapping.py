from __future__ import annotations

from pydantic import BaseModel


class HubFieldInfo(BaseModel):
    key: str
    label: str
    field_type: str
    example: str
    category: str


class ColumnMappingItem(BaseModel):
    csv_column: str
    hub_field: str


class ColumnMappingSave(BaseModel):
    mappings: list[ColumnMappingItem]


class ColumnMappingResponse(BaseModel):
    id: int
    csv_column: str
    hub_field: str


class AutoDetectRequest(BaseModel):
    headers: list[str]


class AutoDetectResult(BaseModel):
    csv_column: str
    hub_field: str | None
    confidence: str  # "exact", "normalized", "fuzzy", "none"
    example_value: str | None = None
