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
  const [onlineAgents, setOnlineAgents] = useState(0);

  // Workflow states
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
        const { data: orders } = await supabase
          .from("orders")
          .select("total")
          .eq("shop_id", shopId)
          .neq("status", "cancelled");
        const salesTotal = orders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;
        setSalesAssisted(salesTotal);

        // 4.5. Online Agents count & list
        const { data: onlineAgs } = await supabase
          .from("shop_agents")
          .select("*, profiles(full_name)")
          .eq("shop_id", shopId)
          .eq("is_online", true);
        setOnlineAgents(onlineAgs?.length || 0);
        setAvailableAgentsList(onlineAgs || []);

        // 4.6. Conversions Today (Orders completed today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: todayOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("shop_id", shopId)
          .neq("status", "cancelled")
          .gte("created_at", todayStart.toISOString());
        setConversionsToday(todayOrders?.length || 0);

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
  const avgWaitTime = queueLength > 0 ? `${queueLength * 2}m 10s` : "0m 0s";

  // Conversion calculator (Checkout orders / consultations count)
  const conversionRate = useMemo(() => {
    if (totalCallsCount === 0) return "0.0%";
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
    <div className="space-y-8 text-white max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Live Commerce Dashboard</h1>
          <p className="mt-1 text-xs text-slate-400">Real-time storefront visitor tracks, live video room queues, and customer conversions for {shop.shop_name || shop.name}.</p>
        </div>
      </div>

      {/* Visitor Session Tracking Widgets */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 bg-slate-900/10 p-4 rounded-2xl border border-slate-900 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Visitors</span>
          <p className="text-lg font-black text-white">{activeVisitors}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Browsing Catalog</span>
          <p className="text-lg font-black text-blue-400">{browsingProducts}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Waiting Help</span>
          <p className="text-lg font-black text-amber-400">{queueLength}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">In Call Sessions</span>
          <p className="text-lg font-black text-emerald-400">{inVideoCall}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Avg Wait Duration</span>
          <p className="text-lg font-black text-white font-mono">{avgWaitTime}</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Online Agents"
          value={onlineAgents.toString()}
          icon={UserCheck}
          color="bg-indigo-600/10 text-indigo-400"
          change="Available staff"
        />

        <StatCard
          title="Live Calls"
          value={liveCalls.toString()}
          icon={Video}
          color="bg-emerald-600/10 text-emerald-400"
          change="Ongoing consultations"
        />

        <StatCard
          title="Conversions Today"
          value={conversionsToday.toString()}
          icon={Percent}
          color="bg-green-600/10 text-green-400"
          change="Checkout invoices"
        />

        <StatCard
          title="Callbacks Pending"
          value={callbacks.toString()}
          icon={CalendarClock}
          color="bg-amber-600/10 text-amber-400"
          change="Pending appointments"
        />

        <StatCard
          title="Widget Launcher"
          value={shop.is_online ? "ONLINE" : "OFFLINE"}
          icon={Sliders}
          color={shop.is_online ? "bg-emerald-600/10 text-emerald-400" : "bg-slate-800 text-slate-500"}
          change={shop.is_online ? "Active embeds" : "Integration disabled"}
        />
      </div>

      {/* Real-Time Live Visitor Tracking Table Panel */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 overflow-hidden">
        <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-blue-500 animate-pulse" />
            <span>Real-Time Website Visitors tracking</span>
          </h3>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                <th className="px-6 py-4">Visitor/User details</th>
                <th className="px-6 py-4">Active Page</th>
                <th className="px-6 py-4">Time on Site</th>
                <th className="px-6 py-4 font-mono">Cart status</th>
                <th className="px-6 py-4 text-right">Consult Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-transparent text-slate-300">
              {visitorSessions.map((v) => {
                const name = v.profiles?.full_name || `Visitor (${v.visitor_id})`;
                const formattedTime = `${Math.floor(v.time_on_site / 60)}m ${v.time_on_site % 60}s`;

                return (
                  <tr 
                    key={v.id} 
                    onClick={() => setSelectedVisitor(v)}
                    className="hover:bg-slate-900/10 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                        {name[0]}
                      </div>
                      <span className="font-bold text-white">{name}</span>
                    </td>
                    
                    <td className="px-6 py-3.5 font-mono text-[11px] text-blue-400">
                      {v.current_page}
                    </td>

                    <td className="px-6 py-3.5 text-slate-400">
                      {formattedTime}
                    </td>

                    <td className="px-6 py-3.5 font-mono text-[10px] text-slate-500">
                      {v.cart_status}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      {v.is_in_video_call ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase text-[8px]">
                          In Live Call
                        </span>
                      ) : v.is_waiting_assistance ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase text-[8px] animate-pulse">
                          Waiting Help
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 uppercase text-[8px]">
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
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
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

          {/* Available Agents */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400">Available Team Agents</h2>
            
            <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
              {availableAgentsList.map((ag) => (
                <div key={ag.id} className="flex justify-between items-center bg-slate-950 border border-slate-900 p-3.5 rounded-xl">
                  <div>
                    <span className="font-bold text-white block">{ag.profiles?.full_name || "Agent"}</span>
                    <span className="text-[9px] text-slate-500 block uppercase font-mono mt-0.5">{ag.department || "Sales"}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    ag.status === "Available" ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"
                  }`}>
                    {ag.status || "Available"}
                  </span>
                </div>
              ))}
              {availableAgentsList.length === 0 && (
                <p className="text-slate-500 italic block text-center py-4">No available agents online.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Shared products, follow-ups & quick links */}
        <div className="space-y-6">
          {/* Top Shared Catalog Items */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-450">Most Shared Products</h2>
            
            <div className="space-y-3.5">
              {topSharedProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-900 p-3 rounded-xl">
                  <span className="font-bold text-white truncate max-w-[160px]">{p.name}</span>
                  <span className="font-mono text-blue-400 font-bold">{p.count} shares</span>
                </div>
              ))}
              {topSharedProducts.length === 0 && (
                <p className="text-slate-500 italic">No products shared in recent calls.</p>
              )}
            </div>
          </div>

          {/* Follow-up Queue */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-450">Follow-up Queue</h2>
            
            <div className="space-y-3.5">
              {followUpCustomers.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-900 p-3 rounded-xl leading-normal">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white">{c.customer_name}</span>
                    <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase font-bold">
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
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-900 bg-slate-950/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out ${
        selectedVisitor ? "translate-x-0" : "translate-x-full"
      }`}>
        {selectedVisitor && (
          <div className="h-full flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black text-white">
                  {selectedVisitor.profiles?.full_name || `Visitor (${selectedVisitor.visitor_id})`}
                </h2>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Visitor Session Log Details</span>
              </div>
              <button 
                onClick={() => setSelectedVisitor(null)}
                className="text-slate-450 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Telemetry info */}
              <div className="space-y-2.5 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Live Session Tracks</span>
                
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Page URL:</span>
                    <span className="font-mono text-blue-400">{selectedVisitor.current_page}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time on Site:</span>
                    <span className="text-white font-bold">{Math.floor(selectedVisitor.time_on_site / 60)}m {selectedVisitor.time_on_site % 60}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cart status:</span>
                    <span className="text-white font-mono">{selectedVisitor.cart_status}</span>
                  </div>
                </div>
              </div>

              {/* Viewed products portfolio */}
              <div className="space-y-2.5 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Viewed Products</span>
                <div className="flex flex-wrap gap-2">
                  {(selectedVisitor.viewed_products || []).map((p, idx) => (
                    <span key={idx} className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-white font-medium text-[10px]">
                      {p}
                    </span>
                  ))}
                  {(selectedVisitor.viewed_products || []).length === 0 && (
                    <span className="text-slate-500 text-[10px] font-bold">No product catalogs viewed during this session.</span>
                  )}
                </div>
              </div>

              {/* Previous calling logs */}
              <div className="space-y-2.5 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Consultation History</span>
                
                <div className="space-y-2">
                  {loadingVisitorCalls ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400 mx-auto" />
                  ) : visitorCalls.map(c => (
                    <div key={c.id} className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg flex justify-between items-center text-[10px]">
                      <div>
                        <span className="font-bold text-white block">Video consultation</span>
                        <span className="text-slate-500 block font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white block font-mono">{Math.round(c.duration / 60)}m</span>
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
                <div className="space-y-2.5 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CRM profile details</span>
                  <div className="space-y-1 block">
                    <span className="font-bold text-white block">{selectedVisitor.profiles.full_name}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{selectedVisitor.profiles.email}</span>
                    {selectedVisitor.profiles.notes && (
                      <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-slate-400 text-[10px] italic">
                        "{selectedVisitor.profiles.notes}"
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Call action drawer foot */}
            {selectedVisitor.is_waiting_assistance && (
              <div className="p-6 border-t border-slate-900 bg-slate-950">
                <a 
                  href="/seller/live"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-550 rounded-xl text-white font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5"
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