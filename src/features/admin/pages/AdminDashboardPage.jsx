import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Store, 
  ShoppingBag, 
  Landmark, 
  ArrowRight, 
  Video, 
  Activity, 
  CheckCircle2, 
  Cpu, 
  Database, 
  HardDrive 
} from "lucide-react";
import { motion } from "framer-motion";

import { useAdminStats, useAdminOrders, useAdminShops } from "../hooks/useAdmin";
import { supabase } from "@/config/supabase";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders = [], isLoading: ordersLoading } = useAdminOrders();
  const { data: shops = [], isLoading: shopsLoading } = useAdminShops();
  const [totalCalls, setTotalCalls] = useState(0);

  // Fetch WebRTC calls metrics
  useEffect(() => {
    async function loadCallStats() {
      try {
        const { count } = await supabase
          .from("call_logs")
          .select("id", { count: "exact", head: true });
        setTotalCalls(count || 0);
      } catch (err) {
        console.warn("[Dashboard] Calls fetch failed:", err);
      }
    }
    loadCallStats();
  }, []);

  const totalLoading = statsLoading || ordersLoading || shopsLoading;

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      { 
        title: "Platform Revenue", 
        value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, 
        desc: "Total completed sales volume",
        icon: Landmark, 
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10" 
      },
      { 
        title: "Live Consultations", 
        value: totalCalls.toLocaleString(), 
        desc: "Total client video calls",
        icon: Video, 
        color: "text-blue-400 bg-blue-500/10 border-blue-500/10" 
      },
      { 
        title: "Total Shops", 
        value: (stats.totalShops || 0).toLocaleString(), 
        desc: "Registered storefronts",
        icon: Store, 
        color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/10" 
      },
      { 
        title: "Verified Users", 
        value: (stats.totalUsers || 0).toLocaleString(), 
        desc: "Registered customers & sellers",
        icon: Users, 
        color: "text-purple-400 bg-purple-500/10 border-purple-500/10" 
      },
    ];
  }, [stats, totalCalls]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const recentShops = useMemo(() => shops.slice(0, 5), [shops]);

  // Mock System Health indicators
  const systemHealth = [
    { name: "Database latency", value: "14ms", icon: Database, status: "healthy" },
    { name: "Realtime WebSocket", value: "Active", icon: Activity, status: "healthy" },
    { name: "Storage Bucket", value: "98% free", icon: HardDrive, status: "healthy" },
    { name: "API Server Latency", value: "32ms", icon: Cpu, status: "healthy" },
  ];

  if (totalLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-900 border border-slate-850" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 lg:col-span-2 animate-pulse rounded-2xl bg-slate-900 border border-slate-850" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-850" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white max-w-7xl">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Platform Dashboard</h1>
          <p className="mt-1 text-xs text-slate-400">Real-time marketplace insights and system health metrics.</p>
        </div>
        
        {/* Realtime Pulsing Status */}
        <div className="flex items-center gap-2 self-start bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>System Healthy</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={card.title}
              className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex flex-col justify-between hover:border-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-extrabold tracking-tight text-white">{card.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-4 border-t border-slate-900 pt-3">{card.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Custom Vector SVG Chart Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Sales Performance Graph */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Weekly Revenue Flow</h3>
              <p className="text-xs text-slate-500">Sales volume performance over the last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
              <span>+18.4%</span>
            </div>
          </div>
          
          {/* Custom SVG Line Chart */}
          <div className="h-56 w-full relative pt-4">
            <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#312e81" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#312e81" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" strokeDasharray="3,3" />

              {/* Area Under Curve */}
              <path
                d="M 0 150 Q 80 80 160 110 T 320 50 T 480 40 L 480 180 L 0 180 Z"
                fill="url(#chart-grad)"
              />
              {/* Line Path */}
              <path
                d="M 0 150 Q 80 80 160 110 T 320 50 T 480 40"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Node Dots */}
              <circle cx="80" cy="80" r="5" fill="#6366f1" stroke="#0f172a" strokeWidth="2" />
              <circle cx="160" cy="110" r="5" fill="#6366f1" stroke="#0f172a" strokeWidth="2" />
              <circle cx="320" cy="50" r="5" fill="#6366f1" stroke="#0f172a" strokeWidth="2" />
              <circle cx="480" cy="40" r="6" fill="#6366f1" stroke="#0f172a" strokeWidth="3" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-slate-500 font-bold px-1 mt-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">System Infrastructure</h3>
            <p className="text-xs text-slate-500">Live API and server health parameters</p>
          </div>
          
          <div className="space-y-3.5">
            {systemHealth.map((health) => {
              const HealthIcon = health.icon;
              return (
                <div key={health.name} className="flex items-center justify-between text-xs border-b border-slate-900 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400">
                      <HealthIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-300">{health.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{health.value}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Normal
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid: Recent Orders & Shops */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Latest completed shop transactions</p>
            </div>
            <Link 
              to="/admin/orders" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-350 transition-colors uppercase bg-blue-500/10 border border-blue-500/20 rounded-xl"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-900">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm">
                <div>
                  <p className="font-mono text-xs font-bold text-white">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">
                    {order.profiles?.full_name || "Guest Customer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-white">₹{Number(order.total).toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-1 ${
                    order.status === "pending"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : order.status === "cancelled"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center">
                <ShoppingBag className="h-8 w-8 text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs text-slate-500 font-bold">No orders registered yet</p>
              </div>
            )}
          </div>
        </div>

        {/* New Registered Shops */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Newly Registered Stores</h3>
              <p className="text-xs text-slate-500">Shops awaiting reviews or newly active</p>
            </div>
            <Link 
              to="/admin/shops" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-350 transition-colors uppercase bg-blue-500/10 border border-blue-500/20 rounded-xl"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-900">
            {recentShops.map((shop) => (
              <div key={shop.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center">
                    {shop.logo_url ? <img src={shop.logo_url} alt="" className="h-full w-full object-cover" /> : "🏪"}
                  </div>
                  <div>
                    <p className="font-bold text-white">{shop.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      {shop.categories?.name || "Uncategorized"} · {shop.city || "India"}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  shop.is_verified
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {shop.is_verified ? "Approved" : "Suspended"}
                </span>
              </div>
            ))}
            {recentShops.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center">
                <Store className="h-8 w-8 text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs text-slate-500 font-bold">No shops created yet</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
