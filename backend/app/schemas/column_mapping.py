from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class HubFieldInfo(BaseModel):
    key: str
    label: str
    field_type: str
    example: str
    category: str
    field_class: str = "supplier_meta"


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


# ── Import Profile schemas ──

class ImportProfileCreate(BaseModel):
    profile_code: str
    profile_name: str
    file_type: str = "csv"
    description: str | None = None
    is_active: bool = True


class ImportProfileUpdate(BaseModel):
    profile_name: str | None = None
    file_type: str | None = None
    description: str | None = None
    is_active: bool | None = None


class ImportProfileResponse(BaseModel):
    id: int
    supplier_id: int
    profile_code: str
    profile_name: str
    file_type: str
    description: str | None
    is_active: bool
    mapping_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ImportProfileMappingSave(BaseModel):
    mappings: list[ColumnMappingItem]


class ImportProfileMappingResponse(BaseModel):
    id: int
    csv_column: str
    hub_field: str
