import { useState, useMemo } from "react";
import { 
  Store, 
  AlertTriangle, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  ShieldCheck, 
  Building 
} from "lucide-react";
import { motion } from "framer-motion";

import { useAdminShops, useToggleShopStatus, useUpdateShopPlan } from "../hooks/useAdmin";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";
import { Button } from "@/components/ui/button";
import AdminTableSkeleton from "@/features/admin/components/skeletons/AdminTableSkeleton";

const PLANS = [
  { value: "free", label: "Free Plan" },
  { value: "basic", label: "Basic Plan" },
  { value: "pro", label: "Pro Plan" },
];

export default function AdminShopsPage() {
  const { data: shops = [], isLoading } = useAdminShops();
  const toggleStatus = useToggleShopStatus();
  const updatePlan = useUpdateShopPlan();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  async function handlePlanChange(shopId, newPlan) {
    await updatePlan.mutateAsync({ shopId, planName: newPlan });
  }

  async function handleToggleActive(shop) {
    const actionText = shop.is_verified ? "suspend" : "approve";
    if (window.confirm(`Are you sure you want to ${actionText} the shop "${shop.shop_name}"?`)) {
      await toggleStatus.mutateAsync({
        shopId: shop.id,
        isActive: !shop.is_verified,
      });
    }
  }

  // Filter & Search Logic
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesSearch = 
        (shop.shop_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shop.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shop.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan = planFilter === "all" || (shop.plan_name || "free") === planFilter;
      
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "approved" && shop.is_verified) ||
        (statusFilter === "suspended" && !shop.is_verified);

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [shops, searchQuery, planFilter, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = shops.length;
    const approved = shops.filter(s => s.is_verified).length;
    const suspended = total - approved;
    return { total, approved, suspended };
  }, [shops]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <AdminTableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 text-slate-900 max-w-7xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Shops</h1>
        <p className="mt-1 text-xs text-slate-500">Moderate vendor listings, adjust subscription levels, and view approval statuses.</p>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid gap-4 grid-cols-3 max-w-3xl">
        {/* Total Stores */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Shops</p>
            <p className="text-xl font-bold tracking-tight">{stats.total}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Building className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Approved Stores */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Approved</p>
            <p className="text-xl font-bold tracking-tight text-emerald-400">{stats.approved}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Suspended Stores */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-bold tracking-tight text-amber-400">{stats.suspended}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Utility Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by store, owner name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 transition-colors"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-3.5">
          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All Plans</option>
              <option value="free">Free Plan</option>
              <option value="basic">Basic Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

      </div>

      {/* Enterprise Shops Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4.5">Store / Brand</th>
                <th className="px-6 py-4.5">Merchant / Owner</th>
                <th className="px-6 py-4.5">Vertical</th>
                <th className="px-6 py-4.5">Subscription Level</th>
                <th className="px-6 py-4.5">Moderation State</th>
                <th className="px-6 py-4.5 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
              {filteredShops.map((s, idx) => {
                const ownerName = s.profiles?.full_name || "—";
                const ownerEmail = s.profiles?.email || "—";
                const isApproved = s.is_verified;

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={s.id} 
                    className="hover:bg-white shadow-sm/10 transition-colors"
                  >
                    {/* Brand Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center">
                          {s.logo_url ? (
                            <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Store className="h-4.5 w-4.5 text-slate-655" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">{s.shop_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block uppercase">
                            #{s.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Owner Contact */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{ownerName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{ownerEmail}</div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {s.categories?.name || "Uncategorized"}
                    </td>

                    {/* Subscription Select Dropdown */}
                    <td className="px-6 py-4">
                      <select
                        value={s.plan_name || "free"}
                        onChange={(e) => handlePlanChange(s.id, e.target.value)}
                        disabled={updatePlan.isPending}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 disabled:opacity-50 font-bold transition-all"
                      >
                        {PLANS.map((plan) => (
                          <option key={plan.value} value={plan.value}>{plan.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Active Moderation Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {isApproved ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Approved
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Suspended
                          </>
                        )}
                      </span>
                    </td>

                    {/* Verification Status Toggle Button */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleToggleActive(s)}
                        disabled={toggleStatus.isPending}
                        title={isApproved ? "Suspend Shop Access" : "Approve Shop Access"}
                        className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isApproved ? (
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-700" />
                        )}
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredShops.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Store className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No Shops Match Filter criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the search filters above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
