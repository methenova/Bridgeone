import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STOCK_OPTIONS = [
  { value: "", label: "All Stock" },
  { value: "in", label: "In Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
];

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest First" },
  { value: "created_at:asc", label: "Oldest First" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "price:asc", label: "Price Low–High" },
  { value: "price:desc", label: "Price High–Low" },
  { value: "stock:asc", label: "Stock Low–High" },
  { value: "stock:desc", label: "Stock High–Low" },
];

export default function ProductFilters({
  categories = [],
  filters,
  onChange,
  totalProducts = 0,
}) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const debounceRef = useRef(null);

  // Sync search with debounce (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ search: localSearch, page: 1 });
    }, 300);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // Sync if filters.search resets externally (e.g. "Clear all")
  useEffect(() => {
    setLocalSearch(filters.search || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.status ||
    filters.stockFilter;

  function handleReset() {
    setLocalSearch("");
    onChange({
      search: "",
      categoryId: "",
      status: "",
      stockFilter: "",
      sortBy: "created_at",
      sortOrder: "desc",
      page: 1,
    });
  }

  function handleSortChange(value) {
    const [sortBy, sortOrder] = value.split(":");
    onChange({ sortBy, sortOrder, page: 1 });
  }

  const currentSort = `${filters.sortBy || "created_at"}:${filters.sortOrder || "desc"}`;

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Sort */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Row 2: Dropdown filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filter by:</span>
        </div>

        {/* Category */}
        <select
          value={filters.categoryId || ""}
          onChange={(e) => onChange({ categoryId: e.target.value, page: 1 })}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status || ""}
          onChange={(e) => onChange({ status: e.target.value, page: 1 })}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Stock */}
        <select
          value={filters.stockFilter || ""}
          onChange={(e) => onChange({ stockFilter: e.target.value, page: 1 })}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {STOCK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Reset filters */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto text-sm text-slate-500">
          {totalProducts.toLocaleString()}{" "}
          {totalProducts === 1 ? "product" : "products"}
        </span>
      </div>
    </div>
  );
}
