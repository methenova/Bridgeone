import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Search } from "lucide-react";

import { Container } from "@/components/common/Container";
import { useMarketplaceShops } from "@/features/customer/hooks/useMarketplaceShops";
import { usePublicCategories } from "@/features/customer/hooks/useMarketplaceProducts";
import ProductPagination from "@/features/seller/components/ProductPagination";

function ShopCardFull({ shop }) {
  return (
    <Link
      to={`/shops/${shop.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5"
    >
      {/* Banner / Logo Image */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
        {shop.banner_url ? (
          <img
            src={shop.banner_url}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-4xl">
            🏪
          </div>
        )}
        {shop.is_live && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            <span className="text-xs font-bold text-slate-900">LIVE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">🏪</div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">{shop.name}</h3>
            {shop.categories?.name && (
              <p className="text-xs text-blue-400">{shop.categories.name}</p>
            )}
          </div>
        </div>

        {shop.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{shop.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {shop.city}, {shop.state}
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="h-3 w-3 fill-amber-400" />
            <span className="font-medium">4.8</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ShopListingPage() {
  const [filters, setFilters] = useState({
    search: "", categoryId: "", page: 1, limit: 12,
  });

  function updateFilters(updates) {
    setFilters((prev) => ({ ...prev, ...updates, page: 1 }));
  }

  const { data: shopData, isLoading } = useMarketplaceShops(filters);
  const { data: categories = [] } = usePublicCategories();

  const shops = shopData?.shops ?? [];
  const total = shopData?.total ?? 0;
  const totalPages = shopData?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Browse Shops</h1>
          <p className="mt-1 text-slate-500">
            {total.toLocaleString()} shop{total !== 1 ? "s" : ""} on BridgeOne
          </p>
        </div>

        {/* Search + Category Filter */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search shops..."
              className="w-full rounded-xl border border-slate-200 bg-white shadow-sm py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filters.categoryId}
            onChange={(e) => updateFilters({ categoryId: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-36 animate-pulse bg-slate-100" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-xl font-semibold text-slate-900">No shops found</p>
            <p className="mt-2 text-slate-500">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {shops.map((shop) => (
              <ShopCardFull key={shop.id} shop={shop} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10">
            <ProductPagination
              page={filters.page}
              totalPages={totalPages}
              total={total}
              limit={filters.limit}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              onLimitChange={(l) => setFilters((f) => ({ ...f, limit: l, page: 1 }))}
            />
          </div>
        )}

      </Container>
    </div>
  );
}