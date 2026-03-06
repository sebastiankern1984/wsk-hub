import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api,
  type Supplier,
  type DiscountRule,
  type RecalculationResult,
  type HubFieldInfo,
} from "@/api/client";
import {
  ArrowLeft,
  Truck,
  Percent,
  Plus,
  Trash2,
  Pencil,
  Upload,
  RefreshCw,
  Loader2,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Download,
  Columns,
  Wand2,
  Save,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Tab = "overview" | "mappings" | "minderspannen";

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!id) return;
    api
      .getSuppliers()
      .then((list) => {
        const s = list.find((s) => s.id === parseInt(id));
        setSupplier(s || null);
      })
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

  if (!supplier) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Lieferant nicht gefunden
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/connectors/suppliers")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            {supplier.type || "Kein Typ"} · {supplier.product_count} Produkte ·
            Default-Rabatt: {supplier.discount_percent}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("overview")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "overview"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Übersicht
          </span>
        </button>
        <button
          onClick={() => setTab("mappings")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "mappings"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Columns className="h-4 w-4" />
            Import-Mapping
          </span>
        </button>
        <button
          onClick={() => setTab("minderspannen")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "minderspannen"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Minderspannen
          </span>
        </button>
      </div>

      {tab === "overview" ? (
        <OverviewTab supplier={supplier} setSupplier={setSupplier} />
      ) : tab === "mappings" ? (
        <MappingTab supplierId={supplier.id} supplierName={supplier.name} />
      ) : (
        <MinderspannenTab supplierId={supplier.id} />
      )}
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({
  supplier,
  setSupplier,
}: {
  supplier: Supplier;
  setSupplier: (s: Supplier) => void;
}) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(supplier.name);
  const [type, setType] = useState(supplier.type || "");
  const [discount, setDiscount] = useState(String(supplier.discount_percent));
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<RecalculationResult | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateSupplier(supplier.id, {
        name: name.trim(),
        type: type.trim() || null,
        discount_percent: parseFloat(discount) || 0,
      });
      setSupplier(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const result = await api.recalculateSupplier(supplier.id);
      setRecalcResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Stammdaten</h2>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
            >
              <Pencil className="h-3.5 w-3.5" />
              Bearbeiten
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Typ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Kein Typ</option>
                  <option value="pharma_grosshandel">Pharma-Grosshandel</option>
                  <option value="direktlieferant">Direktlieferant</option>
                  <option value="sonstiger">Sonstiger</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Default-Rabatt (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Speichern
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(supplier.name);
                  setType(supplier.type || "");
                  setDiscount(String(supplier.discount_percent));
                }}
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-accent"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{supplier.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Typ</dt>
              <dd className="font-medium">{supplier.type || "–"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Default-Rabatt</dt>
              <dd className="font-medium">{supplier.discount_percent}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Produkte</dt>
              <dd className="font-medium">{supplier.product_count}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Recalculate */}
      {canEdit && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Preise neu berechnen</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Berechnet alle Pharma-Produkt-Preise (purchase_price) basierend auf ABDA
            apo_ek und den Rabatt-Regeln (Default-Rabatt + Minderspannen).
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {recalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Alle Preise neu berechnen
            </button>
            {recalcResult && (
              <span className="inline-flex items-center gap-2 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                {recalcResult.linked > 0 && `${recalcResult.linked} verknüpft, `}
                {recalcResult.updated} von {recalcResult.total} aktualisiert
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mapping Tab ── */
const CATEGORY_LABELS: Record<string, string> = {
  identifikation: "Identifikation",
  artikeldaten: "Artikeldaten",
  preis: "Preise",
  masse: "Maße & Gewicht",
  logistik: "Logistik",
  sonstiges: "Sonstiges",
};

function MappingTab({
  supplierId,
  supplierName,
}: {
  supplierId: number;
  supplierName: string;
}) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const [hubFields, setHubFields] = useState<HubFieldInfo[]>([]);
  const [mappings, setMappings] = useState<
    { csv_column: string; hub_field: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Group hub fields by category for grouped dropdown
  const fieldsByCategory = hubFields.reduce<Record<string, HubFieldInfo[]>>(
    (acc, f) => {
      (acc[f.category] = acc[f.category] || []).push(f);
      return acc;
    },
    {}
  );

  useEffect(() => {
    Promise.all([
      api.getHubFields(),
      api.getColumnMappings(supplierId),
    ])
      .then(([fields, existing]) => {
        setHubFields(fields);
        setMappings(
          existing.map((m) => ({
            csv_column: m.csv_column,
            hub_field: m.hub_field,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [supplierId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const result = await api.saveColumnMappings(supplierId, mappings);
      setMappings(
        result.map((m) => ({ csv_column: m.csv_column, hub_field: m.hub_field }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRow = () => {
    setMappings([...mappings, { csv_column: "", hub_field: "" }]);
  };

  const handleRemoveRow = (idx: number) => {
    setMappings(mappings.filter((_, i) => i !== idx));
  };

  const handleChange = (
    idx: number,
    field: "csv_column" | "hub_field",
    value: string
  ) => {
    setMappings(
      mappings.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleAutoDetect = async (file: File) => {
    setDetecting(true);
    try {
      // Read headers from file
      const text = await file.text();
      let headers: string[] = [];

      const ext = file.name.toLowerCase().split(".").pop();
      if (ext === "csv") {
        // CSV: first line = headers (semicolon separated)
        const firstLine = text.split("\n")[0] || "";
        headers = firstLine
          .split(";")
          .map((h) => h.trim().replace(/^"|"$/g, ""));
      } else {
        // For Excel we send the file to backend to parse headers
        // Simplified: just read first line as text (user should use CSV for auto-detect)
        const firstLine = text.split("\n")[0] || "";
        headers = firstLine
          .split(/[;\t,]/)
          .map((h) => h.trim().replace(/^"|"$/g, ""));
      }

      headers = headers.filter((h) => h.length > 0);

      if (headers.length === 0) {
        alert("Keine Spaltenüberschriften gefunden");
        return;
      }

      const results = await api.autoDetectMappings(supplierId, headers);
      // Apply detected mappings
      setMappings(
        results.map((r) => ({
          csv_column: r.csv_column,
          hub_field: r.hub_field || "",
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setDetecting(false);
    }
  };

  const handleDownloadTemplate = (format: "csv" | "xlsx") => {
    const token = localStorage.getItem("token");
    const url = mappings.length > 0
      ? `/api/suppliers/${supplierId}/import-template?format=${format}`
      : `/api/imports/supplier/template?format=${format}`;
    // Trigger download via fetch
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `vorlage-${supplierName.toLowerCase().replace(/\s+/g, "-")}.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Laden...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {canEdit && (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Speichern
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                Gespeichert
              </span>
            )}
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
              {detecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5" />
              )}
              Auto-Erkennung
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAutoDetect(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={handleAddRow}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              Zeile hinzufügen
            </button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => handleDownloadTemplate("csv")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            CSV-Vorlage
          </button>
          <button
            onClick={() => handleDownloadTemplate("xlsx")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            Excel-Vorlage
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p>
              Ordne die CSV/Excel-Spalten deiner Import-Datei den Hub-Feldern
              zu. Bei <strong>Auto-Erkennung</strong> wird eine Datei
              hochgeladen und die Spalten automatisch erkannt.
            </p>
            <p className="mt-1">
              Ohne Mapping wird beim Import das{" "}
              <strong>Standard-Format</strong> (Hub-Feld-Labels als
              Spaltennamen) verwendet.
            </p>
          </div>
        </div>
      </div>

      {/* Mapping table */}
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                CSV/Excel-Spalte
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                → Hub-Feld
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">
                Typ
              </th>
              {canEdit && (
                <th className="px-4 py-3 w-16" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mappings.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 4 : 3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Kein Mapping konfiguriert. Nutze „Auto-Erkennung" oder füge
                  Zeilen manuell hinzu.
                </td>
              </tr>
            ) : (
              mappings.map((m, idx) => {
                const matchedField = hubFields.find(
                  (f) => f.key === m.hub_field
                );
                return (
                  <tr
                    key={idx}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-2">
                      {canEdit ? (
                        <input
                          type="text"
                          value={m.csv_column}
                          onChange={(e) =>
                            handleChange(idx, "csv_column", e.target.value)
                          }
                          placeholder="Spaltenname aus Datei"
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      ) : (
                        <span className="font-mono text-xs">
                          {m.csv_column}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {canEdit ? (
                        <select
                          value={m.hub_field}
                          onChange={(e) =>
                            handleChange(idx, "hub_field", e.target.value)
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">– Nicht zugeordnet –</option>
                          {Object.entries(fieldsByCategory).map(
                            ([cat, fields]) => (
                              <optgroup
                                key={cat}
                                label={CATEGORY_LABELS[cat] || cat}
                              >
                                {fields.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label} ({f.key})
                                  </option>
                                ))}
                              </optgroup>
                            )
                          )}
                        </select>
                      ) : (
                        <span>
                          {matchedField
                            ? `${matchedField.label} (${matchedField.key})`
                            : m.hub_field}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {matchedField?.field_type || "–"}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {mappings.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {mappings.filter((m) => m.hub_field).length} von {mappings.length}{" "}
          Spalten zugeordnet
        </p>
      )}
    </div>
  );
}

/* ── Minderspannen Tab ── */
function MinderspannenTab({ supplierId }: { supplierId: number }) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPercent, setEditPercent] = useState("");
  const [editNote, setEditNote] = useState("");
  const [ruleCount, setRuleCount] = useState(0);

  // CSV import
  const [uploading, setUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const loadRules = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (scopeFilter) params.set("scope", scopeFilter);
    params.set("limit", "200");
    api
      .getDiscountRules(supplierId, params)
      .then(setRules)
      .catch(console.error)
      .finally(() => setLoading(false));
    api.getDiscountRuleCount(supplierId).then((r) => setRuleCount(r.count));
  }, [supplierId, search, scopeFilter]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleDelete = async (ruleId: number) => {
    await api.deleteDiscountRule(supplierId, ruleId);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    setRuleCount((c) => c - 1);
  };

  const handleEditSave = async (ruleId: number) => {
    const data: { discount_percent?: number; note?: string } = {};
    if (editPercent) data.discount_percent = parseFloat(editPercent);
    if (editNote !== undefined) data.note = editNote;
    const updated = await api.updateDiscountRule(supplierId, ruleId, data);
    setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    setEditingId(null);
  };

  const handleCsvUpload = async (file: File) => {
    setUploading(true);
    setCsvResult(null);
    try {
      const result = await api.importDiscountRulesCsv(supplierId, file);
      setCsvResult(result);
      loadRules();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="PZN oder Hersteller suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Alle Typen</option>
          <option value="pzn">PZN</option>
          <option value="manufacturer">Hersteller</option>
        </select>
        <span className="text-xs text-muted-foreground">{ruleCount} Regeln</span>
        <div className="ml-auto flex gap-2">
          {canEdit && (
            <>
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
                <Upload className="h-3.5 w-3.5" />
                CSV Import
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCsvUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Neue Regel
              </button>
            </>
          )}
        </div>
      </div>

      {/* CSV import result */}
      {uploading && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          CSV wird importiert...
        </div>
      )}
      {csvResult && (
        <div className="rounded-lg border border-border bg-card p-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-emerald-500">
              {csvResult.created} erstellt
            </span>
            <span className="text-blue-500">{csvResult.updated} aktualisiert</span>
            {csvResult.skipped > 0 && (
              <span className="text-amber-500">
                {csvResult.skipped} übersprungen
              </span>
            )}
            <button
              onClick={() => setCsvResult(null)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {csvResult.errors.length > 0 && (
            <div className="mt-2 space-y-1 text-xs text-destructive">
              {csvResult.errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create form */}
      {showCreate && <CreateRuleForm supplierId={supplierId} onCreated={(rule) => {
        setRules((prev) => [rule, ...prev]);
        setRuleCount((c) => c + 1);
        setShowCreate(false);
      }} onCancel={() => setShowCreate(false)} />}

      {/* Rules table */}
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Typ
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                PZN / Hersteller
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Rabatt %
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Notiz
              </th>
              {canEdit && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                  Aktionen
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={canEdit ? 5 : 4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Laden...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 5 : 4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Keine Minderspannen-Regeln vorhanden
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr
                  key={rule.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        rule.scope === "pzn"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-purple-500/10 text-purple-500"
                      }`}
                    >
                      {rule.scope === "pzn" ? "PZN" : "Hersteller"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {rule.pzn || rule.manufacturer_name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === rule.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editPercent}
                        onChange={(e) => setEditPercent(e.target.value)}
                        className="h-7 w-20 rounded border border-input bg-background px-2 text-right text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">
                        {rule.discount_percent}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {editingId === rule.id ? (
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="h-7 w-full rounded border border-input bg-background px-2 text-sm"
                        placeholder="Notiz"
                      />
                    ) : (
                      rule.note || "–"
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      {editingId === rule.id ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditSave(rule.id)}
                            className="inline-flex h-7 items-center rounded bg-primary px-2 text-xs text-primary-foreground hover:bg-primary/90"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex h-7 items-center rounded border border-input px-2 text-xs hover:bg-accent"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingId(rule.id);
                              setEditPercent(String(rule.discount_percent));
                              setEditNote(rule.note || "");
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CSV format info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">CSV-Import Format</h3>
        </div>
        <code className="block rounded bg-muted p-3 text-xs font-mono text-muted-foreground">
          scope;value;discount_percent;note
          {"\n"}pzn;01234567;3.50;Minderspanne Aspirin
          {"\n"}manufacturer;Bayer Vital GmbH;4.00;Rahmenvertrag 2024
        </code>
      </div>
    </div>
  );
}

/* ── Create Rule Form ── */
function CreateRuleForm({
  supplierId,
  onCreated,
  onCancel,
}: {
  supplierId: number;
  onCreated: (rule: DiscountRule) => void;
  onCancel: () => void;
}) {
  const [scope, setScope] = useState<"pzn" | "manufacturer">("pzn");
  const [value, setValue] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!value.trim() || !discountPercent) return;
    setSaving(true);
    setError(null);
    try {
      const rule = await api.createDiscountRule(supplierId, {
        scope,
        pzn: scope === "pzn" ? value.trim() : undefined,
        manufacturer_name: scope === "manufacturer" ? value.trim() : undefined,
        discount_percent: parseFloat(discountPercent),
        note: note.trim() || undefined,
      });
      onCreated(rule);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as "pzn" | "manufacturer")}
          className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="pzn">PZN</option>
          <option value="manufacturer">Hersteller</option>
        </select>
        <input
          type="text"
          placeholder={scope === "pzn" ? "PZN eingeben" : "Herstellername eingeben"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex h-9 min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          autoFocus
        />
        <input
          type="number"
          step="0.01"
          placeholder="Rabatt %"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className="flex h-9 w-28 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          type="text"
          placeholder="Notiz (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex h-9 w-48 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={handleSubmit}
          disabled={saving || !value.trim() || !discountPercent}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Erstellen
        </button>
        <button
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-accent"
        >
          Abbrechen
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-destructive">{error}</div>
      )}
    </div>
  );
}
