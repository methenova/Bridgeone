import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Star, Package, Search, Globe } from "lucide-react";

import { Container } from "@/components/common/Container";
import { useShopDetail } from "@/features/customer/hooks/useMarketplaceShops";
import { useMarketplaceProducts } from "@/features/customer/hooks/useMarketplaceProducts";
import ProductCard from "@/features/product/components/ProductCard";
import ProductPagination from "@/features/seller/components/ProductPagination";
import CustomerChatWidget from "@/features/chat/components/CustomerChatWidget";

function ShopProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-56 animate-pulse rounded-3xl bg-slate-800" />
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 animate-pulse rounded-full bg-slate-800" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-1/3 animate-pulse rounded bg-slate-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default function ShopProfilePage() {
  const { shopId } = useParams();
  const [productFilters, setProductFilters] = useState({
    search: "", page: 1, limit: 12,
  });

  const { data: shop, isLoading: shopLoading, error } = useShopDetail(shopId);
  const { data: productData, isLoading: productsLoading } = useMarketplaceProducts({
    ...productFilters,
    shopId,
  });

  const products = productData?.products ?? [];
  const total = productData?.total ?? 0;
  const totalPages = productData?.totalPages ?? 1;

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-slate-950 py-10">
        <Container><ShopProfileSkeleton /></Container>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-slate-950 py-20 text-center">
        <p className="text-xl font-semibold text-white">Shop not found</p>
        <Link to="/shops" className="mt-4 inline-block text-blue-400 underline">
          Browse Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Banner */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-900 md:h-72">
        {shop.banner_url ? (
          <img src={shop.banner_url} alt={shop.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900/20 to-slate-900 text-7xl opacity-30">
            🏪
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      </div>

      <Container>

        {/* Shop Info */}
        <div className="-mt-16 relative mb-10 flex flex-col gap-5 sm:flex-row sm:items-end">
          {/* Logo */}
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-slate-950 bg-slate-800 shadow-xl">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">🏪</div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{shop.name}</h1>
              {shop.is_live && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              {shop.categories?.name && (
                <span className="text-blue-400">{shop.categories.name}</span>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {shop.city}, {shop.state}
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span>4.8</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {total} Products
              </div>
              {shop.website_url && (
                <a
                  href={shop.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
            </div>

            {shop.description && (
              <p className="mt-3 max-w-2xl text-sm text-slate-400">{shop.description}</p>
            )}
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">
              Products · <span className="text-slate-400 font-normal">{total}</span>
            </h2>
            {/* Search within shop */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={productFilters.search}
                onChange={(e) => setProductFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                placeholder="Search in shop..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  <div className="aspect-[4/3] animate-pulse bg-slate-800" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
                    <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-slate-600" />
              <p className="text-slate-400">
                {productFilters.search ? "No products match your search" : "No products in this shop yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10">
              <ProductPagination
                page={productFilters.page}
                totalPages={totalPages}
                total={total}
                limit={productFilters.limit}
                onPageChange={(p) => setProductFilters((f) => ({ ...f, page: p }))}
                onLimitChange={(l) => setProductFilters((f) => ({ ...f, limit: l, page: 1 }))}
              />
            </div>
          )}
        </div>

        {/* Chat Widget */}
        <CustomerChatWidget shop={shop} />

      </Container>
    </div>
  );
}