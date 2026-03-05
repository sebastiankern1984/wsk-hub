import { useState, useEffect } from "react";
import { api, type ProductStats, type Supplier, type EventItem } from "@/api/client";
import { Package, Truck, CheckCircle, Activity } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    api.getProductStats().then(setStats).catch(console.error);
    api.getSuppliers().then(setSuppliers).catch(console.error);
    api.getEvents(new URLSearchParams({ limit: "10" })).then((r) => setEvents(r.items)).catch(console.error);
  }, []);

  const cards = [
    {
      title: "Produkte gesamt",
      value: stats?.total ?? "–",
      icon: Package,
    },
    {
      title: "Freigegeben (ERP)",
      value: stats?.released_to_erp ?? "–",
      icon: CheckCircle,
    },
    {
      title: "Freigegeben (Channel)",
      value: stats?.released_to_channel ?? "–",
      icon: CheckCircle,
    },
    {
      title: "Lieferanten",
      value: suppliers.length,
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.title}</span>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Activity className="h-5 w-5" />
            Letzte Events
          </h2>
        </div>
        <div className="divide-y divide-border">
          {events.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Noch keine Events vorhanden
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">
                    {event.event_type}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {event.aggregate_type}/{event.aggregate_id.slice(0, 8)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {event.user_id || "system"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.occurred_at).toLocaleString("de-DE")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
