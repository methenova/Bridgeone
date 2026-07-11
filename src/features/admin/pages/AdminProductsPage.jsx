import { useState, useMemo } from "react";
import { 
  Package, 
  Star, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  ShoppingBag 
} from "lucide-react";
import { motion } from "framer-motion";

import { useAdminProducts, useToggleProductActive, useToggleProductFeatured } from "../hooks/useAdmin";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";
import { Button } from "@/components/ui/button";
import AdminTableSkeleton from "@/features/admin/components/skeletons/AdminTableSkeleton";

export default function AdminProductsPage() {
  const { data: products = [], isLoading } = useAdminProducts();
  const toggleActive = useToggleProductActive();
  const toggleFeatured = useToggleProductFeatured();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");

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

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.shops?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || (p.categories?.name || "").toLowerCase() === categoryFilter.toLowerCase();
      
      const matchesFeatured = 
        featuredFilter === "all" ||
        (featuredFilter === "featured" && p.featured) ||
        (featuredFilter === "standard" && !p.featured);

      return matchesSearch && matchesCategory && matchesFeatured;
    });
  }, [products, searchQuery, categoryFilter, featuredFilter]);

  // Extract unique categories list
  const categoriesList = useMemo(() => {
    const list = new Set();
    products.forEach((p) => {
      if (p.categories?.name) list.add(p.categories.name);
    });
    return Array.from(list);
  }, [products]);

  // Stats Card data
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.is_active).length;
    const featured = products.filter(p => p.featured).length;
    return { total, active, featured };
  }, [products]);

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
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Products</h1>
        <p className="mt-1 text-xs text-slate-500">Manage, feature, and audit active product listings across the live commerce marketplace.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-3 max-w-3xl">
        {/* Total Products */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Products</p>
            <p className="text-xl font-bold tracking-tight">{stats.total}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Package className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Active Listings */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Listings</p>
            <p className="text-xl font-bold tracking-tight text-emerald-400">{stats.active}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Featured Showcase */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Featured Items</p>
            <p className="text-xl font-bold tracking-tight text-amber-400">{stats.featured}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Star className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Utility Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by product name, shop, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 transition-colors"
          />
        </div>

        {/* Category & Status Filter */}
        <div className="flex items-center gap-3.5">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Featured Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Showcase:</span>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All Items</option>
              <option value="featured">Featured Only</option>
              <option value="standard">Standard Only</option>
            </select>
          </div>
        </div>

      </div>

      {/* Products Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-5 align-middle">Product</th>
                <th className="px-6 py-5 align-middle">Merchant Shop</th>
                <th className="px-6 py-5 align-middle">Category</th>
                <th className="px-6 py-5 align-middle">Price</th>
                <th className="px-6 py-5 align-middle text-center">Featured</th>
                <th className="px-6 py-5 align-middle text-center">Visibility</th>
                <th className="px-6 py-5 align-middle text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
              {filteredProducts.map((p, idx) => {
                const displayPrice = p.discount_price ? Number(p.discount_price) : Number(p.price);
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={p.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Thumbnail + SKU */}
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center font-bold text-slate-500">
                          {p.thumbnail_url ? (
                            <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            "📦"
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-sm max-w-[180px] truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                            SKU: {p.sku || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Shop Name */}
                    <td className="px-6 py-5 align-middle text-slate-900 font-semibold">
                      {p.shops?.name || "—"}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-5 align-middle text-slate-500 font-medium">
                      {p.categories?.name || "Uncategorized"}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-5 align-middle font-bold text-slate-900">
                      ₹{displayPrice.toLocaleString()}
                    </td>

                    {/* Featured Star Toggle */}
                    <td className="px-6 py-5 align-middle text-center">
                      <Button
                        onClick={() => handleToggleFeatured(p)}
                        disabled={toggleFeatured.isPending}
                        title={p.featured ? "Remove from Featured" : "Make Featured"}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                          p.featured
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-slate-200 bg-white shadow-sm/40 text-slate-650 hover:text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${p.featured ? "fill-amber-400" : ""}`} />
                      </Button>
                    </td>

                    {/* Active Status Badge */}
                    <td className="px-6 py-5 align-middle text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                        p.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="px-6 py-5 align-middle text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          disabled={toggleActive.isPending}
                          title={p.is_active ? "Deactivate Product" : "Activate Product"}
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                        >
                          {p.is_active ? (
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-700" />
                          )}
                        </button>
                      </div>
                    </td>

                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Package className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No Products Registered</p>
              <p className="text-xs text-slate-500 mt-1">Products published by vendors will list here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
