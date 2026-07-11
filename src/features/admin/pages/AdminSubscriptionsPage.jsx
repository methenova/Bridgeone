import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  Layers, 
  DollarSign, 
  Zap, 
  Building,
  User,
  Sliders,
  Percent,
  Search,
  CheckCircle2,
  TrendingUp,
  XCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useSubscriptionPlans, useUpdateSubscriptionPlan, useAdminShops } from "../hooks/useAdmin";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";

export default function AdminSubscriptionsPage() {
  const { data: plans = [], isLoading: plansLoading, refetch: refetchPlans } = useSubscriptionPlans();
  const { data: shops = [], isLoading: shopsLoading, refetch: refetchShops } = useAdminShops();
  const updatePlan = useUpdateSubscriptionPlan();

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Plan Popup state
  const [editingPlan, setEditingPlan] = useState(null);
  const [editPrice, setEditPrice] = useState("0");
  const [editCallLimit, setEditCallLimit] = useState("10");
  const [editUnlimitedCalls, setEditUnlimitedCalls] = useState(false);
  const [editCommission, setEditCommission] = useState("5.0");
  const [submitting, setSubmitting] = useState(false);

  // Load completed orders as billing invoice histories
  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoadingInvoices(true);
        const { data } = await supabase
          .from("orders")
          .select("*, shops(shop_name)")
          .eq("status", "completed")
          .order("created_at", { ascending: false });
        
        setInvoices(data || []);
      } catch (err) {
        console.error("Failed to load invoice histories:", err);
      } finally {
        setLoadingInvoices(false);
      }
    }
    loadInvoices();
  }, []);

  // Sync plan totals
  const stats = useMemo(() => {
    const totalActive = shops.filter(s => s.plan_name === "basic" || s.plan_name === "pro").length;
    const basicCount = shops.filter(s => s.plan_name === "basic").length;
    const proCount = shops.filter(s => s.plan_name === "pro").length;
    const freeCount = shops.filter(s => !s.plan_name || s.plan_name === "free").length;
    return { totalActive, basicCount, proCount, freeCount };
  }, [shops]);

  // Open plan editor
  function handleStartEdit(plan) {
    setEditingPlan(plan);
    setEditPrice(plan.price.toString());
    setEditCallLimit(plan.call_limit === -1 ? "100" : plan.call_limit.toString());
    setEditUnlimitedCalls(plan.call_limit === -1);
    setEditCommission(plan.commission_rate.toString());
  }

  // Save plan configurations
  async function handleSavePlan(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalLimit = editUnlimitedCalls ? -1 : parseInt(editCallLimit) || 0;
      await updatePlan.mutateAsync({
        planId: editingPlan.id,
        updates: {
          price: parseFloat(editPrice) || 0,
          call_limit: finalLimit,
          commission_rate: parseFloat(editCommission) || 0
        }
      });
      setEditingPlan(null);
      refetchPlans();
    } catch (err) {
      toast.error(err.message || "Failed to update configurations");
    } finally {
      setSubmitting(false);
    }
  }

  // Edit individual shop plan (Upgrade / Downgrade / Cancel)
  async function handleUpdateShopPlan(shopId, newPlan) {
    try {
      const { error } = await supabase
        .from("shops")
        .update({ plan_name: newPlan })
        .eq("id", shopId);

      if (error) throw error;
      toast.success("Merchant subscription updated successfully");
      refetchShops();
    } catch (err) {
      toast.error(err.message || "Failed to update plan");
    }
  }

  // Filter invoices list
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const shopName = inv.shops?.shop_name || "";
      const matchesSearch = 
        shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [invoices, searchQuery]);

  const loading = plansLoading || shopsLoading || loadingInvoices;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white max-w-7xl relative">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Subscriptions & Billing</h1>
        <p className="mt-1 text-xs text-slate-400">Configure global SaaS plan limits, audit payment histories, and modify tenant memberships.</p>
      </div>

      {/* Aggregate Counts Row */}
      <div className="grid gap-4 grid-cols-4 max-w-4xl">
        {/* Total Active Subscriptions */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Paid Subs</p>
            <p className="text-xl font-bold tracking-tight text-white">{stats.totalActive}</p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4" />
          </div>
        </div>

        {/* Pro Plan Count */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pro Tier Tenants</p>
            <p className="text-xl font-bold tracking-tight text-indigo-400">{stats.proCount}</p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        {/* Basic Plan Count */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Basic Tier Tenants</p>
            <p className="text-xl font-bold tracking-tight text-purple-400">{stats.basicCount}</p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        {/* Free Plan Count */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Free Tier Tenants</p>
            <p className="text-xl font-bold tracking-tight text-slate-400">{stats.freeCount}</p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
            <Building className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Left 2 Cols: Invoices Audit Trail & Tenant plans selector */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tenant plan manager */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400">Tenant Subscription Manager</h3>
              <p className="text-xs text-slate-500">Quickly upgrade, downgrade, or cancel tenant plans directly.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-100 bg-slate-900/30 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-2">Store name</th>
                    <th className="py-3 px-2">Current plan</th>
                    <th className="py-3 px-2 text-right">Update Subscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
                  {shops.slice(0, 5).map(shop => (
                    <tr key={shop.id}>
                      <td className="py-3.5 px-2 font-bold text-slate-900">{shop.shop_name}</td>
                      <td className="py-3.5 px-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          shop.plan_name === "pro"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : shop.plan_name === "basic"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-800"
                        }`}>
                          {shop.plan_name || "free"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <select
                          value={shop.plan_name || "free"}
                          onChange={(e) => handleUpdateShopPlan(shop.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] outline-none text-slate-700"
                        >
                          <option value="free">Free Tier</option>
                          <option value="basic">Basic Tier</option>
                          <option value="pro">Pro Tier</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History Log */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400">Payment Invoice Audit</h3>
                <p className="text-xs text-slate-500">Completed platform transaction sales logs</p>
              </div>
              
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search by store or invoice ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-slate-200"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-900 text-xs">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center py-3">
                  <div>
                    <p className="font-bold text-white text-xs">{inv.shops?.shop_name || "Platform Merchant"}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Inv: #{inv.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-white">₹{Number(inv.total).toLocaleString()}</p>
                    <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase mt-0.5">
                      Paid
                    </span>
                  </div>
                </div>
              ))}
              {filteredInvoices.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center">
                  <CreditCard className="h-8 w-8 text-slate-700 mb-2 animate-pulse" />
                  <p className="text-xs text-slate-500 font-bold">No completed invoices found</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Subscription Configuration Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400">SaaS Plan Thresholds</h3>
              <p className="text-xs text-slate-500">Edit features, usage caps, and commissions globally.</p>
            </div>

            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase">{plan.display_name}</h4>
                      <p className="text-sm font-black text-white mt-0.5">₹{plan.price}/month</p>
                    </div>
                    <Button
                      onClick={() => handleStartEdit(plan)}
                      className="text-[9px] uppercase tracking-wider font-extrabold text-blue-450 hover:text-white bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 transition-all cursor-pointer"
                    >
                      Edit
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100/50">
                    <div>
                      Call Limit: <strong className="text-slate-300">{plan.call_limit === -1 ? "Unlimited" : `${plan.call_limit}/mo`}</strong>
                    </div>
                    <div>
                      Commission: <strong className="text-slate-300">{plan.commission_rate}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* PLAN EDIT MODAL */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Configure {editingPlan.display_name}</h2>
                <p className="text-[10px] text-slate-500 mt-1">Adjust limits dynamically inside the platform databases.</p>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
                
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide tracking-wider flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-indigo-400" />
                    <span>Monthly Price (₹)</span>
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Call Limit */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide tracking-wider flex items-center gap-1">
                    <Sliders className="h-3 w-3 text-indigo-400" />
                    <span>Monthly Consultation Call Limit</span>
                  </label>
                  
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUnlimitedCalls}
                      onChange={(e) => setEditUnlimitedCalls(e.target.checked)}
                      className="rounded border-slate-200 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Unlimited Sessions</span>
                  </label>

                  {!editUnlimitedCalls && (
                    <input
                      type="number"
                      value={editCallLimit}
                      onChange={(e) => setEditCallLimit(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                {/* Commission rate */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide tracking-wider flex items-center gap-1">
                    <Percent className="h-3 w-3 text-indigo-400" />
                    <span>Transaction Commission Fee (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 flex gap-3 justify-end text-xs font-semibold">
                  <Button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-550 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save Configurations
                  </Button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
