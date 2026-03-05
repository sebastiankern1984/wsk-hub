import { useState, useEffect } from "react";
import { api, type EventItem } from "@/api/client";
import { Activity } from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filter) params.set("event_type", filter);
    api
      .getEvents(params)
      .then((r) => {
        setEvents(r.items);
        setTotal(r.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const eventTypes = [...new Set(events.map((e) => e.event_type))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Event Store</h1>
        <span className="text-sm text-muted-foreground">{total} Events</span>
      </div>

      {eventTypes.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("")}
            className={`inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors ${
              !filter
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            Alle
          </button>
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors ${
                filter === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Laden...
            </div>
          ) : events.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Keine Events vorhanden
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{event.event_type}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                      {event.aggregate_type}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.occurred_at).toLocaleString("de-DE")}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>ID: {event.aggregate_id.slice(0, 8)}...</span>
                  <span>v{event.aggregate_version}</span>
                  <span>{event.user_id || "system"}</span>
                  <span>{event.source}</span>
                </div>
                {event.payload && Object.keys(event.payload).length > 0 && (
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-[11px] text-muted-foreground">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
