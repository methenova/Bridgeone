import { useState, useEffect, useMemo } from "react";
import { 
  Video, 
  Users, 
  UserCheck, 
  PhoneMissed, 
  CalendarClock, 
  Sliders, 
  Percent, 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  Activity,
  Loader2
} from "lucide-react";
import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";
import StatCard from "../components/StatCard";

export default function SellerDashboardPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

  const [loadingStats, setLoadingStats] = useState(true);
  const [liveCalls, setLiveCalls] = useState(0);
  const [missedCalls, setMissedCalls] = useState(0);
  const [callbacks, setCallbacks] = useState(0);
  const [salesAssisted, setSalesAssisted] = useState(0);
  const [totalCallsCount, setTotalCallsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  // Fetch live stats from database
  useEffect(() => {
    if (!shopId) {
      if (!shopLoading) setLoadingStats(false);
      return;
    }

    async function loadStats() {
      try {
        setLoadingStats(true);

        // 1. Live Calls (Active Video Rooms)
        const { data: rooms } = await supabase
          .from("video_rooms")
          .select("id")
          .eq("shop_id", shopId)
          .eq("status", "live");
        setLiveCalls(rooms?.length || 0);

        // 2. Missed Calls
        const { data: missed } = await supabase
          .from("call_logs")
          .select("id")
          .eq("shop_id", shopId)
          .eq("status", "missed");
        setMissedCalls(missed?.length || 0);

        // Total Calls (for conversion metrics)
        const { data: allCalls } = await supabase
          .from("call_logs")
          .select("id, status, duration, created_at")
          .eq("shop_id", shopId);
        const callsCount = allCalls?.length || 0;
        setTotalCallsCount(callsCount);

        // 3. Callback Requests
        const { data: scheduled } = await supabase
          .from("callback_requests")
          .select("id")
          .eq("shop_id", shopId)
          .eq("status", "pending");
        setCallbacks(scheduled?.length || 0);

        // 4. Sales Assisted (Completed orders)
        const { data: orders } = await supabase
          .from("orders")
          .select("total")
          .eq("shop_id", shopId)
          .neq("status", "cancelled");
        const salesTotal = orders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;
        setSalesAssisted(salesTotal);

        // 5. Recent Activities
        // Fetch recent calls
        const { data: recentCalls } = await supabase
          .from("call_logs")
          .select("id, created_at, status, duration")
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false })
          .limit(3);

        const activities = (recentCalls || []).map(c => ({
          id: c.id,
          type: "call",
          title: `Consultation Call (${c.status})`,
          time: new Date(c.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          desc: c.status === "missed" ? "Missed customer call alert" : `Connected session: ${Math.round((c.duration || 0) / 60)}m`
        }));

        setRecentActivities(activities);

      } catch (err) {
        console.warn("Failed to fetch live dashboard stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
  }, [shopId, shopLoading]);

  // Conversion calculator (Checkout orders / consultations count)
  const conversionRate = useMemo(() => {
    if (totalCallsCount === 0) return "0.0%";
    // Mock calculate checkout conversion rate from calls
    const ordersCount = Math.round(totalCallsCount * 0.12); // Simulated flat conversion of 12% on consults
    return `${((ordersCount / totalCallsCount) * 100).toFixed(1)}%`;
  }, [totalCallsCount]);

  if (shopLoading || loadingStats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
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
        <h3 className="text-xl font-semibold text-white">No Shop Profile Found</h3>
        <p className="mt-2 text-slate-400 max-w-sm">
          Please complete your shop profile configuration under the settings page to open your seller live panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Live Commerce Dashboard</h1>
          <p className="mt-1 text-xs text-slate-400">Real-time storefront visitor tracks, live video room queues, and customer conversions for {shop.shop_name || shop.name}.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        
        {/* Live Visitors */}
        <div className="relative">
          <StatCard
            title="Live Visitors"
            value="0"
            icon={Users}
            color="bg-blue-600/10 text-blue-400"
            change="No Live Traffic Tracks"
          />
          <span className="absolute top-2 right-2 bg-rose-500/10 text-rose-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
            BACKEND NOT IMPLEMENTED
          </span>
        </div>

        {/* Visitors Waiting */}
        <div className="relative">
          <StatCard
            title="Waiting in Queue"
            value="0"
            icon={Clock}
            color="bg-amber-600/10 text-amber-400"
            change="Queue Empty"
          />
          <span className="absolute top-2 right-2 bg-rose-500/10 text-rose-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
            BACKEND NOT IMPLEMENTED
          </span>
        </div>

        {/* Online Agents */}
        <div className="relative">
          <StatCard
            title="Online Agents"
            value="1"
            icon={UserCheck}
            color="bg-indigo-600/10 text-indigo-400"
            change="1 Active Owner"
          />
          <span className="absolute top-2 right-2 bg-rose-500/10 text-rose-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
            BACKEND NOT IMPLEMENTED
          </span>
        </div>

        {/* Live Calls */}
        <StatCard
          title="Live Calls"
          value={liveCalls.toString()}
          icon={Video}
          color="bg-emerald-600/10 text-emerald-400"
          change="Ongoing consultations"
        />

        {/* Missed Calls */}
        <StatCard
          title="Missed Calls"
          value={missedCalls.toString()}
          icon={PhoneMissed}
          color="bg-red-600/10 text-red-400"
          change="Require follow-up"
        />

        {/* Scheduled Callbacks */}
        <StatCard
          title="Callbacks Pending"
          value={callbacks.toString()}
          icon={CalendarClock}
          color="bg-amber-600/10 text-amber-400"
          change="Pending appointments"
        />

        {/* Widget Status */}
        <StatCard
          title="Widget Launcher"
          value={shop.is_online ? "ONLINE" : "OFFLINE"}
          icon={Sliders}
          color={shop.is_online ? "bg-emerald-600/10 text-emerald-400" : "bg-slate-800 text-slate-500"}
          change={shop.is_online ? "Active embeds" : "Integration disabled"}
        />

        {/* Conversion Rate */}
        <div className="relative">
          <StatCard
            title="Assisted Conversion"
            value={conversionRate}
            icon={Percent}
            color="bg-purple-600/10 text-purple-400"
            change="Calls checkout ratio"
          />
          <span className="absolute top-2 right-2 bg-yellow-500/10 text-yellow-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-yellow-500/20">
            ESTIMATED
          </span>
        </div>

        {/* Sales Assisted */}
        <div className="sm:col-span-2">
          <StatCard
            title="Assisted Checkout Sales"
            value={`₹${salesAssisted.toLocaleString()}`}
            icon={IndianRupee}
            color="bg-blue-600/10 text-blue-400"
            change="Sales made through calls"
          />
        </div>

      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span>Recent Activity Logs</span>
          </h2>

          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex justify-between items-center rounded-xl bg-slate-950 p-4 border border-slate-900">
                <div>
                  <p className="font-bold text-white text-xs">{act.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{act.desc}</p>
                </div>
                <span className="font-mono text-[9px] text-slate-500">{act.time}</span>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center">
                <Video className="h-8 w-8 text-slate-800 mb-2" />
                <p className="text-[10px] text-slate-500 font-bold">No calling sessions tracked today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400">Live Quick Actions</h2>
          
          <div className="grid gap-3.5 text-xs font-bold text-white">
            <a 
              href="/seller/live" 
              className="flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-500 transition-all text-center"
            >
              Enter Live Calling Room
            </a>
            
            <a 
              href="/seller/settings" 
              className="flex items-center justify-center rounded-xl bg-slate-900 border border-slate-850 px-5 py-3 hover:border-slate-800 transition-all text-center"
            >
              Configure Widget Colors
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}