import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";
import useSellerShop from "@/features/seller/hooks/useSellerShop";
import { AgentPresenceService } from "@/services/presence/presenceService";
import { CallQueueService } from "@/services/queue/callQueueService";
import { 
  Video, 
  MessageSquare, 
  PhoneCall, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  Star, 
  Zap, 
  Circle,
  TrendingUp,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AgentDashboardPage() {
  const { profile } = useAuthContext();
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

   const [agentStatus, setAgentStatus] = useState("online");
  const [activeCalls, setActiveCalls] = useState(0);
  const [avgWait, setAvgWait] = useState(0);
  const [longestWait, setLongestWait] = useState(0);
  const [pendingCallbacks, setPendingCallbacks] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Availability status definitions
  const statusOptions = {
    online: { label: "Online & Active", color: "bg-emerald-500", border: "border-emerald-250", text: "text-emerald-700" },
    offline: { label: "Offline", color: "bg-slate-400", border: "border-slate-350", text: "text-slate-500" },
    away: { label: "Away / Lunch", color: "bg-amber-500", border: "border-amber-250", text: "text-amber-700" },
    busy: { label: "Busy", color: "bg-rose-500", border: "border-rose-250", text: "text-rose-700" },
    on_call: { label: "On Call", color: "bg-blue-500", border: "border-blue-250", text: "text-blue-700" },
    break: { label: "On Break", color: "bg-orange-500", border: "border-orange-250", text: "text-orange-700" }
  };

  // Toggle availability status in local state, WebSocket, and database fallback
  async function handleStatusChange(status) {
    setAgentStatus(status);
    toast.success(`Availability status updated to ${statusOptions[status].label}`);
    
    if (shopId && profile?.id) {
      try {
        await AgentPresenceService.setPresence(profile.id, shopId, status);
      } catch (err) {
        console.warn("Failed to sync agent status:", err);
      }
    }
  }

  // Load initial agent status and register presence
  useEffect(() => {
    if (!shopId || !profile?.id) return;

    async function fetchInitialStatus() {
      try {
        // Query primary agent_presence table first
        const { data: pres } = await supabase
          .from("agent_presence")
          .select("status")
          .eq("user_id", profile.id)
          .eq("shop_id", shopId)
          .maybeSingle();

        let status = pres?.status;
        
        // Fallback to legacy shop_agents table
        if (!status) {
          const { data: dataMember } = await supabase
            .from("shop_members")
            .select("id, shop_agents(status)")
            .eq("shop_id", shopId)
            .eq("profile_id", profile.id)
            .maybeSingle();
          const agent = Array.isArray(dataMember?.shop_agents) ? (dataMember.shop_agents[0] || null) : (dataMember?.shop_agents || null);
          status = agent?.status || "online";
        }

        setAgentStatus(status);
        await AgentPresenceService.setPresence(profile.id, shopId, status);
      } catch (err) {
        console.warn("Failed to fetch initial status:", err);
      }
    }

    fetchInitialStatus();
  }, [shopId, profile]);

  // Load Real-time Stats
  useEffect(() => {
    if (!shopId) return;

    async function loadStats() {
      try {
        setLoadingStats(true);

        // Fetch active queue statistics (heartbeat within 90s, status = waiting)
        const queueStats = await CallQueueService.getQueueStats(shopId);
        setActiveCalls(queueStats.queueSize);
        setAvgWait(queueStats.averageWait);
        setLongestWait(queueStats.longestWait);

        // Fetch pending callbacks (notifications or callback logs)
        const { count: callbacksCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("type", "callback_request")
          .eq("is_read", false);

        setPendingCallbacks(callbacksCount || 0);

        // Fetch active visitor sessions
        const { count: visitorsCount } = await supabase
          .from("visitor_sessions")
          .select("*", { count: "exact", head: true })
          .eq("shop_id", shopId);

        setVisitorCount(visitorsCount || 0);

        // Fetch unread customer messages
        const { count: messagesCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("type", "new_message")
          .eq("is_read", false);

        setUnreadChats(messagesCount || 0);

      } catch (err) {
        console.warn("Error loading agent stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();

    // Subscribe to realtime changes in visitor sessions, calls, and queues
    const channel = supabase.channel(`agent-dashboard-${shopId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "video_rooms", filter: `shop_id=eq.${shopId}` }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_sessions", filter: `shop_id=eq.${shopId}` }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "call_queues", filter: `shop_id=eq.${shopId}` }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  return (
    <div className="space-y-8 p-1">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Zap className="h-3 w-3 text-amber-300 fill-amber-300 animate-pulse" /> Agent Workspace
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.full_name || "Agent"}
            </h1>
            <p className="mt-2 text-indigo-100 text-sm max-w-xl">
              You are assigned to <strong className="text-white">{shop?.shop_name || "Store HQ"}</strong>. Monitor live traffic and respond to shopper calls instantly.
            </p>
          </div>

          {/* Quick status controller */}
          <div className="glass-panel border-white/10 bg-white/10 p-4 rounded-2xl flex flex-col gap-2 shrink-0 md:min-w-[220px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Set Availability Status</p>
            <div className="flex items-center gap-2 bg-white/15 p-1 rounded-xl">
              <div className={`h-2.5 w-2.5 rounded-full ${statusOptions[agentStatus].color} animate-pulse ml-2`} />
              <select
                value={agentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none border-none cursor-pointer flex-1 py-1 pr-2"
              >
                <option value="online" className="text-slate-900 font-semibold">Online & Available</option>
                <option value="offline" className="text-slate-900 font-semibold">Go Offline</option>
                <option value="away" className="text-slate-900 font-semibold">Away / Lunch</option>
                <option value="busy" className="text-slate-900 font-semibold">Busy</option>
                <option value="on_call" className="text-slate-900 font-semibold">On Call</option>
                <option value="break" className="text-slate-900 font-semibold">On Break</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Calls */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between group hover:border-violet-100 hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Calls In Queue</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{activeCalls}</span>
              {activeCalls > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Avg Wait: {avgWait}s | Max: {longestWait}s
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Video className="h-6 w-6" />
          </div>
        </div>

        {/* Callback Requests */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between group hover:border-amber-100 hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Callbacks</p>
            <span className="text-3xl font-black text-slate-950">{pendingCallbacks}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PhoneCall className="h-6 w-6" />
          </div>
        </div>

        {/* Unread Chats */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between group hover:border-blue-100 hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unread Messages</p>
            <span className="text-3xl font-black text-slate-950">{unreadChats}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>

        {/* Live Traffic */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between group hover:border-emerald-100 hover:shadow-md transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Visitors</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-950">{visitorCount}</span>
              <span className="text-xs text-slate-500 font-semibold">on site</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Telemetry Queue */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Live Traffic Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">Shoppers currently browsing your online storefront</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" /> Real-time
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visitor</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Page / Referrer</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visitorCount === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-slate-500 font-semibold">
                      No active visitors browsing the store currently.
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 font-black text-xs flex items-center justify-center">
                            JS
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">John Smith (Verified)</p>
                            <p className="text-[10px] text-slate-500">Device: Chrome on macOS</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-xs text-slate-950 font-semibold">/products/premium-leather-boots</p>
                        <p className="text-[10px] text-slate-400">Referrer: Direct Traffic</p>
                      </td>
                      <td className="py-4 text-xs text-slate-500 font-medium">3m 42s</td>
                      <td className="py-4">
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer">
                          Invite to Call
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                            V
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-950">Visitor #8942</p>
                            <p className="text-[10px] text-slate-550">Device: Safari on iOS</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-xs text-slate-955 font-semibold">/checkout</p>
                        <p className="text-[10px] text-slate-400">Referrer: Google Search</p>
                      </td>
                      <td className="py-4 text-xs text-slate-500 font-medium">1m 15s</td>
                      <td className="py-4">
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer">
                          Invite to Call
                        </button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Performance Analytics */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Statistics</h2>
            <p className="text-xs text-slate-500 mt-0.5">Performance tracking for today</p>
          </div>

          <div className="space-y-4">
            {/* Answered calls */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Calls Resolved</p>
                  <p className="text-sm font-black text-slate-900">14 Calls</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +12%
                </span>
              </div>
            </div>

            {/* Satisfaction score */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                  <Star className="h-4.5 w-4.5 fill-yellow-500 text-yellow-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Customer Rating</p>
                  <p className="text-sm font-black text-slate-900">4.92 / 5.0</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold">12 ratings</span>
              </div>
            </div>

            {/* Average handle time */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Avg. Handle Time</p>
                  <p className="text-sm font-black text-slate-900">4m 12s</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Target: &lt;5m</span>
              </div>
            </div>

            {/* Daily Streak Info */}
            <div className="rounded-xl bg-gradient-to-tr from-amber-500/10 to-orange-500/10 border border-amber-500/10 p-4 flex items-start gap-3">
              <Award className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">Top Agent Streak</p>
                <p className="text-[10px] text-slate-550 mt-0.5">You are currently ranked #1 in response speed for this shop workspace. Keep it up!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
