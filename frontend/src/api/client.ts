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
  // Identity
  erp_sku: string | null;
  internal_sku: string | null;
  ean: string | null;
  pzn: string | null;
  nan: string | null;
  // Names
  name: string;
  name_short: string | null;
  name_long: string | null;
  description: string | null;
  // Manufacturer
  manufacturer: string | null;
  manufacturer_id: number | null;
  // Classification
  category: string | null;
  subcategory: string | null;
  warengruppe: string | null;
  saisonartikel: boolean | null;
  bio_article: boolean | null;
  // Size / Packaging
  unit_size: string | null;
  norm_size: string | null;
  size_value: number | null;
  size_unit: string | null;
  units_per_ve: number | null;
  ve_per_layer: number | null;
  layers_per_palette: number | null;
  ve_per_palette: number | null;
  // Tax
  vat_rate: number | null;
  // Weight
  weight_g: number | null;
  weight_piece_g: number | null;
  weight_ve_g: number | null;
  weight_palette_g: number | null;
  // Dimensions
  width_mm: number | null;
  height_mm: number | null;
  length_mm: number | null;
  // Compliance
  is_medication: boolean | null;
  pharmacy_required: string | null;
  market_status: string | null;
  country_of_origin: string | null;
  pharma_flag: boolean | null;
  biozid_flag: boolean | null;
  dg_flag: boolean | null;
  shelf_life_days: number | null;
  hs_code: string | null;
  abda_pzn: string | null;
  // Release
  release_to_erp: boolean;
  release_to_channel: boolean;
  // Meta
  version: number;
  status: string;
  supplier_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductEanInfo {
  id: number;
  ean_type: string;
  ean_value: string;
  is_primary: boolean;
  source: string | null;
  valid_from: string | null;
  valid_to: string | null;
}

export interface ProductPriceInfo {
  id: number;
  source: string;
  price_type: string;
  price: number;
  currency: string;
  valid_from: string | null;
  valid_to: string | null;
}

export interface ProductHsCodeInfo {
  id: number;
  country: string;
  hs_code: string;
}

export interface ProductDetail extends Product {
  suppliers: SupplierProductInfo[];
  eans: ProductEanInfo[];
  prices: ProductPriceInfo[];
  hs_codes: ProductHsCodeInfo[];
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

export interface AbdaLookupResponse {
  items: AbdaLookupResult[];
  total: number;
  limit: number;
  offset: number;
}

export interface AbdaFilterParams {
  filter_pzn?: string;
  filter_ean?: string;
  filter_name?: string;
  filter_manufacturer?: string;
  filter_apo_ek?: string;
  filter_norm_size?: string;
  exclude_medication?: boolean;
  limit?: number;
  offset?: number;
}

export interface AbdaStats {
  total_articles: number;
  last_import_date: string | null;
  last_import_status: string | null;
  total_imports: number;
}

// Supplier Import types
export interface SupplierImportLog {
  id: number;
  filename: string;
  supplier_id: number | null;
  supplier_name: string | null;
  status: string;
  total_rows: number;
  processed_rows: number;
  imported_rows: number;
  skipped_rows: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Discount Rule types
export interface DiscountRule {
  id: number;
  supplier_id: number;
  scope: "pzn" | "manufacturer";
  pzn: string | null;
  manufacturer_name: string | null;
  discount_percent: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecalculationResult {
  total: number;
  updated: number;
  linked: number;
}

export interface CsvImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
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
    fetchAPI<AbdaLookupResponse>(`/api/abda/lookup?search=${encodeURIComponent(search)}${excludeMedication ? "&exclude_medication=true" : ""}`),
  lookupAbdaFiltered: (params: AbdaFilterParams) => {
    const sp = new URLSearchParams();
    if (params.filter_pzn) sp.set("filter_pzn", params.filter_pzn);
    if (params.filter_ean) sp.set("filter_ean", params.filter_ean);
    if (params.filter_name) sp.set("filter_name", params.filter_name);
    if (params.filter_manufacturer) sp.set("filter_manufacturer", params.filter_manufacturer);
    if (params.filter_apo_ek) sp.set("filter_apo_ek", params.filter_apo_ek);
    if (params.filter_norm_size) sp.set("filter_norm_size", params.filter_norm_size);
    if (params.exclude_medication) sp.set("exclude_medication", "true");
    sp.set("limit", String(params.limit ?? 50));
    sp.set("offset", String(params.offset ?? 0));
    return fetchAPI<AbdaLookupResponse>(`/api/abda/lookup?${sp}`);
  },
  addAbdaToHub: (pzn: string) =>
    fetchAPI<{ id: number; product_id: string; pzn: string; name: string }>(`/api/abda/add-to-hub/${pzn}`, { method: "POST" }),
  getAbdaStats: () => fetchAPI<AbdaStats>("/api/abda/stats"),

  // Supplier Import
  uploadSupplierCsv: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetchAPIFormData<SupplierImportLog>("/api/imports/supplier", fd);
  },
  getSupplierImports: () => fetchAPI<SupplierImportLog[]>("/api/imports/supplier"),
  getSupplierImportProgress: (id: number) => fetchAPI<SupplierImportLog>(`/api/imports/supplier/${id}`),

  // Discount Rules
  getDiscountRules: (supplierId: number, params?: URLSearchParams) =>
    fetchAPI<DiscountRule[]>(`/api/suppliers/${supplierId}/discount-rules${params ? `?${params}` : ""}`),

  getDiscountRuleCount: (supplierId: number) =>
    fetchAPI<{ count: number }>(`/api/suppliers/${supplierId}/discount-rules/count`),

  createDiscountRule: (supplierId: number, data: { scope: string; pzn?: string; manufacturer_name?: string; discount_percent: number; note?: string }) =>
    fetchAPI<DiscountRule>(`/api/suppliers/${supplierId}/discount-rules`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDiscountRule: (supplierId: number, ruleId: number, data: { discount_percent?: number; note?: string }) =>
    fetchAPI<DiscountRule>(`/api/suppliers/${supplierId}/discount-rules/${ruleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteDiscountRule: (supplierId: number, ruleId: number) =>
    fetchAPI<void>(`/api/suppliers/${supplierId}/discount-rules/${ruleId}`, {
      method: "DELETE",
    }).catch(() => {}),

  importDiscountRulesCsv: (supplierId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetchAPIFormData<CsvImportResult>(`/api/suppliers/${supplierId}/discount-rules/import-csv`, fd);
  },

  recalculateSupplier: (supplierId: number) =>
    fetchAPI<RecalculationResult>(`/api/suppliers/${supplierId}/recalculate`, {
      method: "POST",
    }),

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
