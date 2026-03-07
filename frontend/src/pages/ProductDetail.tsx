import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  api,
  type ProductDetail as ProductDetailType,
  type ProductHsCodeInfo,
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
  Pencil,
  Lock,
  LockOpen,
  Loader2,
  Plus,
  Trash2,
  X,
  Save,
  Check,
} from "lucide-react";

const INPUT_CLS =
  "flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const COUNTRIES = ["DE", "KR", "US", "CN", "JP", "GB", "FR", "IT", "NL", "CH"];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Section edit states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  // HS-Code add state
  const [addingHsCode, setAddingHsCode] = useState(false);
  const [newHsCountry, setNewHsCountry] = useState("KR");
  const [newHsCode, setNewHsCode] = useState("");
  const [hsCodeSaving, setHsCodeSaving] = useState(false);

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

  const locks = product.field_locks || {};

  // Start editing a section — populate editData with current values
  function startEdit(section: string, fields: string[]) {
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      data[f] = (product as unknown as Record<string, unknown>)[f];
    }
    setEditData(data);
    setEditingSection(section);
  }

  function cancelEdit() {
    setEditingSection(null);
    setEditData({});
  }

  async function saveSection() {
    if (!product) return;
    setSaving(true);
    try {
      const updated = await api.updateProduct(product.id, editData as Partial<ProductDetailType>);
      // Refresh full product to get updated hs_codes, suppliers etc.
      const full = await api.getProduct(product.id);
      setProduct(full);
      setEditingSection(null);
      setEditData({});
      // Refresh events
      const ev = await api.getAggregateEvents("product", updated.product_id);
      setEvents(ev.items);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function toggleLock(field: string) {
    if (!product) return;
    const newLocked = !locks[field];
    try {
      const updated = await api.updateFieldLocks(product.id, { [field]: newLocked });
      setProduct({ ...product, field_locks: updated });
    } catch (e) {
      console.error(e);
    }
  }

  // HS-Code handlers
  async function handleAddHsCode() {
    if (!product || !newHsCode.trim()) return;
    setHsCodeSaving(true);
    try {
      const created = await api.createHsCode(product.id, {
        country: newHsCountry,
        hs_code: newHsCode.trim(),
      });
      setProduct({
        ...product,
        hs_codes: [...product.hs_codes, created],
      });
      setAddingHsCode(false);
      setNewHsCode("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Fehler beim Anlegen");
    } finally {
      setHsCodeSaving(false);
    }
  }

  async function handleDeleteHsCode(hc: ProductHsCodeInfo) {
    if (!product || !confirm(`HS-Code ${hc.country} "${hc.hs_code}" wirklich löschen?`)) return;
    try {
      await api.deleteHsCode(product.id, hc.id);
      setProduct({
        ...product,
        hs_codes: product.hs_codes.filter((h) => h.id !== hc.id),
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleHsLock(hc: ProductHsCodeInfo) {
    if (!product) return;
    try {
      const updated = await api.updateHsCode(product.id, hc.id, {
        is_locked: !hc.is_locked,
      });
      setProduct({
        ...product,
        hs_codes: product.hs_codes.map((h) => (h.id === hc.id ? updated : h)),
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Helper: editable or display field
  function EField({
    label,
    field,
    mono,
    full,
    type = "text",
  }: {
    label: string;
    field: string;
    mono?: boolean;
    full?: boolean;
    type?: "text" | "number";
  }) {
    const isEditing = editingSection !== null && field in editData;
    const value = (product as unknown as Record<string, unknown>)[field];
    const displayValue = value != null ? String(value) : null;
    const isLocked = !!locks[field];

    const labelEl = (
      <dt className="flex items-center gap-1 text-muted-foreground">
        {label}
        {canEdit && (
          <button
            onClick={() => toggleLock(field)}
            title={isLocked ? "Entsperren — Import darf überschreiben" : "Sperren — Import-geschützt"}
            className="ml-0.5 opacity-40 transition-opacity hover:opacity-100"
          >
            {isLocked ? (
              <Lock className="h-3 w-3 text-amber-500" />
            ) : (
              <LockOpen className="h-3 w-3" />
            )}
          </button>
        )}
      </dt>
    );

    const valueEl = isEditing ? (
      <dd>
        <input
          type={type}
          value={editData[field] != null ? String(editData[field]) : ""}
          onChange={(e) =>
            setEditData({
              ...editData,
              [field]:
                type === "number"
                  ? e.target.value === "" ? null : Number(e.target.value)
                  : e.target.value || null,
            })
          }
          className={INPUT_CLS}
        />
      </dd>
    ) : (
      <dd className={`font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {displayValue || "–"}
      </dd>
    );

    if (full) {
      return (
        <div>
          {labelEl}
          {valueEl}
        </div>
      );
    }
    return (
      <>
        {labelEl}
        {valueEl}
      </>
    );
  }

  // Helper: bool field
  function EBoolField({ label, field }: { label: string; field: string }) {
    const isEditing = editingSection !== null && field in editData;
    const value = (product as unknown as Record<string, unknown>)[field] as boolean | null | undefined;
    const isLocked = !!locks[field];

    return (
      <>
        <dt className="flex items-center gap-1 text-muted-foreground">
          {label}
          {canEdit && (
            <button
              onClick={() => toggleLock(field)}
              title={isLocked ? "Entsperren" : "Sperren"}
              className="ml-0.5 opacity-40 transition-opacity hover:opacity-100"
            >
              {isLocked ? (
                <Lock className="h-3 w-3 text-amber-500" />
              ) : (
                <LockOpen className="h-3 w-3" />
              )}
            </button>
          )}
        </dt>
        <dd>
          {isEditing ? (
            <select
              value={editData[field] == null ? "" : editData[field] ? "true" : "false"}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  [field]: e.target.value === "" ? null : e.target.value === "true",
                })
              }
              className={INPUT_CLS}
            >
              <option value="">–</option>
              <option value="true">Ja</option>
              <option value="false">Nein</option>
            </select>
          ) : (
            <span className="font-medium text-foreground">
              {value == null ? "–" : value ? "Ja" : "Nein"}
            </span>
          )}
        </dd>
      </>
    );
  }

  // Section header with edit button
  function SectionHeader({
    title,
    icon: Icon,
    section,
    fields,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    section: string;
    fields: string[];
  }) {
    const isEditing = editingSection === section;
    return (
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-5 w-5" />
          {title}
        </h2>
        {canEdit && !isEditing && editingSection === null && (
          <button
            onClick={() => startEdit(section, fields)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
            Bearbeiten
          </button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={saveSection}
              disabled={saving}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Speichern
            </button>
            <button
              onClick={cancelEdit}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs hover:bg-accent"
            >
              <X className="h-3 w-3" />
              Abbrechen
            </button>
          </div>
        )}
      </div>
    );
  }

  const identityFields = ["erp_sku", "internal_sku", "ean", "pzn", "nan", "abda_pzn"];
  const nameFields = ["name", "name_short", "name_long", "description"];
  const classificationFields = ["manufacturer", "category", "subcategory", "warengruppe", "saisonartikel", "bio_article"];
  const complianceFields = [
    "is_medication", "pharmacy_required", "market_status",
    "pharma_flag", "biozid_flag", "dg_flag",
    "country_of_origin", "shelf_life_days", "vat_rate",
  ];
  const packagingFields = [
    "unit_size", "norm_size", "size_value", "size_unit",
    "units_per_ve", "ve_per_layer", "layers_per_palette", "ve_per_palette",
    "piece_width_mm", "piece_height_mm", "piece_length_mm",
    "case_width_mm", "case_height_mm", "case_length_mm",
  ];
  const weightFields = ["weight_piece_g", "weight_ve_g", "weight_palette_g"];
  const releaseFields = ["release_to_erp", "release_to_channel"];

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
            {Object.keys(locks).length > 0 && (
              <span className="ml-2 text-xs text-amber-500">
                <Lock className="mr-0.5 inline h-3 w-3" />
                {Object.keys(locks).length} gesperrt
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Lieferanten (read-only) */}
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

      {/* Identifikation + Bezeichnungen */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <SectionHeader title="Identifikation" icon={Fingerprint} section="identity" fields={identityFields} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <EField label="ERP SKU" field="erp_sku" mono />
            <EField label="Internal SKU" field="internal_sku" mono />
            <EField label="EAN" field="ean" mono />
            <EField label="PZN" field="pzn" mono />
            <EField label="NAN" field="nan" mono />
            <EField label="ABDA PZN" field="abda_pzn" mono />
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <SectionHeader title="Bezeichnungen" icon={FileText} section="names" fields={nameFields} />
          <dl className="grid grid-cols-1 gap-y-3 text-sm">
            <EField label="Name" field="name" full />
            <EField label="Kurzname" field="name_short" full />
            <EField label="Langname" field="name_long" full />
            <EField label="Beschreibung" field="description" full />
          </dl>
        </div>
      </div>

      {/* Klassifikation + Compliance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <SectionHeader title="Klassifikation" icon={FolderTree} section="classification" fields={classificationFields} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <EField label="Hersteller" field="manufacturer" />
            <EField label="Kategorie" field="category" />
            <EField label="Unterkategorie" field="subcategory" />
            <EField label="Warengruppe" field="warengruppe" />
            <EBoolField label="Saisonartikel" field="saisonartikel" />
            <EBoolField label="Bio-Artikel" field="bio_article" />
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <SectionHeader title="Compliance" icon={ShieldCheck} section="compliance" fields={complianceFields} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <EBoolField label="Arzneimittel" field="is_medication" />
            <EField label="Apothekenpflichtig" field="pharmacy_required" />
            <EField label="Marktstatus" field="market_status" />
            <EBoolField label="Pharma" field="pharma_flag" />
            <EBoolField label="Biozid" field="biozid_flag" />
            <EBoolField label="Gefahrgut" field="dg_flag" />
            <EField label="Herkunftsland" field="country_of_origin" />
            <EField label="MHD (Tage)" field="shelf_life_days" type="number" />
            <EField label="MwSt. %" field="vat_rate" type="number" />
          </dl>
        </div>
      </div>

      {/* Verpackung & Maße + Gewichte */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <SectionHeader title="Verpackung & Maße" icon={Box} section="packaging" fields={packagingFields} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <EField label="Einheit" field="unit_size" />
            <EField label="Normgröße" field="norm_size" />
            <EField label="Inhalt" field="size_value" type="number" />
            <EField label="Inhalts-Einheit" field="size_unit" />
            <EField label="Stück / VE" field="units_per_ve" type="number" />
            <EField label="VE / Lage" field="ve_per_layer" type="number" />
            <EField label="Lagen / Palette" field="layers_per_palette" type="number" />
            <EField label="VE / Palette" field="ve_per_palette" type="number" />
            <EField label="Stück B (mm)" field="piece_width_mm" type="number" />
            <EField label="Stück H (mm)" field="piece_height_mm" type="number" />
            <EField label="Stück L (mm)" field="piece_length_mm" type="number" />
            <EField label="VE B (mm)" field="case_width_mm" type="number" />
            <EField label="VE H (mm)" field="case_height_mm" type="number" />
            <EField label="VE L (mm)" field="case_length_mm" type="number" />
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <SectionHeader title="Gewichte" icon={Weight} section="weights" fields={weightFields} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <EField label="Einzelstück (g)" field="weight_piece_g" type="number" />
            <EField label="VE (g)" field="weight_ve_g" type="number" />
            <EField label="Palette (g)" field="weight_palette_g" type="number" />
          </dl>
        </div>
      </div>

      {/* Freigabe-Status */}
      <div className="rounded-xl border border-border bg-card p-6">
        <SectionHeader title="Freigabe-Status" icon={Check} section="release" fields={releaseFields} />
        {editingSection === "release" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="text-xs text-muted-foreground">ERP Export</label>
              <select
                value={editData.release_to_erp ? "true" : "false"}
                onChange={(e) => setEditData({ ...editData, release_to_erp: e.target.value === "true" })}
                className={INPUT_CLS + " mt-1"}
              >
                <option value="false">Gesperrt</option>
                <option value="true">Freigegeben</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Channel Sync</label>
              <select
                value={editData.release_to_channel ? "true" : "false"}
                onChange={(e) => setEditData({ ...editData, release_to_channel: e.target.value === "true" })}
                className={INPUT_CLS + " mt-1"}
              >
                <option value="false">Gesperrt</option>
                <option value="true">Freigegeben</option>
              </select>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* EANs (read-only) */}
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

      {/* Preise (read-only) */}
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

      {/* HS-Codes (CRUD) */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-5 w-5" />
            HS-Codes ({product.hs_codes.length})
          </h2>
          {canEdit && !addingHsCode && (
            <button
              onClick={() => setAddingHsCode(true)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Hinzufügen
            </button>
          )}
        </div>

        {/* Add row */}
        {addingHsCode && (
          <div className="flex items-center gap-3 border-b border-border px-6 py-3">
            <select
              value={newHsCountry}
              onChange={(e) => setNewHsCountry(e.target.value)}
              className={INPUT_CLS + " w-24"}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="z.B. 3004.10.00"
              value={newHsCode}
              onChange={(e) => setNewHsCode(e.target.value)}
              className={INPUT_CLS + " flex-1"}
              onKeyDown={(e) => e.key === "Enter" && handleAddHsCode()}
            />
            <button
              onClick={handleAddHsCode}
              disabled={hsCodeSaving || !newHsCode.trim()}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {hsCodeSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Anlegen
            </button>
            <button
              onClick={() => { setAddingHsCode(false); setNewHsCode(""); }}
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-2 hover:bg-accent"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {product.hs_codes.length === 0 && !addingHsCode ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Keine HS-Codes vorhanden
          </div>
        ) : (
          product.hs_codes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Land</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">HS-Code</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quelle</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    {canEdit && (
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aktionen</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {product.hs_codes.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2">{h.country}</td>
                      <td className="px-4 py-2 font-mono text-xs">{h.hs_code}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{h.source || "–"}</td>
                      <td className="px-4 py-2">
                        {canEdit ? (
                          <button
                            onClick={() => handleToggleHsLock(h)}
                            className="flex items-center gap-1 text-xs"
                            title={h.is_locked ? "Entsperren" : "Sperren"}
                          >
                            {h.is_locked ? (
                              <>
                                <Lock className="h-3 w-3 text-amber-500" />
                                <span className="text-amber-500">Gesperrt</span>
                              </>
                            ) : (
                              <>
                                <LockOpen className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Offen</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs">
                            {h.is_locked ? "Gesperrt" : "Offen"}
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleDeleteHsCode(h)}
                            className="text-muted-foreground transition-colors hover:text-red-500"
                            title="Löschen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
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
