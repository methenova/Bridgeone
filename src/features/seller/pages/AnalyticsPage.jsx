import { useMemo, useState, useEffect } from "react";
import useSellerShop from "../hooks/useSellerShop";
import { useSellerOrders } from "../hooks/useSellerOrders";
import { supabase } from "@/config/supabase";
import { TrendingUp, ShoppingBag, Package, BadgeDollarSign, Video, PhoneCall, PhoneMissed, Clock, Loader2 } from "lucide-react";

import LineChartSVG from "@/components/common/Charts/LineChartSVG";
import DonutChartSVG from "@/components/common/Charts/DonutChartSVG";


export default function AnalyticsPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

  const { data: orders = [], isLoading } = useSellerOrders(shopId);

  // Widget Calls state
  const [calls, setCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(true);

  // Fetch calls logs
  useEffect(() => {
    if (!shopId) return;

    async function loadCalls() {
      try {
        const { data, error } = await supabase
          .from("call_logs")
          .select("*")
          .eq("shop_id", shopId);

        if (error) throw error;
        setCalls(data || []);
      } catch (err) {
        console.warn("[Analytics] Failed to fetch calls:", err);
      } finally {
        setLoadingCalls(false);
      }
    }

    loadCalls();
  }, [shopId]);

  // 1. Calculate General metrics
  const metrics = useMemo(() => {
    let revenue = 0;
    let itemsCount = 0;
    const completedOrders = orders.filter((o) => o.status !== "cancelled");
    const totalOrdersCount = completedOrders.length;

    completedOrders.forEach((order) => {
      revenue += order.shopTotal;
      order.items.forEach((item) => {
        itemsCount += item.quantity;
      });
    });

    const averageOrderValue = totalOrdersCount > 0 ? Math.round(revenue / totalOrdersCount) : 0;

    return {
      revenue,
      itemsCount,
      totalOrdersCount,
      averageOrderValue,
    };
  }, [orders]);

  // Call stats calculator
  const callStats = useMemo(() => {
    const total = calls.length;
    const connected = calls.filter((c) => c.status === "completed" || c.duration > 0).length;
    const missed = total - connected;
    
    let totalDur = 0;
    calls.forEach((c) => {
      totalDur += c.duration || 0;
    });

    const avgDuration = connected > 0 ? Math.round(totalDur / connected) : 0;

    return { total, connected, missed, avgDuration };
  }, [calls]);

  // 2. Sales Over Time (Last 7 Days Sales)
  const salesOverTime = useMemo(() => {
    const dailyMap = {};
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString(undefined, { weekday: "short" });
    }).reverse();

    last7Days.forEach((day) => {
      dailyMap[day] = 0;
    });

    orders.filter((o) => o.status !== "cancelled").forEach((order) => {
      const day = new Date(order.created_at).toLocaleDateString(undefined, { weekday: "short" });
      if (day in dailyMap) {
        dailyMap[day] += order.shopTotal;
      }
    });

    return Object.entries(dailyMap).map(([label, value]) => ({ label, value }));
  }, [orders]);

  // 3. Sales By Product Category
  const salesByCategory = useMemo(() => {
    const catMap = {};
    orders.filter((o) => o.status !== "cancelled").forEach((order) => {
      order.items.forEach((item) => {
        const cat = item.product?.categories?.name || "Uncategorized";
        catMap[cat] = (catMap[cat] || 0) + item.total;
      });
    });

    return Object.entries(catMap).map(([label, value]) => ({ label, value }));
  }, [orders]);

  // 4. Top Selling Products
  const topProducts = useMemo(() => {
    const prodMap = {};
    orders.filter((o) => o.status !== "cancelled").forEach((order) => {
      order.items.forEach((item) => {
        const prodId = item.productId;
        if (!prodMap[prodId]) {
          prodMap[prodId] = {
            name: item.product?.name || "Product",
            thumbnail: item.product?.thumbnail_url || "",
            quantity: 0,
            revenue: 0,
          };
        }
        prodMap[prodId].quantity += item.quantity;
        prodMap[prodId].revenue += item.total;
      });
    });

    return Object.values(prodMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const formatDuration = (sec) => {
    if (!sec) return "0s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (shopLoading || isLoading || loadingCalls) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          ⚠️
        </div>
        <h3 className="text-xl font-semibold text-white">No Shop Found</h3>
        <p className="mt-2 text-slate-400 max-w-sm">
          Please build your shop first to unlock business analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-1 text-slate-400">
          Detailed sales projections, video call metrics, and performance insights for {shop.name}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
        {/* Revenue */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</p>
            <p className="mt-2 text-2xl font-bold text-white">₹{metrics.revenue.toLocaleString()}</p>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Orders Count */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
            <p className="mt-2 text-2xl font-bold text-white">{metrics.totalOrdersCount}</p>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        {/* Items Count */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items Sold</p>
            <p className="mt-2 text-2xl font-bold text-white">{metrics.itemsCount}</p>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Package className="h-5 w-5" />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Order Value</p>
            <p className="mt-2 text-2xl font-bold text-white">₹{metrics.averageOrderValue.toLocaleString()}</p>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Call Consultation Insights Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-400" />
          Live Call Widget Insights
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Total Calls */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Consultations</p>
              <p className="mt-2 text-xl font-bold text-white">{callStats.total}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <Video className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Connected */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connected</p>
              <p className="mt-2 text-xl font-bold text-green-400">{callStats.connected}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-green-500/10 text-green-400">
              <PhoneCall className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Missed */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed / Unanswered</p>
              <p className="mt-2 text-xl font-bold text-rose-400">{callStats.missed}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <PhoneMissed className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Avg Duration */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Duration</p>
              <p className="mt-2 text-xl font-bold text-white">{formatDuration(callStats.avgDuration)}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800/60 text-slate-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>

        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Over Time */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Weekly Performance</h3>
          <LineChartSVG data={salesOverTime} />
        </div>

        {/* Category Portions */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Category Distribution</h3>
          <DonutChartSVG data={salesByCategory} />
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Top Performing Products</h3>
        <div className="divide-y divide-slate-800">
          {topProducts.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center">
                  {p.thumbnail ? <img src={p.thumbnail} alt="" className="h-full w-full object-cover" /> : "📦"}
                </div>
                <div>
                  <p className="font-bold text-white max-w-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.quantity} units sold</p>
                </div>
              </div>
              <p className="font-bold text-white">₹{p.revenue.toLocaleString()}</p>
            </div>
          ))}
          {topProducts.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">No transactions registered yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
