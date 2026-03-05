from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.event import EventStore
from app.models.user import User
from app.schemas.event import EventListResponse, EventResponse
from app.services.event_store import get_events_by_aggregate, get_recent_events

router = APIRouter(prefix="/events", tags=["events"])


def _event_to_response(event: EventStore) -> EventResponse:
    return EventResponse(
        id=event.id,
        event_id=str(event.event_id),
        event_type=event.event_type,
        aggregate_type=event.aggregate_type,
        aggregate_id=event.aggregate_id,
        aggregate_version=event.aggregate_version,
        payload=event.payload,
        source=event.source,
        user_id=event.user_id,
        occurred_at=event.occurred_at,
    )


@router.get("", response_model=EventListResponse)
async def list_events(
    event_type: str | None = Query(None),
    aggregate_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    events = await get_recent_events(db, event_type=event_type, aggregate_type=aggregate_type, limit=limit)
    count_query = select(func.count(EventStore.id))
    if event_type:
        count_query = count_query.where(EventStore.event_type == event_type)
    if aggregate_type:
        count_query = count_query.where(EventStore.aggregate_type == aggregate_type)
    total = (await db.execute(count_query)).scalar() or 0

    return EventListResponse(
        items=[_event_to_response(e) for e in events],
        total=total,
    )


@router.get("/{aggregate_type}/{aggregate_id}", response_model=EventListResponse)
async def get_aggregate_events(
    aggregate_type: str,
    aggregate_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    events = await get_events_by_aggregate(db, aggregate_type, aggregate_id, limit=limit)
    return EventListResponse(
        items=[_event_to_response(e) for e in events],
        total=len(events),
    )
