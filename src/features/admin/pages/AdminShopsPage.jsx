import { useAdminShops, useToggleShopStatus } from "../hooks/useAdmin";
import { Store, Check, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";

export default function AdminShopsPage() {
  const { data: shops = [], isLoading } = useAdminShops();
  const toggleStatus = useToggleShopStatus();

  async function handleToggleActive(shop) {
    await toggleStatus.mutateAsync({
      shopId: shop.id,
      isActive: !shop.is_verified,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Shops</h1>
        <p className="mt-1 text-slate-400">Manage vendor listings and approval statuses.</p>
      </div>

      {isLoading ? (
        <ProductSkeleton rows={6} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-300 text-sm font-semibold">
                <tr>
                  <th className="px-6 py-4">Shop</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/10 text-sm text-slate-300">
                {shops.map((s) => {
                  const ownerName = s.profiles?.full_name || "—";
                  const ownerEmail = s.profiles?.email || "—";

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* Logo + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center">
                            {s.logo_url ? (
                              <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{s.name}</span>
                            <span className="text-xs text-slate-500 font-mono">#{s.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* Owner Details */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{ownerName}</div>
                        <div className="text-xs text-slate-500">{ownerEmail}</div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-slate-400">
                        {s.categories?.name || "—"}
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-slate-400">
                        {s.city ? `${s.city}, ${s.state}` : "—"}
                      </td>

                      {/* Active Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                          s.is_verified
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {s.is_verified ? (
                            <>
                              <Check className="h-3 w-3" /> Approved
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3" /> Suspended
                            </>
                          )}
                        </span>
                      </td>

                      {/* Status Toggle Button */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleActive(s)}
                          disabled={toggleStatus.isPending}
                          title={s.is_verified ? "Suspend Shop" : "Approve Shop"}
                          className="text-slate-500 transition-colors hover:text-white disabled:opacity-50"
                        >
                          {s.is_verified ? (
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
