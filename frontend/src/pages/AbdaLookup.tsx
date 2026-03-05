import { useState } from "react";
import { api, type AbdaLookupResult } from "@/api/client";
import { Search, Plus, Check, Loader2 } from "lucide-react";

export default function AbdaLookup() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AbdaLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const doSearch = async () => {
    if (search.length < 1) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await api.lookupAbda(search);
      setResults(data);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Suche fehlgeschlagen" });
    } finally {
      setLoading(false);
    }
  };

  const addToHub = async (pzn: string) => {
    setAdding(pzn);
    setMessage(null);
    try {
      const result = await api.addAbdaToHub(pzn);
      setMessage({ type: "success", text: `${result.name} (PZN ${pzn}) zum Hub hinzugefügt` });
      // Update the result to show as already in hub
      setResults((prev) =>
        prev.map((r) => (r.pzn === pzn ? { ...r, already_in_hub: true } : r))
      );
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Fehler beim Hinzufügen" });
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ABDA Suche</h1>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="PZN oder Produktname eingeben..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={doSearch}
          disabled={loading || search.length < 1}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
        </button>
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

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              {results.length} Ergebnis{results.length !== 1 ? "se" : ""}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">PZN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">EAN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Hersteller</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Apo EK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Normgröße</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((r) => (
                  <tr key={r.pzn} className="hover:bg-accent/50">
                    <td className="px-6 py-3 text-sm font-mono text-foreground">{r.pzn}</td>
                    <td className="px-6 py-3 text-sm font-mono text-muted-foreground">{r.ean || "–"}</td>
                    <td className="max-w-xs truncate px-6 py-3 text-sm text-foreground">{r.name || "–"}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{r.manufacturer || "–"}</td>
                    <td className="px-6 py-3 text-right text-sm text-foreground">
                      {r.apo_ek ? `${r.apo_ek} €` : "–"}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{r.norm_size || "–"}</td>
                    <td className="px-6 py-3 text-center">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
