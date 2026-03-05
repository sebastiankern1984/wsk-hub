from __future__ import annotations

import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import EventStore


async def append_event(
    db: AsyncSession,
    event_type: str,
    aggregate_type: str,
    aggregate_id: str,
    aggregate_version: int,
    payload: dict,
    source: str = "hub",
    user_id: str | None = None,
    causation_id: str | None = None,
    correlation_id: str | None = None,
) -> EventStore:
    event = EventStore(
        event_id=uuid.uuid4(),
        event_type=event_type,
        aggregate_type=aggregate_type,
        aggregate_id=str(aggregate_id),
        aggregate_version=aggregate_version,
        payload=payload,
        source=source,
        user_id=user_id,
        causation_id=causation_id,
        correlation_id=correlation_id,
    )
    db.add(event)
    await db.flush()
    return event


async def get_events_by_aggregate(
    db: AsyncSession,
    aggregate_type: str,
    aggregate_id: str,
    limit: int = 50,
) -> list[EventStore]:
    result = await db.execute(
        select(EventStore)
        .where(EventStore.aggregate_type == aggregate_type)
        .where(EventStore.aggregate_id == str(aggregate_id))
        .order_by(desc(EventStore.occurred_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_recent_events(
    db: AsyncSession,
    event_type: str | None = None,
    aggregate_type: str | None = None,
    limit: int = 50,
) -> list[EventStore]:
    query = select(EventStore)
    if event_type:
        query = query.where(EventStore.event_type == event_type)
    if aggregate_type:
        query = query.where(EventStore.aggregate_type == aggregate_type)
    query = query.order_by(desc(EventStore.occurred_at)).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())
