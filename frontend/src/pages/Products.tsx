import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type ProductListResponse } from "@/api/client";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", "50");
      if (search) params.set("search", search);
      const result = await api.getProducts(params);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Produkte</h1>
        <span className="text-sm text-muted-foreground">
          {data?.total ?? 0} Produkte
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Suche nach Name, EAN, PZN, SKU..."
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  ERP SKU
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  EAN
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  PZN
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Hersteller
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Kategorie
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  ERP
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Channel
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Lieferanten
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Laden...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Keine Produkte gefunden
                  </td>
                </tr>
              ) : (
                data?.items.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {product.erp_sku || "–"}
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {product.ean || "–"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {product.pzn || "–"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.manufacturer || "–"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category || "–"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ReleaseBadge released={product.release_to_erp} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ReleaseBadge released={product.release_to_channel} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.supplier_count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Seite {data.page} von {data.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= data.pages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
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

function ReleaseBadge({ released }: { released: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
        released
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {released ? "Ja" : "Nein"}
    </span>
  );
}
