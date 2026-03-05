import { useState, useEffect } from "react";
import { api, type Supplier } from "@/api/client";
import { Truck, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Suppliers() {
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
      setSuppliers((prev) => [...prev, supplier].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewType("");
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lieferanten</h1>
        {canEdit && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Neuer Lieferant
          </button>
        )}
      </div>

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
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Laden...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Lieferanten vorhanden
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="transition-colors hover:bg-muted/50">
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
