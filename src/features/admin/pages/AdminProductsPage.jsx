import { useAdminProducts, useToggleProductActive, useToggleProductFeatured } from "../hooks/useAdmin";
import { Star, ToggleLeft, ToggleRight } from "lucide-react";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";

export default function AdminProductsPage() {
  const { data: products = [], isLoading } = useAdminProducts();
  const toggleActive = useToggleProductActive();
  const toggleFeatured = useToggleProductFeatured();

  async function handleToggleActive(p) {
    await toggleActive.mutateAsync({
      productId: p.id,
      isActive: !p.is_active,
    });
  }

  async function handleToggleFeatured(p) {
    await toggleFeatured.mutateAsync({
      productId: p.id,
      isFeatured: !p.featured,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Products</h1>
        <p className="mt-1 text-slate-400">Moderate product listings and featured showcases.</p>
      </div>

      {isLoading ? (
        <ProductSkeleton rows={6} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-300 text-sm font-semibold">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Shop</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Featured</th>
                  <th className="px-6 py-4 text-center">Active Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/10 text-sm text-slate-300">
                {products.map((p) => {
                  const displayPrice = p.discount_price ? Number(p.discount_price) : Number(p.price);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* Thumbnail + Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center">
                            {p.thumbnail_url ? (
                              <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              "📦"
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block truncate max-w-[150px]">{p.name}</span>
                            <span className="text-xs text-slate-500 font-mono">SKU: {p.sku || "—"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Shop Name */}
                      <td className="px-6 py-4 text-white font-medium">
                        {p.shops?.name || "—"}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-slate-400">
                        {p.categories?.name || "—"}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-semibold text-white">
                        ₹{displayPrice.toLocaleString()}
                      </td>

                      {/* Featured Star Toggle */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          disabled={toggleFeatured.isPending}
                          title={p.featured ? "Remove from Featured" : "Make Featured"}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                            p.featured
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              : "border-slate-800 text-slate-600 hover:text-slate-400"
                          }`}
                        >
                          <Star className={`h-4 w-4 ${p.featured ? "fill-amber-400" : ""}`} />
                        </button>
                      </td>

                      {/* Active Status Badge */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                          p.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={toggleActive.isPending}
                          title={p.is_active ? "Deactivate Product" : "Activate Product"}
                          className="text-slate-500 transition-colors hover:text-white disabled:opacity-50"
                        >
                          {p.is_active ? (
                            <ToggleRight className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
