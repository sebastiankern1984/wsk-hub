import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api,
  type ProductDetail as ProductDetailType,
  type EventItem,
} from "@/api/client";
import {
  ArrowLeft,
  Fingerprint,
  FileText,
  FolderTree,
  ShieldCheck,
  Box,
  Weight,
  Barcode,
  Euro,
  Globe,
  Truck,
  History,
} from "lucide-react";

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
      {/* Header */}
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
            {product.erp_sku || "Kein ERP SKU"} · Version {product.version} ·{" "}
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                product.status === "released"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : product.status === "reviewed"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-amber-500/10 text-amber-500"
              }`}
            >
              {product.status}
            </span>
          </p>
        </div>
      </div>

      {/* Row 1: Identifikation + Bezeichnungen */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Identifikation" icon={Fingerprint}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="ERP SKU" value={product.erp_sku} mono />
            <Field label="Internal SKU" value={product.internal_sku} mono />
            <Field label="EAN" value={product.ean} mono />
            <Field label="PZN" value={product.pzn} mono />
            <Field label="NAN" value={product.nan} mono />
            <Field label="ABDA PZN" value={product.abda_pzn} mono />
          </dl>
        </Section>

        <Section title="Bezeichnungen" icon={FileText}>
          <dl className="grid grid-cols-1 gap-y-3 text-sm">
            <Field label="Name" value={product.name} full />
            <Field label="Kurzname" value={product.name_short} full />
            <Field label="Langname" value={product.name_long} full />
            <Field label="Beschreibung" value={product.description} full />
          </dl>
        </Section>
      </div>

      {/* Row 2: Klassifikation + Compliance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Klassifikation" icon={FolderTree}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="Hersteller" value={product.manufacturer} />
            <Field label="Kategorie" value={product.category} />
            <Field label="Unterkategorie" value={product.subcategory} />
            <Field label="Warengruppe" value={product.warengruppe} />
            <BoolField label="Saisonartikel" value={product.saisonartikel} />
            <BoolField label="Bio-Artikel" value={product.bio_article} />
          </dl>
        </Section>

        <Section title="Compliance" icon={ShieldCheck}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <BoolField label="Arzneimittel" value={product.is_medication} />
            <Field label="Apothekenpflichtig" value={product.pharmacy_required} />
            <Field label="Marktstatus" value={product.market_status} />
            <BoolField label="Pharma" value={product.pharma_flag} />
            <BoolField label="Biozid" value={product.biozid_flag} />
            <BoolField label="Gefahrgut" value={product.dg_flag} />
            <Field label="Herkunftsland" value={product.country_of_origin} />
            <Field
              label="MHD (Tage)"
              value={product.shelf_life_days != null ? String(product.shelf_life_days) : null}
            />
            <Field
              label="MwSt."
              value={product.vat_rate != null ? `${product.vat_rate}%` : null}
            />
          </dl>
        </Section>
      </div>

      {/* Row 3: Verpackung & Maße + Gewichte */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Verpackung & Maße" icon={Box}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="Einheit" value={product.unit_size} />
            <Field label="Normgröße" value={product.norm_size} />
            <Field
              label="Inhalt"
              value={
                product.size_value != null
                  ? `${product.size_value}${product.size_unit ? ` ${product.size_unit}` : ""}`
                  : null
              }
            />
            <Field
              label="Stück / VE"
              value={product.units_per_ve != null ? String(product.units_per_ve) : null}
            />
            <Field
              label="VE / Lage"
              value={product.ve_per_layer != null ? String(product.ve_per_layer) : null}
            />
            <Field
              label="Lagen / Palette"
              value={product.layers_per_palette != null ? String(product.layers_per_palette) : null}
            />
            <Field
              label="VE / Palette"
              value={product.ve_per_palette != null ? String(product.ve_per_palette) : null}
            />
            <Field
              label="Breite"
              value={product.width_mm != null ? `${product.width_mm} mm` : null}
            />
            <Field
              label="Höhe"
              value={product.height_mm != null ? `${product.height_mm} mm` : null}
            />
            <Field
              label="Länge"
              value={product.length_mm != null ? `${product.length_mm} mm` : null}
            />
          </dl>
        </Section>

        <Section title="Gewichte" icon={Weight}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field
              label="Einzelstück"
              value={
                (product.weight_piece_g ?? product.weight_g) != null
                  ? `${product.weight_piece_g ?? product.weight_g} g`
                  : null
              }
            />
            <Field
              label="VE"
              value={product.weight_ve_g != null ? `${product.weight_ve_g} g` : null}
            />
            <Field
              label="Palette"
              value={product.weight_palette_g != null ? `${product.weight_palette_g} g` : null}
            />
          </dl>
        </Section>
      </div>

      {/* Freigabe-Status */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Freigabe-Status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border p-4 text-center">
            <div className="text-xs text-muted-foreground">ERP Export</div>
            <div
              className={`mt-1 text-lg font-bold ${product.release_to_erp ? "text-emerald-500" : "text-muted-foreground"}`}
            >
              {product.release_to_erp ? "Freigegeben" : "Gesperrt"}
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <div className="text-xs text-muted-foreground">Channel Sync</div>
            <div
              className={`mt-1 text-lg font-bold ${product.release_to_channel ? "text-emerald-500" : "text-muted-foreground"}`}
            >
              {product.release_to_channel ? "Freigegeben" : "Gesperrt"}
            </div>
          </div>
        </div>
      </div>

      {/* EANs */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Barcode className="h-5 w-5" />
            EANs ({product.eans.length})
          </h2>
        </div>
        {product.eans.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Keine EANs vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Typ</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">EAN</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Primär</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quelle</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gültig ab</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gültig bis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.eans.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2">{e.ean_type}</td>
                    <td className="px-4 py-2 font-mono text-xs">{e.ean_value}</td>
                    <td className="px-4 py-2">{e.is_primary ? "Ja" : "Nein"}</td>
                    <td className="px-4 py-2">{e.source || "–"}</td>
                    <td className="px-4 py-2">{e.valid_from || "–"}</td>
                    <td className="px-4 py-2">{e.valid_to || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preise */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Euro className="h-5 w-5" />
            Preise ({product.prices.length})
          </h2>
        </div>
        {product.prices.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Keine Preise vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Typ</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Preis</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Währung</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quelle</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gültig ab</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gültig bis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.prices.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.price_type}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{p.price.toFixed(4)}</td>
                    <td className="px-4 py-2">{p.currency}</td>
                    <td className="px-4 py-2">{p.source}</td>
                    <td className="px-4 py-2">{p.valid_from || "–"}</td>
                    <td className="px-4 py-2">{p.valid_to || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HS-Codes */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-5 w-5" />
            HS-Codes ({product.hs_codes.length})
          </h2>
        </div>
        {product.hs_codes.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Keine HS-Codes vorhanden
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Land</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">HS-Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.hs_codes.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2">{h.country}</td>
                    <td className="px-4 py-2 font-mono text-xs">{h.hs_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lieferanten */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Truck className="h-5 w-5" />
            Lieferanten ({product.suppliers.length})
          </h2>
        </div>
        {product.suppliers.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Keine Lieferanten zugeordnet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {product.suppliers.map((sp) => (
              <div key={sp.id} className="flex items-center justify-between px-6 py-3">
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
                  {sp.abda_ek != null && (
                    <span className="text-muted-foreground">
                      ABDA EK: {sp.abda_ek.toFixed(2)}
                    </span>
                  )}
                  {sp.purchase_price != null && (
                    <span className="ml-3 text-muted-foreground">
                      EK: {sp.purchase_price.toFixed(2)}
                    </span>
                  )}
                  {sp.retail_price != null && (
                    <span className="ml-3 text-muted-foreground">
                      VK: {sp.retail_price.toFixed(2)}
                    </span>
                  )}
                  {sp.discount_source && (
                    <span className="ml-2 text-xs text-muted-foreground/60">
                      ({sp.discount_source.replace("_", " ")})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event-Historie */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5" />
            Event-Historie
          </h2>
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

/* ── Helper Components ─────────────────────────────────────────── */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  full?: boolean;
}) {
  if (full) {
    return (
      <div>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className={`font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`}>
          {value || "–"}
        </dd>
      </div>
    );
  }
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {value || "–"}
      </dd>
    </>
  );
}

function BoolField({
  label,
  value,
}: {
  label: string;
  value: boolean | null | undefined;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">
        {value == null ? "–" : value ? "Ja" : "Nein"}
      </dd>
    </>
  );
}
