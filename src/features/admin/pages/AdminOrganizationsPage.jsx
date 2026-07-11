import { useState, useMemo, useEffect } from "react";
import { 
  Store, 
  AlertTriangle, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  ShieldCheck, 
  Building,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useAdminShops, useToggleShopStatus, useUpdateShopPlan, useAdminCategories } from "../hooks/useAdmin";
import { supabase } from "@/config/supabase";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";
import { Button } from "@/components/ui/button";
import AdminTableSkeleton from "@/features/admin/components/skeletons/AdminTableSkeleton";

const PLANS = [
  { value: "free", label: "Free Plan" },
  { value: "basic", label: "Basic Plan" },
  { value: "pro", label: "Pro Plan" },
];

export default function AdminOrganizationsPage() {
  const { data: shops = [], isLoading, refetch } = useAdminShops();
  const { data: categories = [] } = useAdminCategories();
  const toggleStatus = useToggleShopStatus();
  const updatePlan = useUpdateShopPlan();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected details modal shop
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedShopUsage, setSelectedShopUsage] = useState({ calls: 0, products: 0, orders: 0 });
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Form Modals states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  // Form Fields
  const [formShopName, setFormShopName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formCountry, setFormCountry] = useState("India");
  const [formOwnerId, setFormOwnerId] = useState("");
  const [formCatId, setFormCatId] = useState("");
  const [availableSellers, setAvailableSellers] = useState([]);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Fetch available seller profiles for dropdown selection when creating
  useEffect(() => {
    async function loadSellers() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "seller");
        setAvailableSellers(data || []);
      } catch (err) {
        console.warn("Failed to load seller list:", err);
      }
    }
    loadSellers();
  }, []);

  // Fetch details and usage stats for selected organization
  async function handleOpenDetails(shop) {
    setSelectedShop(shop);
    setLoadingUsage(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get monthly call usage
      const { count: callCount } = await supabase
        .from("call_logs")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shop.id)
        .gte("created_at", firstDay);

      // Get products count
      const { count: prodCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shop.id);

      // Get orders volume
      const { data: orderData } = await supabase
        .from("orders")
        .select("total")
        .eq("shop_id", shop.id);
      
      const ordersTotal = orderData?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;

      setSelectedShopUsage({
        calls: callCount || 0,
        products: prodCount || 0,
        orders: ordersTotal
      });
    } catch (err) {
      console.error("Failed to load shop usage details:", err);
    } finally {
      setLoadingUsage(false);
    }
  }

  // Handle plan update mutation
  async function handlePlanChange(shopId, newPlan) {
    await updatePlan.mutateAsync({ shopId, planName: newPlan });
    toast.success("Organization subscription level updated successfully!");
  }

  // Handle suspend/verify toggling status
  async function handleToggleActive(shop) {
    const actionText = shop.is_verified ? "suspend" : "approve";
    if (window.confirm(`Are you sure you want to ${actionText} the organization "${shop.shop_name}"?`)) {
      await toggleStatus.mutateAsync({
        shopId: shop.id,
        isActive: !shop.is_verified,
      });
      refetch();
    }
  }

  // Open Create Form
  function handleOpenCreate() {
    setFormShopName("");
    setFormSlug("");
    setFormDesc("");
    setFormEmail("");
    setFormPhone("");
    setFormCity("");
    setFormCountry("India");
    setFormOwnerId(availableSellers[0]?.id || "");
    setFormCatId(categories[0]?.id || "");
    setIsCreateOpen(true);
  }

  // Handle Organization Creation
  async function handleCreateShop(e) {
    e.preventDefault();
    if (!formShopName.trim() || !formSlug.trim() || !formOwnerId) {
      toast.error("Shop name, Slug, and Merchant Owner are required!");
      return;
    }
    setSubmittingForm(true);
    try {
      const { error } = await supabase
        .from("shops")
        .insert({
          shop_name: formShopName,
          slug: formSlug.toLowerCase().replace(/\s+/g, "-"),
          description: formDesc,
          email: formEmail,
          phone: formPhone,
          city: formCity,
          country: formCountry,
          owner_id: formOwnerId,
          category_id: formCatId || null,
          plan_name: "free",
          is_verified: true
        });

      if (error) throw error;
      toast.success("Organization created successfully!");
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setSubmittingForm(false);
    }
  }

  // Open Edit Form
  function handleOpenEdit(shop) {
    setEditingShop(shop);
    setFormShopName(shop.shop_name || "");
    setFormSlug(shop.slug || "");
    setFormDesc(shop.description || "");
    setFormEmail(shop.email || "");
    setFormPhone(shop.phone || "");
    setFormCity(shop.city || "");
    setFormCountry(shop.country || "India");
    setFormCatId(shop.category_id || "");
    setIsEditOpen(true);
  }

  // Handle Edit Submission
  async function handleEditShop(e) {
    e.preventDefault();
    if (!formShopName.trim() || !formSlug.trim()) {
      toast.error("Shop name and Slug are required!");
      return;
    }
    setSubmittingForm(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          shop_name: formShopName,
          slug: formSlug.toLowerCase().replace(/\s+/g, "-"),
          description: formDesc,
          email: formEmail,
          phone: formPhone,
          city: formCity,
          country: formCountry,
          category_id: formCatId || null
        })
        .eq("id", editingShop.id);

      if (error) throw error;
      toast.success("Organization updated successfully!");
      setIsEditOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update organization");
    } finally {
      setSubmittingForm(false);
    }
  }

  // Handle shop deletion
  async function handleDeleteShop(shopId, shopName) {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete the organization "${shopName}"? This will drop all associated products, call logs, and widget profiles.`)) return;
    try {
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("id", shopId);

      if (error) throw error;
      toast.success("Organization deleted permanently");
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to delete organization");
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
    <div className="space-y-4 md:space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Organizations</h1>
          <p className="mt-1 text-xs text-slate-500">Moderate tenant subscriptions, toggle API integration permissions, and view active usages.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-slate-900 hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </Button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid gap-4 grid-cols-3 max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Tenants</p>
            <p className="text-xl font-bold tracking-tight text-slate-900">{stats.total}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Building className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active</p>
            <p className="text-xl font-bold tracking-tight text-emerald-400">{stats.approved}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
        </div>

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

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by store name, admin profile name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Plan:</span>
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
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
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

      {/* Organizations List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4.5">Organization / brand</th>
                <th className="px-6 py-4.5">Admin Profile</th>
                <th className="px-6 py-4.5">Subscription Level</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
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
                        <div 
                          onClick={() => handleOpenDetails(s)}
                          className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                        >
                          {s.logo_url ? (
                            <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Building className="h-4.5 w-4.5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <span 
                            onClick={() => handleOpenDetails(s)}
                            className="font-bold text-slate-900 block text-sm cursor-pointer hover:text-blue-400 transition-colors"
                          >
                            {s.shop_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block uppercase">
                            Slug: {s.slug || "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Owner Contact */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{ownerName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{ownerEmail}</div>
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
                        {isApproved ? "Approved" : "Suspended"}
                      </span>
                    </td>

                    {/* Toggle and Edit Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Suspend Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(s)}
                          disabled={toggleStatus.isPending}
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                        >
                          {isApproved ? (
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-700" />
                          )}
                        </button>

                        {/* Edit details */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-amber-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>

                        {/* Permanent Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteShop(s.id, s.shop_name)}
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 cursor-pointer"
                          title="Delete Organization"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredShops.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Store className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No organizations found</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the filters above.</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS DRAWER MODAL */}
      <AnimatePresence>
        {selectedShop && (
          <div className="fixed inset-0 bg-white shadow-sm/40 backdrop-blur-sm z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 200 }}
              className="w-full max-w-md h-full bg-white border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto space-y-6 shadow-xl shadow-slate-200/50"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Tenant Overview</h2>
                  </div>
                  <Button 
                    onClick={() => setSelectedShop(null)}
                    className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Main Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                      {selectedShop.logo_url ? <img src={selectedShop.logo_url} alt="" className="h-full w-full object-cover" /> : "🏪"}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{selectedShop.shop_name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {selectedShop.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white shadow-sm p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plan Active</p>
                      <p className="text-slate-900 capitalize font-extrabold mt-0.5">{selectedShop.plan_name || "free"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</p>
                      <p className="text-slate-900 font-extrabold mt-0.5">{selectedShop.is_verified ? "Approved" : "Suspended"}</p>
                    </div>
                  </div>
                </div>

                {/* Usage metrics logs */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Month-to-Date Usage Metrics</h4>
                  {loadingUsage ? (
                    <div className="flex py-6 justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Calls */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-sm/10">
                        <div className="flex items-center gap-2 text-xs">
                          <Activity className="h-4 w-4 text-indigo-400" />
                          <span>Monthly Video Calls</span>
                        </div>
                        <span className="font-bold text-slate-900 text-xs">{selectedShopUsage.calls} calls</span>
                      </div>
                      
                      {/* Products */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-sm/10">
                        <div className="flex items-center gap-2 text-xs">
                          <Layers className="h-4 w-4 text-emerald-400" />
                          <span>Catalog Items (Products)</span>
                        </div>
                        <span className="font-bold text-slate-900 text-xs">{selectedShopUsage.products} items</span>
                      </div>

                      {/* Orders */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-sm/10">
                        <div className="flex items-center gap-2 text-xs">
                          <DollarSign className="h-4 w-4 text-amber-400" />
                          <span>Transactions Flow Volume</span>
                        </div>
                        <span className="font-bold text-slate-900 text-xs">₹{selectedShopUsage.orders.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Widget Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Widget Configuration</h4>
                  <div className="bg-white shadow-sm p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                    <p>Widget Color: <span className="font-bold text-slate-900 uppercase">{selectedShop.widget_color || "#2563eb"}</span></p>
                    <p>Widget Position: <span className="font-bold text-slate-900 capitalize">{selectedShop.widget_position || "bottom-right"}</span></p>
                    <p>Widget Token API Key: <span className="font-mono text-slate-500 font-bold block bg-slate-50 p-2 mt-1 rounded text-[10px] select-all">{selectedShop.id}</span></p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-xs">
                <Button 
                  onClick={() => handleOpenEdit(selectedShop)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Edit Shop details
                </Button>
                <Button 
                  onClick={() => setSelectedShop(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold cursor-pointer"
                >
                  Close Drawer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-white shadow-sm/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50 overflow-y-auto max-h-[90vh]"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Create Organization</h2>
                <p className="text-[10px] text-slate-500 mt-1">Deploy a new tenant instance directly on the platform.</p>
              </div>

              <form onSubmit={handleCreateShop} className="space-y-4 text-xs">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Name</label>
                    <input
                      type="text"
                      value={formShopName}
                      onChange={(e) => {
                        setFormShopName(e.target.value);
                        setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                      placeholder="Nike India"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Slug URL</label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Merchant Owner</label>
                    <select
                      value={formOwnerId}
                      onChange={(e) => setFormOwnerId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    >
                      {availableSellers.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                      ))}
                      {availableSellers.length === 0 && (
                        <option value="">No sellers found. Register one first.</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Category / Vertical</label>
                    <select
                      value={formCatId}
                      onChange={(e) => setFormCatId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex gap-3 justify-end text-xs">
                  <Button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingForm}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold cursor-pointer"
                  >
                    {submittingForm && <Loader2 className="h-3 w-3 animate-spin" />}
                    Confirm Deploy
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 bg-white shadow-sm/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50 overflow-y-auto max-h-[90vh]"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Edit Organization</h2>
                <p className="text-[10px] text-slate-500 mt-1">Modify tenant meta configuration parameters.</p>
              </div>

              <form onSubmit={handleEditShop} className="space-y-4 text-xs">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Name</label>
                    <input
                      type="text"
                      value={formShopName}
                      onChange={(e) => setFormShopName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Slug URL</label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">City</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Category / Vertical</label>
                    <select
                      value={formCatId}
                      onChange={(e) => setFormCatId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex gap-3 justify-end text-xs">
                  <Button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingForm}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold cursor-pointer"
                  >
                    {submittingForm && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save Details
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
