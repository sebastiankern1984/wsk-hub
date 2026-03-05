from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EventResponse(BaseModel):
    id: int
    event_id: str
    event_type: str
    aggregate_type: str
    aggregate_id: str
    aggregate_version: int
    payload: dict[str, Any]
    source: str
    user_id: str | None
    occurred_at: datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    items: list[EventResponse]
    total: int
