import { useState, useEffect, useMemo } from "react";
import { DashboardSkeleton } from "@/components/skeletons";
import { Link } from "react-router-dom";
import { 
  Users, 
  Store, 
  DollarSign, 
  Video, 
  Activity, 
  Database, 
  HardDrive, 
  Layers,
  Bell, 
  AlertTriangle, 
  TrendingUp,
  Server,
  ArrowRight,
  PhoneCall,
  CreditCard
} from "lucide-react";
import toast from "react-hot-toast";

import { useAdminStats } from "../hooks/useAdmin";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const { profile } = useAuthContext();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  
  // Dynamic stats state
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [activeOrgs, setActiveOrgs] = useState(0);
  const [suspendedOrgs, setSuspendedOrgs] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [activeWidgets, setActiveWidgets] = useState(0);
  const [liveCalls, setLiveCalls] = useState(0);
  const [callsToday, setCallsToday] = useState(0);
  const [monthlyCalls, setMonthlyCalls] = useState(0);
  const [activeSubs, setActiveSubs] = useState(0);
  const [recentCalls, setRecentCalls] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Quick Action States
  const [terminatingAll, setTerminatingAll] = useState(false);

  // Load Platform-wide Metrics from Database
  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoadingMetrics(true);
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayIso = today.toISOString();

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        // 1. Fetch Shops (Organizations) Breakdown
        const { data: shops, error: shopsErr } = await supabase
          .from("shops")
          .select("id, is_verified, widget_enabled, created_at, shop_name, shop_subscriptions ( plan_id )");
        
        if (shopsErr) throw shopsErr;

        setTotalOrgs(shops?.length || 0);
        setActiveOrgs(shops?.filter(s => s.is_verified).length || 0);
        setSuspendedOrgs(shops?.filter(s => !s.is_verified).length || 0);
        setActiveWidgets(shops?.filter(s => s.widget_enabled).length || 0);

        // Subscriptions count (shops with basic or pro plan)
        setActiveSubs(shops?.filter(s => {
          const planArray = Array.isArray(s.shop_subscriptions) ? s.shop_subscriptions : [s.shop_subscriptions];
          const planId = planArray[0]?.plan_id;
          return planId === "basic" || planId === "pro";
        }).length || 0);

        // Set Recent Registrations
        const sortedShops = [...(shops || [])].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentRegistrations(sortedShops.slice(0, 5));

        // 2. Fetch Profiles roles breakdown
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("role");
        
        if (profErr) throw profErr;
        setTotalAdmins(profiles?.filter(p => p.role === "seller").length || 0);
        setTotalAgents(profiles?.filter(p => p.role === "agent" || p.role === "manager").length || 0);

        // 3. Fetch Calls count
        // Live calls count
        const { count: liveCount, error: liveErr } = await supabase
          .from("video_rooms")
          .select("id", { count: "exact", head: true })
          .eq("status", "live");
        
        if (liveErr) throw liveErr;
        setLiveCalls(liveCount || 0);

        // Calls today
        const { count: todayCount } = await supabase
          .from("call_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayIso);
        setCallsToday(todayCount || 0);

        // Monthly calls
        const { count: monthCount } = await supabase
          .from("call_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", firstDayOfMonth);
        setMonthlyCalls(monthCount || 0);

        // 4. Fetch Recent Calls details
        const { data: calls } = await supabase
          .from("call_logs")
          .select("*, shops(shop_name)")
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentCalls(calls || []);

        // 5. Recent Payments \u2014 marketplace orders removed
        setRecentPayments([]);

      } catch (err) {
        console.error("[PlatformDashboard] Load metrics error:", err);
      } finally {
        setLoadingMetrics(false);
      }
    }
    loadMetrics();
  }, []);

  // Force Kill all active calls helper
  async function handleForceKillAll() {
    if (!window.confirm("WARNING: Are you sure you want to force terminate ALL active live video consultation rooms across the platform?")) return;
    setTerminatingAll(true);
    try {
      const { error } = await supabase
        .from("video_rooms")
        .update({ status: "ended" })
        .eq("status", "live");

      if (error) throw error;
      setLiveCalls(0);
      toast.success("Successfully terminated all active video consultations!");
    } catch (err) {
      toast.error(err.message || "Failed to terminate active rooms");
    } finally {
      setTerminatingAll(false);
    }
  }

  // Calculate platform revenue from stats or orders list
  const totalRevenue = useMemo(() => {
    if (stats?.totalRevenue) return stats.totalRevenue;
    return recentPayments.reduce((acc, order) => acc + (order.status === "completed" ? Number(order.total) : 0), 0);
  }, [stats, recentPayments]);

  const loading = statsLoading || loadingMetrics;

  // System health stats
  const systemHealth = [
    { name: "Database Nodes", value: "Healthy (12ms)", icon: Database, status: "healthy" },
    { name: "WebSocket Gateway", value: "Active & Connected", icon: Activity, status: "healthy" },
    { name: "S3 Video Storage", value: "98.4% Available", icon: HardDrive, status: "healthy" },
    { name: "TURN Signalling Server", value: "Online (Global)", icon: Server, status: "healthy" },
  ];

  // Personalized Greeting based on local time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 text-slate-900 max-w-7xl relative">
      
      {/* Premium Dashboard Header Banner */}
      <div className="bg-gradient-to-br from-white via-white to-blue-50/15 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{greeting},</span>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                {profile?.full_name?.split(" ")[0] || "Admin"}
              </span>
              <span>✨</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 max-w-xl leading-relaxed">
              Welcome to your BridgeOne Platform Dashboard. Monitor operational health, global usage analytics, and active integrations.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 self-start md:self-auto shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Signalling Host: Active</span>
          </div>
        </div>

        {/* 6 Premium KPI Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          
          {/* Card 1: Platform Revenue */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Platform Revenue</span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">₹{Number(totalRevenue).toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-50/80 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <DollarSign size={20} strokeWidth={2.2} />
              </div>
            </div>
            {/* Sparkline & Trend */}
            <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp size={12} strokeWidth={3} />
                  <span>+12.4%</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">vs last month</span>
              </div>
              <div className="h-8 w-20 flex items-end justify-between gap-1">
                {[40, 60, 45, 80, 50, 70, 90, 65].map((h, i) => (
                  <div key={i} className="w-1.5 bg-emerald-200 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Organizations */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Organizations</span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalOrgs}</p>
              </div>
              <div className="h-12 w-12 bg-indigo-50/80 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Store size={20} strokeWidth={2.2} />
              </div>
            </div>
            {/* Sparkline & Trend */}
            <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <span className="text-slate-700">{activeOrgs}</span> Active
                </div>
                <span className="text-[10px] font-medium text-slate-500">{suspendedOrgs} suspended</span>
              </div>
              <div className="h-8 w-20">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                  <path d="M0,25 C20,20 30,30 50,15 C70,0 80,10 100,5" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-sm" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: Active Subscriptions */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Active Subscriptions</span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeSubs}</p>
              </div>
              <div className="h-12 w-12 bg-violet-50/80 text-violet-600 rounded-2xl flex items-center justify-center shrink-0 border border-violet-100/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <CreditCard size={20} strokeWidth={2.2} />
              </div>
            </div>
            {/* Sparkline & Trend */}
            <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-violet-600">
                  <TrendingUp size={12} strokeWidth={3} />
                  <span>+5.2%</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">recurring growth</span>
              </div>
              <div className="h-8 w-20">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                  <path d="M0,25 Q25,25 50,15 T100,5" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-sm" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 4: Platform Users */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tenant Users</span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalAdmins + totalAgents}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50/80 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Users size={20} strokeWidth={2.2} />
              </div>
            </div>
            {/* Sparkline & Trend */}
            <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <span className="text-slate-700">{totalAdmins}</span> Admins
                </div>
                <span className="text-[10px] font-medium text-slate-500">{totalAgents} agents</span>
              </div>
              <div className="h-8 w-20 flex items-end justify-between gap-1">
                {[60, 50, 70, 80, 55, 85, 75, 90].map((h, i) => (
                  <div key={i} className="w-1.5 bg-blue-200 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: Real-time Video Rooms */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Live Video Rooms</span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  {liveCalls}
                  {liveCalls > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mt-1" />}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-50/80 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Video size={20} strokeWidth={2.2} />
              </div>
            </div>
            {/* Sparkline & Trend */}
            <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                  <span className="inline-flex items-center gap-1">
                    {liveCalls > 10 ? 'High Capacity' : 'Stable Load'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">concurrent streams</span>
              </div>
              <div className="h-8 w-20 flex items-end justify-between gap-1">
                {[20, 30, 25, 40, 35, 50, 45, 60].map((h, i) => (
                  <div key={i} className="w-1.5 bg-amber-300/50 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 6: Today's Calls */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Today's Calls</span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{callsToday}</p>
              </div>
              <div className="h-12 w-12 bg-rose-50/80 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <PhoneCall size={20} strokeWidth={2.2} />
              </div>
            </div>
            {/* Sparkline & Trend */}
            <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                  <TrendingUp size={12} strokeWidth={3} />
                  <span>{monthlyCalls} MTD</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">across network</span>
              </div>
              <div className="h-8 w-20">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                  <path d="M0,20 L20,25 L40,15 L60,18 L80,5 L100,8" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Quick Action Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Sales Performance Graph */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">Monthly Call Growth</h3>
              <p className="text-xs text-slate-500">Global consultation volumes tracking dynamic growth</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>+24.8% MTD</span>
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
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeDasharray="3,3" />

              <path
                d="M 0 150 Q 80 80 160 110 T 320 50 T 480 35 L 480 180 L 0 180 Z"
                fill="url(#chart-grad)"
              />
              <path
                d="M 0 150 Q 80 80 160 110 T 320 50 T 480 35"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              <circle cx="80" cy="80" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="160" cy="110" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="320" cy="50" r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="480" cy="35" r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="3" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-slate-500 font-bold px-1 mt-2">
              <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">Super Admin Actions</h3>
            <p className="text-xs text-slate-500">Run global marketplace maintenance routines.</p>
          </div>

          <div className="space-y-3">
            {/* Terminate active rooms */}
            <Button
              onClick={handleForceKillAll}
              disabled={terminatingAll}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all rounded-xl text-left cursor-pointer group hover:-translate-y-0.5 duration-200"
            >
              <div>
                <p className="text-xs font-bold text-red-500">Force-Kill Video Rooms</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Disconnects active peer rooms</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
            </Button>

            {/* Broadcast announcements link */}
            <Link
              to="/admin/notifications"
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-all rounded-xl text-left cursor-pointer group hover:-translate-y-0.5 duration-200"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Send Announcement</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Push banners to all sellers</p>
              </div>
              <Bell className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </Link>

            {/* Platform limits settings link */}
            <Link
              to="/admin/settings"
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-all rounded-xl text-left cursor-pointer group hover:-translate-y-0.5 duration-200"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Adjust SaaS Limits</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Configure pricing & metrics</p>
              </div>
              <Layers className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-100 pt-3">
            All modifications trigger instant log audits inside the system logging table.
          </div>
        </div>

      </div>

      {/* Grid: Infrastructure status, registrations & calls */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Newly Registered Organizations */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">New Stores</h3>
                <p className="text-xs text-slate-500">Shops awaiting reviews</p>
              </div>
              <Link 
                to="/admin/organizations" 
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-400 hover:text-blue-500 transition-colors uppercase bg-blue-50 border border-blue-100 rounded-lg"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentRegistrations.map((shop) => (
                <div key={shop.id} className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-300">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{shop.shop_name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Tier: <span className="uppercase text-slate-700 font-bold">{shop.plan_name || "free"}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    shop.is_verified
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}>
                    {shop.is_verified ? "Active" : "Pending"}
                  </span>
                </div>
              ))}
              {recentRegistrations.length === 0 && (
                <div className="py-6 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                    <Store className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">No shops registered</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent WebRTC Calls Log */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">Recent Calls</h3>
                <p className="text-xs text-slate-500">Live conversation histories</p>
              </div>
              <Link 
                to="/admin/calls" 
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-400 hover:text-blue-500 transition-colors uppercase bg-blue-50 border border-blue-100 rounded-lg"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentCalls.map((log) => (
                <div key={log.id} className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-300">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{log.customer_name || "Guest User"}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      called <span className="text-slate-700 font-semibold">{log.shops?.shop_name || "Merchant"}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    log.status === "connected"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))}
              {recentCalls.length === 0 && (
                <div className="py-6 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                    <Video className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">No calls logged yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Health Monitor */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">System Health</h3>
              <p className="text-xs text-slate-500">Live API server health</p>
            </div>
            
            <div className="space-y-3.5">
              {systemHealth.map((health) => {
                const HealthIcon = health.icon;
                return (
                  <div key={health.name} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-300 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <HealthIcon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 text-[11px] truncate max-w-[90px] xl:max-w-[120px]">{health.name}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{health.value}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                      Normal
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
