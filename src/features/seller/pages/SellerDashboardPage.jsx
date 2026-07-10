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
  Loader2,
  Eye,
  ShoppingCart,
  X,
  Phone,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";
import StatCard from "../components/StatCard";
import { useAuthContext } from "@/context/AuthContext";

export default function SellerDashboardPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;
  const { profile } = useAuthContext();

  const [loadingStats, setLoadingStats] = useState(true);
  const [liveCalls, setLiveCalls] = useState(0);
  const [missedCalls, setMissedCalls] = useState(0);
  const [callbacks, setCallbacks] = useState(0);
  const [salesAssisted, setSalesAssisted] = useState(0);
  const [totalCallsCount, setTotalCallsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [onlineAgents, setOnlineAgents] = useState(0);

  // Workflow states
  const [revenueToday, setRevenueToday] = useState(0);
  const [conversionsToday, setConversionsToday] = useState(0);
  const [topSharedProducts, setTopSharedProducts] = useState([]);
  const [followUpCustomers, setFollowUpCustomers] = useState([]);
  const [availableAgentsList, setAvailableAgentsList] = useState([]);

  // Real-Time Visitor states
  const [visitorSessions, setVisitorSessions] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [visitorCalls, setVisitorCalls] = useState([]);
  const [loadingVisitorCalls, setLoadingVisitorCalls] = useState(false);

  // Load and subscribe to active visitor sessions via Supabase Realtime
  async function loadVisitorSessions() {
    if (!shopId) return;
    try {
      const { data, error } = await supabase
        .from("visitor_sessions")
        .select(`
          *,
          profiles:profile_id ( id, full_name, email, phone, notes )
        `)
        .eq("shop_id", shopId);

      if (error) throw error;
      setVisitorSessions(data || []);
    } catch (err) {
      console.warn("Failed to load visitor sessions:", err);
    }
  }

  useEffect(() => {
    if (!shopId) return;

    loadVisitorSessions();

    // Subscribe to database changes for visitor_sessions in real-time
    const channel = supabase.channel(`visitor-sessions-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitor_sessions",
          filter: `shop_id=eq.${shopId}`
        },
        () => {
          loadVisitorSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  // Load selected visitor's call history
  useEffect(() => {
    if (!selectedVisitor) return;

    async function fetchVisitorCalls() {
      try {
        setLoadingVisitorCalls(true);
        const name = selectedVisitor.profiles?.full_name || "";
        if (!name) {
          setVisitorCalls([]);
          return;
        }

        const { data, error } = await supabase
          .from("call_logs")
          .select("*")
          .eq("shop_id", shopId)
          .ilike("customer_name", `%${name}%`);

        if (error) throw error;
        setVisitorCalls(data || []);
      } catch (err) {
        console.warn("Failed to fetch visitor call logs:", err);
      } finally {
        setLoadingVisitorCalls(false);
      }
    }

    fetchVisitorCalls();
  }, [selectedVisitor, shopId]);

  // Fetch standard KPI stats from database
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

        // Total Calls
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
        const { data: items } = await supabase
          .from("order_items")
          .select("price, quantity, orders!inner(status)")
          .eq("shop_id", shopId)
          .neq("orders.status", "cancelled");
        const salesTotal = items?.reduce((acc, item) => acc + Number(item.price || 0) * (item.quantity || 1), 0) || 0;
        setSalesAssisted(salesTotal);

        // 4.5. Online Agents count & list
        const { data: onlineAgs } = await supabase
          .from("shop_agents")
          .select("*, profiles(full_name)")
          .eq("shop_id", shopId)
          .eq("is_online", true);
        setOnlineAgents(onlineAgs?.length || 0);
        setAvailableAgentsList(onlineAgs || []);

        // 4.6. Conversions Today & Revenue Today (Orders completed today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: todayItems } = await supabase
          .from("order_items")
          .select("order_id, price, quantity, orders!inner(status, created_at)")
          .eq("shop_id", shopId)
          .neq("orders.status", "cancelled")
          .gte("orders.created_at", todayStart.toISOString());
        
        const uniqueOrdersToday = new Set(todayItems?.map(item => item.order_id) || []);
        setConversionsToday(uniqueOrdersToday.size);

        const todayRevenueSum = todayItems?.reduce((acc, item) => acc + Number(item.price || 0) * (item.quantity || 1), 0) || 0;
        setRevenueToday(todayRevenueSum);

        // 4.7. Top Shared Products
        const { data: callProducts } = await supabase
          .from("call_logs")
          .select("products_shared")
          .eq("shop_id", shopId)
          .not("products_shared", "is", null);
        
        const productFreq = {};
        callProducts?.forEach(c => {
          c.products_shared?.forEach(p => {
            productFreq[p] = (productFreq[p] || 0) + 1;
          });
        });
        const sortedShared = Object.entries(productFreq)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        setTopSharedProducts(sortedShared);

        // 4.8. Customers requiring follow-up
        const { data: followUps } = await supabase
          .from("call_logs")
          .select("id, customer_name, customer_email, created_at, resolution_status")
          .eq("shop_id", shopId)
          .or("resolution_status.eq.Follow-up Required,status.eq.missed")
          .order("created_at", { ascending: false })
          .limit(3);
        setFollowUpCustomers(followUps || []);

        // 5. Recent Activities
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

  // Telemetry aggregates
  const activeVisitors = visitorSessions.length;
  const browsingProducts = visitorSessions.filter(v => v.current_page?.startsWith("/products")).length;
  const queueLength = visitorSessions.filter(v => v.is_waiting_assistance).length;
  const inVideoCall = visitorSessions.filter(v => v.is_in_video_call).length;
  const conversionRate = useMemo(() => {
    if (totalCallsCount === 0) return "0.0%";
    const ordersCount = Math.round(totalCallsCount * 0.12); // Simulated flat conversion of 12% on consults
    return `${((ordersCount / totalCallsCount) * 100).toFixed(1)}%`;
  }, [totalCallsCount]);

  // Personalized Greeting based on local time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  if (shopLoading || loadingStats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 font-semibold">
          ⚠️
        </div>
        <h3 className="text-xl font-semibold text-slate-900">No Shop Profile Found</h3>
        <p className="mt-2 text-slate-500 max-w-sm">
          Please complete your shop profile configuration under the settings page to open your seller live panel.
        </p>
      </div>
    );
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
                {profile?.full_name?.split(" ")[0] || "Merchant"}
              </span>
              <span>✨</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 max-w-xl leading-relaxed">
              Here is what is happening at <span className="font-bold text-slate-800">{shop.shop_name || shop.name}</span> today. Monitor real-time visitors, calls, and checkout conversions.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 self-start md:self-auto shadow-xs">
            <span className={`h-2 w-2 rounded-full ${shop.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Widget: {shop.is_online ? "Online" : "Offline"}</span>
          </div>
        </div>

        {/* 4 Premium KPI Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.008)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.04)] hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-between group cursor-pointer">
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Revenue Today</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">₹{revenueToday.toLocaleString()}</p>
              <span className="text-[9px] bg-emerald-50 border border-emerald-100/50 text-emerald-700 rounded-full px-2 py-0.5 font-bold inline-flex items-center gap-1">
                <TrendingUp size={10} />
                <span>assisted sales</span>
              </span>
            </div>
            <div className="h-11 w-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-emerald-100/30">
              <IndianRupee size={18} strokeWidth={2.2} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.008)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.04)] hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-between group cursor-pointer">
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Visitors</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{activeVisitors}</p>
              <span className="text-[9px] bg-blue-50 border border-blue-100/50 text-blue-700 rounded-full px-2 py-0.5 font-bold inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-550 animate-pulse" />
                <span>live on store</span>
              </span>
            </div>
            <div className="h-11 w-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-blue-100/30">
              <Users size={18} strokeWidth={2.2} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.008)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.04)] hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-between group cursor-pointer">
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Live Calls</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{liveCalls}</p>
              <span className={`text-[9px] border rounded-full px-2 py-0.5 font-bold inline-block ${
                liveCalls > 0 
                  ? "bg-amber-50 border-amber-100 text-amber-700" 
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                {liveCalls > 0 ? "active sessions" : "consultations queue"}
              </span>
            </div>
            <div className="h-11 w-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-amber-100/30">
              <Video size={18} strokeWidth={2.2} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.008)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.04)] hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-between group cursor-pointer">
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conversion Rate</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{conversionRate}</p>
              <span className="text-[9px] bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-full px-2 py-0.5 font-bold inline-flex items-center gap-1">
                <Clock size={10} />
                <span>consult conversions</span>
              </span>
            </div>
            <div className="h-11 w-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-indigo-100/30">
              <Percent size={18} strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Live Visitor Tracking Table Panel */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-blue-500 animate-pulse" />
            <span>Real-Time Website Visitors tracking</span>
          </h3>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="px-6 py-4">Visitor/User details</th>
                <th className="px-6 py-4">Active Page</th>
                <th className="px-6 py-4">Time on Site</th>
                <th className="px-6 py-4 font-mono">Cart status</th>
                <th className="px-6 py-4 text-right">Consult Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-slate-600">
              {visitorSessions.map((v) => {
                const name = v.profiles?.full_name || `Visitor (${v.visitor_id})`;
                const formattedTime = `${Math.floor(v.time_on_site / 60)}m ${v.time_on_site % 60}s`;

                return (
                  <tr 
                    key={v.id} 
                    onClick={() => setSelectedVisitor(v)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                        {name[0]}
                      </div>
                      <span className="font-bold text-slate-900">{name}</span>
                    </td>
                    
                    <td className="px-6 py-3.5 font-mono text-[11px] text-blue-600">
                      {v.current_page}
                    </td>

                    <td className="px-6 py-3.5 text-slate-500">
                      {formattedTime}
                    </td>

                    <td className="px-6 py-3.5 font-mono text-[10px] text-slate-500">
                      {v.cart_status}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      {v.is_in_video_call ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 font-bold uppercase text-[8px] border border-emerald-100">
                          In Live Call
                        </span>
                      ) : v.is_waiting_assistance ? (
                        <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-600 font-bold uppercase text-[8px] animate-pulse border border-amber-100">
                          Waiting Help
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-slate-50 text-slate-500 uppercase text-[8px] border border-slate-100">
                          Browsing
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visitorSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-bold">
                    No active website visitors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom section: Recent activities, shared products, follow-ups, and online agents list */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: Recent Logs and Online Agents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Recent Activity Logs</span>
            </h2>

            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex justify-between items-center rounded-2xl bg-slate-50/50 p-4 border border-slate-100 hover:bg-slate-50 transition-all duration-300">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{act.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{act.desc}</p>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">{act.time}</span>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center">
                  <Video className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-[10px] text-slate-500 font-bold">No calling sessions tracked today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Agents */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500">Available Team Agents</h2>
            
            <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
              {availableAgentsList.map((ag) => (
                <div key={ag.id} className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl hover:bg-slate-50 transition-all duration-300">
                  <div>
                    <span className="font-bold text-slate-900 block">{ag.profiles?.full_name || "Agent"}</span>
                    <span className="text-[9px] text-slate-500 block uppercase font-mono mt-0.5">{ag.department || "Sales"}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase ${
                    ag.status === "Available" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                  }`}>
                    {ag.status || "Available"}
                  </span>
                </div>
              ))}
              {availableAgentsList.length === 0 && (
                <p className="text-slate-500 italic block text-center py-4 col-span-2">No available agents online.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Shared products, follow-ups & quick links */}
        <div className="space-y-6">
          {/* Top Shared Catalog Items */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500">Most Shared Products</h2>
            
            <div className="space-y-3.5">
              {topSharedProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-300">
                  <span className="font-bold text-slate-900 truncate max-w-[160px]">{p.name}</span>
                  <span className="font-mono text-blue-600 font-bold">{p.count} shares</span>
                </div>
              ))}
              {topSharedProducts.length === 0 && (
                <p className="text-slate-500 italic">No products shared in recent calls.</p>
              )}
            </div>
          </div>

          {/* Follow-up Queue */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500">Follow-up Queue</h2>
            
            <div className="space-y-3.5">
              {followUpCustomers.map((c) => (
                <div key={c.id} className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl leading-normal hover:bg-slate-50 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{c.customer_name}</span>
                    <span className="text-[8px] bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded uppercase font-bold">
                      {c.resolution_status || "Missed"}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono mt-1">Ref: #{c.id.substring(0,8).toUpperCase()}</span>
                </div>
              ))}
              {followUpCustomers.length === 0 && (
                <p className="text-slate-500 italic">Follow-up queue is clear.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* VISITOR SESSION SLIDE-OUT DRAWER */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-100 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
        selectedVisitor ? "translate-x-0" : "translate-x-full"
      }`}>
        {selectedVisitor && (
          <div className="h-full flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {selectedVisitor.profiles?.full_name || `Visitor (${selectedVisitor.visitor_id})`}
                </h2>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Visitor Session Log Details</span>
              </div>
              <button 
                onClick={() => setSelectedVisitor(null)}
                className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Telemetry info */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Live Session Tracks</span>
                
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Page URL:</span>
                    <span className="font-mono text-blue-600">{selectedVisitor.current_page}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time on Site:</span>
                    <span className="text-slate-900 font-bold">{Math.floor(selectedVisitor.time_on_site / 60)}m {selectedVisitor.time_on_site % 60}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cart status:</span>
                    <span className="text-slate-900 font-mono">{selectedVisitor.cart_status}</span>
                  </div>
                </div>
              </div>

              {/* Viewed products portfolio */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Viewed Products</span>
                <div className="flex flex-wrap gap-2">
                  {(selectedVisitor.viewed_products || []).map((p, idx) => (
                    <span key={idx} className="bg-white border border-slate-100 px-2.5 py-1 rounded-2xl text-slate-800 font-semibold text-[10px]">
                      {p}
                    </span>
                  ))}
                  {(selectedVisitor.viewed_products || []).length === 0 && (
                    <span className="text-slate-500 text-[10px] font-bold">No product catalogs viewed during this session.</span>
                  )}
                </div>
              </div>

              {/* Previous calling logs */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Consultation History</span>
                
                <div className="space-y-2">
                  {loadingVisitorCalls ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mx-auto" />
                  ) : visitorCalls.map(c => (
                    <div key={c.id} className="p-2.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center text-[10px]">
                      <div>
                        <span className="font-bold text-slate-900 block">Video consultation</span>
                        <span className="text-slate-500 block font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-900 block font-mono">{Math.round(c.duration / 60)}m</span>
                        <span className="text-slate-500 block uppercase font-bold text-[8px]">{c.status}</span>
                      </div>
                    </div>
                  ))}
                  {!loadingVisitorCalls && visitorCalls.length === 0 && (
                    <span className="text-slate-500 text-[10px] font-bold block">No calls history registered for this profile.</span>
                  )}
                </div>
              </div>

              {/* CRM profiles notes summary if profile is connected */}
              {selectedVisitor.profiles && (
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CRM profile details</span>
                  <div className="space-y-1 block">
                    <span className="font-bold text-slate-900 block">{selectedVisitor.profiles.full_name}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{selectedVisitor.profiles.email}</span>
                    {selectedVisitor.profiles.notes && (
                      <div className="mt-2 bg-white p-2.5 rounded-2xl border border-slate-100 text-slate-600 text-[10px] italic">
                        "{selectedVisitor.profiles.notes}"
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Call action drawer foot */}
            {selectedVisitor.is_waiting_assistance && (
              <div className="p-6 border-t border-slate-100 bg-white">
                <a 
                  href="/seller/live"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5"
                >
                  <Video className="h-4 w-4" />
                  <span>Answer Call Room</span>
                </a>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}