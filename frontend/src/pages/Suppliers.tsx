import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Supplier, type SupplierImportLog } from "@/api/client";
import {
  Truck,
  Plus,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Tab = "lieferanten" | "import";

export default function Suppliers() {
  const [tab, setTab] = useState<Tab>("lieferanten");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Lieferanten</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("lieferanten")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "lieferanten"
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
      </div>

      {tab === "lieferanten" ? <ListTab /> : <ImportTab />}
    </div>
  );
}

/* ── List Tab ── */
function ListTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");

  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    api
      .getSuppliers()
      .then(setSuppliers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const supplier = await api.createSupplier({
        name: newName.trim(),
        type: newType.trim() || undefined,
      });
      setSuppliers((prev) =>
        [...prev, supplier].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewName("");
      setNewType("");
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Neuer Lieferant
          </button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            <input
              type="text"
              placeholder="Typ (optional)"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="flex h-9 w-48 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              onClick={handleCreate}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Erstellen
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Typ
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Rabatt
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Produkte
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Laden...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Keine Lieferanten vorhanden
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  onClick={() => navigate(`/connectors/suppliers/${supplier.id}`)}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.type || "–"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {supplier.discount_percent > 0
                      ? `${supplier.discount_percent}%`
                      : "–"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {supplier.product_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Import Tab ── */
function ImportTab() {
  const [imports, setImports] = useState<SupplierImportLog[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImports = useCallback(() => {
    api.getSupplierImports().then(setImports).catch(console.error);
  }, []);

  useEffect(() => {
    loadImports();
  }, [loadImports]);

  // Poll running imports
  useEffect(() => {
    const running = imports.find(
      (i) => i.status === "running" || i.status === "pending"
    );
    if (!running) return;
    const interval = setInterval(() => loadImports(), 3000);
    return () => clearInterval(interval);
  }, [imports, loadImports]);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      await api.uploadSupplierFile(file);
      loadImports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = (format: "csv" | "xlsx") => {
    const token = localStorage.getItem("token");
    fetch(`/api/imports/supplier/template?format=${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `import-vorlage.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Datei wird hochgeladen...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Import-Datei hier ablegen
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV (Semikolon-getrennt) oder Excel (.xlsx)
              </p>
            </div>
            <div className="flex gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Upload className="h-4 w-4" />
                Datei auswählen
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleDownloadTemplate("csv")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs hover:bg-accent"
              >
                <Download className="h-3 w-3" />
                Standard-Vorlage CSV
              </button>
              <button
                onClick={() => handleDownloadTemplate("xlsx")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs hover:bg-accent"
              >
                <Download className="h-3 w-3" />
                Standard-Vorlage Excel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-2">
          Matching-Logik
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
              1
            </span>
            <span>
              <strong className="text-foreground">PZN Match:</strong> Produkt
              existiert im Hub → verknüpfen. In ABDA → auto-erstellen.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">
              2
            </span>
            <span>
              <strong className="text-foreground">EAN/NAN Match:</strong>{" "}
              Bestehendes Produkt über EAN oder NAN finden → verknüpfen.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
              3
            </span>
            <span>
              <strong className="text-foreground">Kein Match:</strong>{" "}
              Skelett-Produkt aus Lieferanten-Daten erstellen → verknüpfen.
            </span>
          </div>
        </div>
      </div>

      {/* Import log table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">Import-Log</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Datei
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Gesamt
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Importiert
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Übersprungen
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Fortschritt
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Datum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {imports.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Noch keine Importe vorhanden
                </td>
              </tr>
            ) : (
              imports.map((imp) => (
                <tr
                  key={imp.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <StatusBadge status={imp.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{imp.filename}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {imp.total_rows.toLocaleString("de-DE")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-500">
                    {imp.imported_rows.toLocaleString("de-DE")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {imp.skipped_rows.toLocaleString("de-DE")}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar
                      processed={imp.processed_rows}
                      total={imp.total_rows}
                      status={imp.status}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {imp.completed_at
                      ? new Date(imp.completed_at).toLocaleString("de-DE")
                      : imp.started_at
                        ? new Date(imp.started_at).toLocaleString("de-DE")
                        : new Date(imp.created_at).toLocaleString("de-DE")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {imports.some((i) => i.error_message) && (
          <div className="border-t border-border px-4 py-3">
            {imports
              .filter((i) => i.error_message)
              .map((i) => (
                <div
                  key={i.id}
                  className="flex items-start gap-2 text-xs text-destructive"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>{i.filename}:</strong> {i.error_message}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
          <CheckCircle2 className="h-3 w-3" />
          Fertig
        </span>
      );
    case "running":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Läuft
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
          <Clock className="h-3 w-3" />
          Wartend
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          <XCircle className="h-3 w-3" />
          Fehler
        </span>
      );
    default:
      return <span className="text-xs text-muted-foreground">{status}</span>;
  }
}

function ProgressBar({
  processed,
  total,
  status,
}: {
  processed: number;
  total: number;
  status: string;
}) {
  if (total === 0) {
    return <span className="text-xs text-muted-foreground">–</span>;
  }
  const pct = Math.round((processed / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            status === "failed"
              ? "bg-destructive"
              : status === "completed"
                ? "bg-emerald-500"
                : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}
