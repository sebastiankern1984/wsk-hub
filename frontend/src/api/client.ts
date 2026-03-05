const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

async function fetchAPIFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// Types
export interface Product {
  id: number;
  product_id: string;
  erp_sku: string | null;
  ean: string | null;
  pzn: string | null;
  nan: string | null;
  name: string;
  description: string | null;
  manufacturer: string | null;
  category: string | null;
  subcategory: string | null;
  unit_size: string | null;
  norm_size: string | null;
  vat_rate: number | null;
  weight_g: number | null;
  is_medication: boolean | null;
  pharmacy_required: string | null;
  market_status: string | null;
  hs_code: string | null;
  abda_pzn: string | null;
  release_to_erp: boolean;
  release_to_channel: boolean;
  version: number;
  status: string;
  supplier_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductDetail extends Product {
  suppliers: SupplierProductInfo[];
}

export interface SupplierProductInfo {
  id: number;
  supplier_id: number;
  supplier_name: string | null;
  supplier_sku: string | null;
  purchase_price: number | null;
  retail_price: number | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Supplier {
  id: number;
  name: string;
  type: string | null;
  discount_percent: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: number;
  event_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  aggregate_version: number;
  payload: Record<string, unknown>;
  source: string;
  user_id: string | null;
  occurred_at: string;
}

export interface EventListResponse {
  items: EventItem[];
  total: number;
}

export interface ProductStats {
  total: number;
  released_to_erp: number;
  released_to_channel: number;
}

export interface UserInfo {
  username: string;
  display_name: string;
  role: "admin" | "manager" | "worker" | "viewer";
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

// ABDA types
export interface AbdaImportLog {
  id: number;
  file_name: string;
  file_type: string;
  file_date: string | null;
  record_count_total: number;
  record_count_insert: number;
  record_count_update: number;
  status: string;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AbdaLookupResult {
  pzn: string;
  ean: string | null;
  name: string | null;
  manufacturer: string | null;
  pack_size: string | null;
  norm_size: string | null;
  apo_ek: string | null;
  is_medication: string | null;
  pharmacy_required: string | null;
  market_status: string | null;
  distribution_status: string | null;
  already_in_hub: boolean;
}

export interface AbdaStats {
  total_articles: number;
  last_import_date: string | null;
  last_import_status: string | null;
  total_imports: number;
}

export interface AlphaplanStatus {
  status: string;
  message: string;
}

export interface AppSetting {
  key: string;
  value: string | null;
  description: string | null;
  is_secret: boolean;
  updated_at: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: string | null;
  created_at: string;
}

// API functions
export const api = {
  // Auth
  login: (username: string, password: string) =>
    fetchAPI<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => fetchAPI<UserInfo>("/api/auth/me"),

  // Products
  getProducts: (params?: URLSearchParams) =>
    fetchAPI<ProductListResponse>(`/api/products${params ? `?${params}` : ""}`),

  getProduct: (id: number) => fetchAPI<ProductDetail>(`/api/products/${id}`),

  getProductStats: () => fetchAPI<ProductStats>("/api/products/stats"),

  createProduct: (data: Partial<Product>) =>
    fetchAPI<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: Partial<Product>) =>
    fetchAPI<Product>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Suppliers
  getSuppliers: () => fetchAPI<Supplier[]>("/api/suppliers"),

  createSupplier: (data: { name: string; type?: string; discount_percent?: number }) =>
    fetchAPI<Supplier>("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSupplier: (id: number, data: Partial<Supplier>) =>
    fetchAPI<Supplier>(`/api/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Events
  getEvents: (params?: URLSearchParams) =>
    fetchAPI<EventListResponse>(`/api/events${params ? `?${params}` : ""}`),

  getAggregateEvents: (aggregateType: string, aggregateId: string) =>
    fetchAPI<EventListResponse>(`/api/events/${aggregateType}/${aggregateId}`),

  // ABDA
  uploadAbdaExcel: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetchAPIFormData<AbdaImportLog>("/api/imports/abda", fd);
  },
  getAbdaImports: () => fetchAPI<AbdaImportLog[]>("/api/imports/abda"),
  getAbdaImportProgress: (id: number) => fetchAPI<AbdaImportLog>(`/api/imports/abda/${id}`),
  lookupAbda: (search: string, excludeMedication = false) =>
    fetchAPI<AbdaLookupResult[]>(`/api/abda/lookup?search=${encodeURIComponent(search)}${excludeMedication ? "&exclude_medication=true" : ""}`),
  addAbdaToHub: (pzn: string) =>
    fetchAPI<{ id: number; product_id: string; pzn: string; name: string }>(`/api/abda/add-to-hub/${pzn}`, { method: "POST" }),
  getAbdaStats: () => fetchAPI<AbdaStats>("/api/abda/stats"),

  // Alphaplan
  getAlphaplanStatus: () => fetchAPI<AlphaplanStatus>("/api/alphaplan/status"),

  // Settings
  getSettings: () => fetchAPI<AppSetting[]>("/api/settings"),
  updateSetting: (key: string, value: string | null) =>
    fetchAPI<AppSetting>(`/api/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),

  // Manufacturers
  getManufacturers: () => fetchAPI<Manufacturer[]>("/api/manufacturers"),
};
