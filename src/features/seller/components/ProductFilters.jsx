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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
      
      {/* Search Input */}
      <div className="relative flex-1 max-w-md flex items-center">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-300 transition-colors"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="absolute right-3 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Select Dropdowns */}
      <div className="flex items-center gap-3 flex-wrap justify-end">
        
        {/* Category */}
        <select
          value={filters.categoryId || ""}
          onChange={(e) => onChange({ categoryId: e.target.value, page: 1 })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-300 cursor-pointer"
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
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-300 cursor-pointer"
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
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-300 cursor-pointer"
        >
          {STOCK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-300 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

      </div>
    </div>
  );
}
