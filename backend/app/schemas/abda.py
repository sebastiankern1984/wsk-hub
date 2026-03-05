from pydantic import BaseModel


class AbdaImportLogResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    file_date: str | None
    record_count_total: int
    record_count_insert: int
    record_count_update: int
    status: str
    error_message: str | None
    started_at: str | None
    completed_at: str | None
    created_at: str

    model_config = {"from_attributes": True}


class AbdaLookupResult(BaseModel):
    pzn: str
    ean: str | None = None
    name: str | None = None
    manufacturer: str | None = None
    pack_size: str | None = None
    norm_size: str | None = None
    apo_ek: str | None = None
    is_medication: str | None = None
    pharmacy_required: str | None = None
    market_status: str | None = None
    distribution_status: str | None = None
    already_in_hub: bool = False


class AbdaPriceHistoryResponse(BaseModel):
    id: int
    pzn: str
    old_apo_ek: str | None
    new_apo_ek: str | None
    old_gdat_preise: str | None
    new_gdat_preise: str | None
    change_source: str | None
    changed_at: str

    model_config = {"from_attributes": True}


class AbdaStatsResponse(BaseModel):
    total_articles: int
    last_import_date: str | None
    last_import_status: str | None
    total_imports: int
