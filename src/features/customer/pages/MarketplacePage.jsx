import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

import { Container } from "@/components/common/Container";
import { useMarketplaceProducts } from "../hooks/useMarketplaceProducts";
import { usePublicCategories } from "../hooks/useMarketplaceProducts";
import ProductCard from "@/features/product/components/ProductCard";
import ProductPagination from "@/features/seller/components/ProductPagination";

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest First" },
  { value: "created_at:asc", label: "Oldest First" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
];

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="aspect-[4/3] animate-pulse bg-slate-800" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Build filters from URL params
  const filters = {
    search: searchParams.get("q") || "",
    categoryId: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
    sortBy: (searchParams.get("sort") || "created_at:desc").split(":")[0],
    sortOrder: (searchParams.get("sort") || "created_at:desc").split(":")[1],
    page: Number(searchParams.get("page") || 1),
    limit: 12,
  };

  function updateParam(key, value) {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    setSearchParams(p);
  }

  function setPage(page) {
    const p = new URLSearchParams(searchParams);
    p.set("page", page);
    setSearchParams(p);
  }

  const { data: productData, isLoading, isFetching } = useMarketplaceProducts(filters);
  const { data: categories = [] } = usePublicCategories();

  const products = productData?.products ?? [];
  const total = productData?.total ?? 0;
  const totalPages = productData?.totalPages ?? 1;

  const activeCategory = categories.find((c) => c.id === filters.categoryId);

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <Container>

        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {filters.search
                ? `Results for "${filters.search}"`
                : activeCategory
                ? activeCategory.name
                : "All Products"}
            </h1>
            <p className="mt-1 text-slate-400">
              {total.toLocaleString()} product{total !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Sort + Filter toggle */}
          <div className="flex shrink-0 items-center gap-3">
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:text-white md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-8">

          {/* ── Sidebar Filters ───────────────────────────── */}
          <aside
            className={`${
              sidebarOpen ? "fixed inset-0 z-30 bg-slate-950/95 px-6 py-8 overflow-y-auto md:static md:inset-auto md:z-auto md:bg-transparent md:p-0" : "hidden md:block"
            } w-full shrink-0 space-y-6 md:w-64`}
          >
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="mb-4 text-sm text-slate-400 underline md:hidden"
              >
                ← Close filters
              </button>
            )}

            {/* Categories */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Category</h3>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam("category", "")}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    !filters.categoryId
                      ? "bg-blue-600/20 font-medium text-blue-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam("category", cat.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      filters.categoryId === cat.id
                        ? "bg-blue-600/20 font-medium text-blue-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice ?? ""}
                  onChange={(e) => updateParam("minPrice", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
                <span className="text-slate-500">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) => updateParam("maxPrice", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </aside>

          {/* ── Product Grid ──────────────────────────────── */}
          <div className="flex-1">
            {isLoading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 text-5xl">🔍</div>
                <h3 className="text-lg font-semibold text-white">No products found</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Try different filters or search terms
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 xl:grid-cols-4 ${
                    isFetching && !isLoading ? "opacity-70" : ""
                  }`}
                >
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10">
                    <ProductPagination
                      page={filters.page}
                      totalPages={totalPages}
                      total={total}
                      limit={filters.limit}
                      onPageChange={setPage}
                      onLimitChange={() => {}}
                    />
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </Container>
    </div>
  );
}
