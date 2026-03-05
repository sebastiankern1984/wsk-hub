import { useState, useEffect, useCallback, useRef } from "react";
import {
  api,
  type AbdaImportLog,
  type AbdaStats,
  type AbdaLookupResult,
  type AbdaFilterParams,
} from "@/api/client";
import {
  Upload,
  FileSpreadsheet,
  Clock,
  Loader2,
  Search,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Tab = "import" | "suche";

export default function AbdaConnector() {
  const [tab, setTab] = useState<Tab>("import");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ABDA Connector</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("import")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "import"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </span>
        </button>
        <button
          onClick={() => setTab("suche")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "suche"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Suche &amp; Hinzufügen
          </span>
        </button>
      </div>

      {tab === "import" ? <ImportTab /> : <SucheTab />}
    </div>
  );
}

/* ── Import Tab ── */
function ImportTab() {
  const [imports, setImports] = useState<AbdaImportLog[]>([]);
  const [stats, setStats] = useState<AbdaStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    api.getAbdaImports().then(setImports).catch(console.error);
    api.getAbdaStats().then(setStats).catch(console.error);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const running = imports.find((i) => i.status === "running" || i.status === "pending");
    if (!running) return;
    const interval = setInterval(() => loadData(), 3000);
    return () => clearInterval(interval);
  }, [imports, loadData]);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      await api.uploadAbdaExcel(file);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      handleUpload(file);
    } else {
      setError("Nur Excel-Dateien (.xlsx, .xls) erlaubt");
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-500/10 text-green-500",
      running: "bg-blue-500/10 text-blue-500",
      pending: "bg-yellow-500/10 text-yellow-500",
      failed: "bg-red-500/10 text-red-500",
    };
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-secondary text-secondary-foreground"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ABDA Artikel</span>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {stats?.total_articles.toLocaleString("de-DE") ?? "–"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Letzter Import</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-sm font-medium text-foreground">
            {stats?.last_import_date
              ? new Date(stats.last_import_date).toLocaleString("de-DE")
              : "–"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Imports gesamt</span>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {stats?.total_imports ?? "–"}
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-muted-foreground"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground" />
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          {uploading ? "Wird hochgeladen..." : "Excel-Datei hierher ziehen oder"}
        </p>
        {!uploading && (
          <label className="mt-2 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Datei auswählen
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileSelect}
            />
          </label>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>

      {/* Import history */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Import-Historie</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Datei
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">
                  Gesamt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">
                  Neu
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">
                  Aktualisiert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {imports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    Noch keine Imports
                  </td>
                </tr>
              ) : (
                imports.map((imp) => (
                  <tr key={imp.id}>
                    <td className="px-6 py-3 text-sm text-foreground">{imp.file_name}</td>
                    <td className="px-6 py-3">{statusBadge(imp.status)}</td>
                    <td className="px-6 py-3 text-right text-sm text-foreground">
                      {imp.record_count_total.toLocaleString("de-DE")}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-green-500">
                      +{imp.record_count_insert.toLocaleString("de-DE")}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-blue-500">
                      {imp.record_count_update.toLocaleString("de-DE")}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {imp.created_at
                        ? new Date(imp.created_at).toLocaleString("de-DE")
                        : "–"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Suche Tab ── */

interface ColumnFilters {
  pzn: string;
  ean: string;
  name: string;
  manufacturer: string;
  apo_ek: string;
  norm_size: string;
}

const EMPTY_FILTERS: ColumnFilters = {
  pzn: "",
  ean: "",
  name: "",
  manufacturer: "",
  apo_ek: "",
  norm_size: "",
};

const PAGE_SIZE = 50;

function SucheTab() {
  const [filters, setFilters] = useState<ColumnFilters>(EMPTY_FILTERS);
  const [results, setResults] = useState<AbdaLookupResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [excludeMedication, setExcludeMedication] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasFilter = Object.values(filters).some((v) => v.length > 0);

  const fetchResults = useCallback(
    async (currentPage: number) => {
      const params: AbdaFilterParams = {
        exclude_medication: excludeMedication,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      };
      if (filters.pzn) params.filter_pzn = filters.pzn;
      if (filters.ean) params.filter_ean = filters.ean;
      if (filters.name) params.filter_name = filters.name;
      if (filters.manufacturer) params.filter_manufacturer = filters.manufacturer;
      if (filters.apo_ek) params.filter_apo_ek = filters.apo_ek;
      if (filters.norm_size) params.filter_norm_size = filters.norm_size;

      setLoading(true);
      try {
        const data = await api.lookupAbdaFiltered(params);
        setResults(data.items);
        setTotal(data.total);
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Suche fehlgeschlagen",
        });
      } finally {
        setLoading(false);
      }
    },
    [filters, excludeMedication],
  );

  // Debounced filter search
  useEffect(() => {
    if (!hasFilter) {
      setResults([]);
      setTotal(0);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchResults(0);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, excludeMedication]);

  // Page change (no debounce)
  useEffect(() => {
    if (!hasFilter || page === 0) return;
    fetchResults(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const updateFilter = (key: keyof ColumnFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const addToHub = async (pzn: string) => {
    setAdding(pzn);
    setMessage(null);
    try {
      const result = await api.addAbdaToHub(pzn);
      setMessage({
        type: "success",
        text: `${result.name} (PZN ${pzn}) zum Hub hinzugefügt`,
      });
      setResults((prev) =>
        prev.map((r) => (r.pzn === pzn ? { ...r, already_in_hub: true } : r)),
      );
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Fehler beim Hinzufügen",
      });
    } finally {
      setAdding(null);
    }
  };

  const filterInputClass =
    "w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={excludeMedication}
            onChange={(e) => setExcludeMedication(e.target.checked)}
            className="rounded border-border"
          />
          Arzneimittel ausschließen
        </label>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {hasFilter && (
            <span>
              {total.toLocaleString("de-DE")} Treffer
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Grid with filter row */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {/* Column headers */}
              <tr className="border-b border-border">
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                  PZN
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                  EAN
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                  Hersteller
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">
                  Apo EK
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                  Normgr.
                </th>
                <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground">
                  Aktion
                </th>
              </tr>
              {/* Filter row */}
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2">
                  <input
                    type="text"
                    value={filters.pzn}
                    onChange={(e) => updateFilter("pzn", e.target.value)}
                    placeholder="PZN..."
                    className={filterInputClass}
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    value={filters.ean}
                    onChange={(e) => updateFilter("ean", e.target.value)}
                    placeholder="EAN..."
                    className={filterInputClass}
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(e) => updateFilter("name", e.target.value)}
                    placeholder="Name..."
                    className={filterInputClass}
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    value={filters.manufacturer}
                    onChange={(e) => updateFilter("manufacturer", e.target.value)}
                    placeholder="Hersteller..."
                    className={filterInputClass}
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    value={filters.apo_ek}
                    onChange={(e) => updateFilter("apo_ek", e.target.value)}
                    placeholder=">5.00"
                    title="Operatoren: > < >= <= != = (z.B. >5.00)"
                    className={`${filterInputClass} text-right`}
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    value={filters.norm_size}
                    onChange={(e) => updateFilter("norm_size", e.target.value)}
                    placeholder="N1..."
                    className={filterInputClass}
                  />
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!hasFilter ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    Filter eingeben um ABDA-Artikel zu suchen
                  </td>
                </tr>
              ) : results.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    Keine Ergebnisse
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.pzn} className="hover:bg-accent/50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                      {r.pzn}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {r.ean || "–"}
                    </td>
                    <td
                      className="max-w-xs truncate px-3 py-2.5 text-foreground"
                      title={r.name || ""}
                    >
                      {r.name || "–"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {r.manufacturer || "–"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-foreground">
                      {r.apo_ek ? `${r.apo_ek} €` : "–"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {r.norm_size || "–"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {r.already_in_hub ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-500">
                          <Check className="h-3 w-3" /> Im Hub
                        </span>
                      ) : (
                        <button
                          onClick={() => addToHub(r.pzn)}
                          disabled={adding === r.pzn}
                          className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {adding === r.pzn ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Hinzufügen
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-muted-foreground">
              Seite {page + 1} von {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
