import { useState, useEffect, useCallback } from "react";
import { api, type AbdaImportLog, type AbdaStats } from "@/api/client";
import { Upload, FileSpreadsheet, Clock, Loader2 } from "lucide-react";

export default function ImportAbda() {
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

  // Poll running imports
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
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-secondary text-secondary-foreground"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ABDA Import</h1>

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
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileSelect} />
          </label>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Datei</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Gesamt</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Neu</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Aktualisiert</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {imports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
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
                      {imp.created_at ? new Date(imp.created_at).toLocaleString("de-DE") : "–"}
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
