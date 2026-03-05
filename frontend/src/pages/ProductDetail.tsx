import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type ProductDetail as ProductDetailType, type EventItem } from "@/api/client";
import { ArrowLeft, Package } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getProduct(parseInt(id))
      .then((p) => {
        setProduct(p);
        return api.getAggregateEvents("product", p.product_id);
      })
      .then((r) => setEvents(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Laden...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Produkt nicht gefunden
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/products")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground">
            {product.erp_sku || "Kein ERP SKU"} · Version {product.version}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stammdaten */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" />
            Stammdaten
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="ERP SKU" value={product.erp_sku} />
            <Field label="EAN" value={product.ean} />
            <Field label="PZN" value={product.pzn} />
            <Field label="NAN" value={product.nan} />
            <Field label="Hersteller" value={product.manufacturer} />
            <Field label="Kategorie" value={product.category} />
            <Field label="Unterkategorie" value={product.subcategory} />
            <Field label="Einheit" value={product.unit_size} />
            <Field label="Normgröße" value={product.norm_size} />
            <Field label="MwSt." value={product.vat_rate != null ? `${product.vat_rate}%` : null} />
            <Field label="Gewicht" value={product.weight_g != null ? `${product.weight_g}g` : null} />
            <Field label="HS-Code" value={product.hs_code} />
            <Field label="Arzneimittel" value={product.is_medication != null ? (product.is_medication ? "Ja" : "Nein") : null} />
            <Field label="Apothekenpflichtig" value={product.pharmacy_required} />
            <Field label="Marktstatus" value={product.market_status} />
            <Field label="ABDA PZN" value={product.abda_pzn} />
          </dl>
        </div>

        {/* Release Status */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Freigabe-Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-xs text-muted-foreground">ERP Export</div>
                <div className={`mt-1 text-lg font-bold ${product.release_to_erp ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {product.release_to_erp ? "Freigegeben" : "Gesperrt"}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-xs text-muted-foreground">Channel Sync</div>
                <div className={`mt-1 text-lg font-bold ${product.release_to_channel ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {product.release_to_channel ? "Freigegeben" : "Gesperrt"}
                </div>
              </div>
            </div>
          </div>

          {/* Lieferanten */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Lieferanten ({product.suppliers.length})
            </h2>
            {product.suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Lieferanten zugeordnet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {product.suppliers.map((sp) => (
                  <div key={sp.id} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium">
                        {sp.supplier_name || `Lieferant #${sp.supplier_id}`}
                      </span>
                      {sp.supplier_sku && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          SKU: {sp.supplier_sku}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      {sp.purchase_price != null && (
                        <span className="text-muted-foreground">
                          EK: {sp.purchase_price.toFixed(2)}€
                        </span>
                      )}
                      {sp.retail_price != null && (
                        <span className="ml-3 text-muted-foreground">
                          VK: {sp.retail_price.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event History */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Event-Historie</h2>
        </div>
        <div className="divide-y divide-border">
          {events.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Keine Events
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{event.event_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.occurred_at).toLocaleString("de-DE")}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  v{event.aggregate_version} · {event.user_id || "system"} ·{" "}
                  {event.source}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || "–"}</dd>
    </>
  );
}
