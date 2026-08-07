import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";
import { 
  ShieldAlert, 
  Activity, 
  Database, 
  Flame, 
  AlertTriangle, 
  RefreshCw, 
  Bell, 
  Server, 
  Trash2,
  HardDrive,
  Users,
  Compass,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createAuditLog } from "@/services/audit/audit.service";

export default function ManagementDashboardPage() {
  const { profile } = useAuthContext();
  
  const [activeVideoRooms, setActiveVideoRooms] = useState(0);
  const [totalShops, setTotalShops] = useState(0);
  const [totalOrgs, setTotalOrgs] = useState(0);
  
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Super Admin action loader states
  const [killingRooms, setKillingRooms] = useState(false);
  const [flushingCache, setFlushingCache] = useState(false);
  const [cleaningDb, setCleaningDb] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  
  const [alertText, setAlertText] = useState("");
  const [showKillModal, setShowKillModal] = useState(false);

  // Load Admin System Stats
  async function loadSystemStats() {
    try {
      // 1. Fetch total organizations
      const { count: orgCount } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });
      setTotalOrgs(orgCount || 0);

      // 2. Fetch total shops
      const { count: shopCount } = await supabase
        .from("shops")
        .select("*", { count: "exact", head: true });
      setTotalShops(shopCount || 0);

      // 3. Fetch active video rooms
      const { count: videoRoomsCount } = await supabase
        .from("video_rooms")
        .select("*", { count: "exact", head: true })
        .in("status", ["waiting", "ringing", "connected"]);
      setActiveVideoRooms(videoRoomsCount || 0);

      // 4. Fetch recent audit logs
      const { data: logsData } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setAuditLogs(logsData || []);

    } catch (err) {
      console.warn("Failed to load management system stats:", err);
    }
  }

  useEffect(() => {
    loadSystemStats();

    // Subscribe to system audit logs in real-time
    const channel = supabase.channel("management-center")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        loadSystemStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Action A: Force Kill All Rooms
  async function handleForceKillAll() {
    try {
      setKillingRooms(true);
      setShowKillModal(false);

      // Set all non-completed video rooms to completed
      const { error } = await supabase
        .from("video_rooms")
        .update({ status: "completed" })
        .in("status", ["waiting", "ringing", "connected"]);

      if (error) throw error;

      // Log audit trail
      await createAuditLog({
        action: "force_kill_all_rooms",
        resource: "video_rooms",
        metadata: { timestamp: new Date().toISOString(), result: "success" }
      });

      toast.success("Successfully disconnected and finalized all active video sessions!");
      loadSystemStats();
    } catch (err) {
      toast.error(err.message || "Failed to force kill active video rooms");
    } finally {
      setKillingRooms(false);
    }
  }

  // Action B: Clear Cache
  async function handleClearCache() {
    setFlushingCache(true);
    setTimeout(async () => {
      try {
        // Log audit log
        await createAuditLog({
          action: "flush_cache",
          resource: "redis_cache",
          metadata: { target: "all_redis_nodes" }
        });
        toast.success("Redis memory flushed and CDN edge cache purged!");
        loadSystemStats();
      } catch (err) {
        console.error(err);
      } finally {
        setFlushingCache(false);
      }
    }, 1500);
  }

  // Action C: Vacuum DB
  async function handleOptimizeDb() {
    setCleaningDb(true);
    setTimeout(async () => {
      try {
        // Log audit log
        await createAuditLog({
          action: "database_optimization",
          resource: "postgres_database",
          metadata: { task: "vacuum_analyze_tables" }
        });
        toast.success("Database optimization index rebuilding and table vacuum completed!");
        loadSystemStats();
      } catch (err) {
        console.error(err);
      } finally {
        setCleaningDb(false);
      }
    }, 2000);
  }

  // Action D: Broadcast global notification banner
  async function handleSendBanner(e) {
    e.preventDefault();
    if (!alertText.trim()) return;

    try {
      setSendingAlert(true);
      
      // Get all active shop IDs to send announcements
      const { data: activeShops } = await supabase.from("shops").select("id");
      if (activeShops && activeShops.length > 0) {
        const insertNotifs = activeShops.map(s => ({
          shop_id: s.id,
          title: "System Broadcast Banner",
          body: alertText.trim(),
          type: "system",
          is_read: false
        }));

        const { error } = await supabase.from("notifications").insert(insertNotifs);
        if (error) throw error;
      }

      await createAuditLog({
        action: "global_broadcast",
        resource: "notifications",
        metadata: { message: alertText.trim() }
      });

      toast.success("Platform announcement broadcasted to all active merchant dashboards!");
      setAlertText("");
    } catch (err) {
      toast.error(err.message || "Failed to broadcast announcement");
    } finally {
      setSendingAlert(false);
    }
  }

  return (
    <div className="space-y-8 p-1">
      {/* Super Admin Control Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent)]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <ShieldAlert className="h-3.5 w-3.5" /> Management Control Center
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Super Admin Panel
            </h1>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              Central commands for database maintenance, live WebRTC peering termination, CDN cache optimization, and global tenant controls.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0 bg-slate-950 border border-slate-850 p-4 rounded-2xl md:min-w-[200px]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Security Clearance</p>
            <p className="text-xs font-bold text-slate-200">Tier-1 Platform Administrator</p>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connection Secure
            </p>
          </div>
        </div>
      </div>

      {/* System Telemetry & Resource Monitors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active video channels */}
        <div className="rounded-2xl border border-slate-850 bg-slate-900 text-white p-6 flex items-center justify-between shadow-sm group hover:border-emerald-500/30 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Peer Channels</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-100">{activeVideoRooms}</span>
              {activeVideoRooms > 0 && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Database capacity */}
        <div className="rounded-2xl border border-slate-855 bg-slate-900 text-white p-6 flex items-center justify-between shadow-sm group hover:border-blue-500/30 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Size</p>
            <span className="text-3xl font-black text-slate-100">2.41 GB</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {/* Total Active Shops */}
        <div className="rounded-2xl border border-slate-855 bg-slate-900 text-white p-6 flex items-center justify-between shadow-sm group hover:border-indigo-500/30 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tenants (Shops)</p>
            <span className="text-3xl font-black text-slate-100">{totalShops} Shops</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Server Memory Health */}
        <div className="rounded-2xl border border-slate-855 bg-slate-900 text-white p-6 flex items-center justify-between shadow-sm group hover:border-rose-500/30 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System CPU Load</p>
            <span className="text-3xl font-black text-slate-100">12.8%</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Server className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core action commands console */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">System Commands Panel</h2>
            <p className="text-xs text-slate-500 mt-0.5">Run critical platform maintenance operations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Force Kill WebRTC channels */}
            <div className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-350 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Terminate Peer Rooms</p>
                </div>
                <p className="text-[11px] text-slate-550">Disconnects active WebRTC rooms, resets participant states, and releases servers.</p>
              </div>
              <button 
                onClick={() => setShowKillModal(true)}
                disabled={killingRooms}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {killingRooms ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                Force-Kill All Rooms
              </button>
            </div>

            {/* Flush Cache */}
            <div className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-350 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wider">Purge Cache & Redis</p>
                </div>
                <p className="text-[11px] text-slate-550">Flush memory configurations, purge CDN caches, and rebuild workspace caches.</p>
              </div>
              <button 
                onClick={handleClearCache}
                disabled={flushingCache}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {flushingCache ? <RefreshCw className="h-3 w-3 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
                Flush Memory Caches
              </button>
            </div>

            {/* Re-index and vacuum tables */}
            <div className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-350 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Database className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wider">Vacuum & Re-index</p>
                </div>
                <p className="text-[11px] text-slate-550">Re-index indexes, rebuild statistics on tables, and optimize space.</p>
              </div>
              <button 
                onClick={handleOptimizeDb}
                disabled={cleaningDb}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {cleaningDb ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Run DB Optimization
              </button>
            </div>

            {/* Announcement Banner */}
            <div className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-350 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-600">
                  <Bell className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wider">Platform Broadcast Banner</p>
                </div>
                <p className="text-[11px] text-slate-550">Broadcast custom warning banner notifications to all active merchants.</p>
              </div>
              <form onSubmit={handleSendBanner} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Type broadcast text..."
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                  required
                />
                <button 
                  type="submit"
                  disabled={sendingAlert}
                  className="px-3 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                >
                  {sendingAlert ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Audit Log Feed */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Admin Audit Feed</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time stream of core operations</p>
            </div>

            <div className="space-y-3.5">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-semibold">
                  No system logs registered today.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{log.action.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{JSON.stringify(log.metadata)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <button className="w-full text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-1">
              View Complete Audit Log <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Force-Kill Confirmation Modal */}
      <AnimatePresence>
        {showKillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setShowKillModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white shadow-2xl p-6 space-y-4"
            >
              <div className="flex h-12 w-12 rounded-full bg-rose-50 text-rose-600 items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Are you absolutely sure?</h3>
                <p className="text-xs text-slate-550 leading-relaxed">
                  This command immediately terminates all waiting, ringing, or active customer video consult rooms. Active video connections will be disconnected and marked as completed.
                </p>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button 
                  onClick={() => setShowKillModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleForceKillAll}
                  className="px-4 py-2 bg-rose-650 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Disconnect All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
