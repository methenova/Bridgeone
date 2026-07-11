import { useState, useMemo } from "react";
import { 
  Video, 
  Trash2, 
  Search, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Store, 
  Activity,
  ZapOff,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { 
  useAdminCalls, 
  useLiveRooms, 
  useDeleteCallLog, 
  useAdminCallbacks, 
  useUpdateCallbackStatus, 
  useDeleteCallback 
} from "../hooks/useAdmin";
import { supabase } from "@/config/supabase";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";
import { Button } from "@/components/ui/button";

const CALLBACK_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "called", label: "Called" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminCallsPage() {
  const [activeTab, setActiveTab] = useState("live"); // "live" | "callbacks" | "logs"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: calls = [], isLoading: callsLoading } = useAdminCalls();
  const { data: liveRooms = [], isLoading: roomsLoading } = useLiveRooms();
  const { data: callbacks = [], isLoading: callbacksLoading } = useAdminCallbacks();

  const deleteCall = useDeleteCallLog();
  const updateCallback = useUpdateCallbackStatus();
  const deleteCallbackReq = useDeleteCallback();

  // Terminate a live video session
  async function handleTerminateSession(roomId, roomCode) {
    if (window.confirm(`Are you sure you want to force terminate Active Video Room "${roomCode}"?`)) {
      try {
        const { error } = await supabase
          .from("video_rooms")
          .delete()
          .eq("id", roomId);
        
        if (error) throw error;
        toast.success("Active session terminated successfully");
      } catch (err) {
        toast.error(err.message || "Failed to terminate session");
      }
    }
  }

  // Delete historical call log
  async function handleDeleteLog(logId) {
    if (window.confirm("Are you sure you want to delete this historical call log?")) {
      await deleteCall.mutateAsync(logId);
    }
  }

  // Change Callback status
  async function handleCallbackStatus(callbackId, newStatus) {
    await updateCallback.mutateAsync({ callbackId, status: newStatus });
  }

  // Delete callback request
  async function handleDeleteCallback(callbackId) {
    if (window.confirm("Are you sure you want to delete this scheduled callback request?")) {
      await deleteCallbackReq.mutateAsync(callbackId);
    }
  }

  // Filter Logic for Call Logs
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const matchesSearch = 
        (c.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.customer_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.shops?.shop_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [calls, searchQuery, statusFilter]);

  // Filter Logic for Callbacks
  const filteredCallbacks = useMemo(() => {
    return callbacks.filter((cb) => {
      const matchesSearch = 
        (cb.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cb.customer_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cb.shops?.shop_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || (cb.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [callbacks, searchQuery, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalCalls = calls.length;
    const activeRooms = liveRooms.length;
    const totalCallbacks = callbacks.length;
    const pendingCallbacks = callbacks.filter(c => c.status === "pending").length;
    return { totalCalls, activeRooms, totalCallbacks, pendingCallbacks };
  }, [calls, liveRooms, callbacks]);

  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const loading = callsLoading || roomsLoading || callbacksLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <ProductSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 text-white max-w-7xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Live Calls</h1>
        <p className="mt-1 text-xs text-slate-400">Moderate ongoing consulting calls, track offline bookings, and view video log history.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 max-w-4xl">
        {/* Active Calls */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Calls</p>
            <p className="text-xl font-bold tracking-tight text-emerald-400">{stats.activeRooms}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="h-4.5 w-4.5 animate-pulse" />
          </div>
        </div>

        {/* Total Consults */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Consults</p>
            <p className="text-xl font-bold tracking-tight">{stats.totalCalls}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Video className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Total Booked Callbacks */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Bookings</p>
            <p className="text-xl font-bold tracking-tight text-indigo-400">{stats.totalCallbacks}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Calendar className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Pending Callbacks */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Booking</p>
            <p className="text-xl font-bold tracking-tight text-amber-400">{stats.pendingCallbacks}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-100 gap-6">
        <Button
          onClick={() => { setActiveTab("live"); setSearchQuery(""); setStatusFilter("all"); }}
          className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "live" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Live Sessions ({stats.activeRooms})
        </Button>
        <Button
          onClick={() => { setActiveTab("callbacks"); setSearchQuery(""); setStatusFilter("all"); }}
          className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "callbacks" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Scheduled Callbacks ({stats.totalCallbacks})
        </Button>
        <Button
          onClick={() => { setActiveTab("logs"); setSearchQuery(""); setStatusFilter("all"); }}
          className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "logs" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Audit Logs ({stats.totalCalls})
        </Button>
      </div>

      {/* ── TAB 1: LIVE SESSIONS ──────────────────────── */}
      {activeTab === "live" && (
        <div className="space-y-6">
          {liveRooms.length === 0 ? (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-16 text-center flex flex-col items-center justify-center space-y-2.5">
              <Video className="h-9 w-9 text-slate-750" />
              <p className="text-sm font-bold text-slate-400">No active sessions live</p>
              <p className="text-xs text-slate-500 max-w-sm">Ongoing customer calls will list here with live terminate capability.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveRooms.map((room) => (
                <motion.div 
                  key={room.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 animate-ping" />
                        <span>Active</span>
                      </span>
                      <h3 className="text-sm font-extrabold text-white block pt-2">{room.shops?.shop_name || "Merchant Store"}</h3>
                      <p className="text-[9px] text-slate-500 font-mono">Room: {room.room_code}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                      <Store className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px]">
                    <div className="text-slate-500 font-medium">
                      Seller: <span className="text-slate-300 font-bold">{room.profiles?.full_name || "Online Host"}</span>
                    </div>
                    <Button
                      onClick={() => handleTerminateSession(room.id, room.room_code)}
                      className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-red-500/20 transition-all cursor-pointer"
                    >
                      <ZapOff className="h-3 w-3" /> Terminate
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SCHEDULED CALLBACKS ────────────────── */}
      {activeTab === "callbacks" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search callbacks by name, email, or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-slate-800"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="called">Called</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="border-b border-slate-100 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4.5">Client Contact</th>
                    <th className="px-6 py-4.5">Storefront Target</th>
                    <th className="px-6 py-4.5">Requested Call Time</th>
                    <th className="px-6 py-4.5">Booking Status</th>
                    <th className="px-6 py-4.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-transparent text-xs text-slate-300">
                  {filteredCallbacks.map((cb, idx) => {
                    const scheduledDate = new Date(cb.scheduled_time).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        key={cb.id} 
                        className="hover:bg-slate-900/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 border border-slate-200 text-slate-500 shrink-0 font-bold">
                              {(cb.customer_name || "G").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-white block text-sm">{cb.customer_name || "Guest Customer"}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                {cb.customer_email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{cb.customer_email}</span>}
                                {cb.customer_phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{cb.customer_phone}</span>}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-white font-semibold">
                          {cb.shops?.shop_name || "—"}
                        </td>

                        <td className="px-6 py-4 text-slate-400 font-medium">
                          {scheduledDate}
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={cb.status || "pending"}
                            onChange={(e) => handleCallbackStatus(cb.id, e.target.value)}
                            disabled={updateCallback.isPending}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 disabled:opacity-50 font-bold transition-all"
                          >
                            {CALLBACK_STATUSES.map((stat) => (
                              <option key={stat.value} value={stat.value}>{stat.label}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Button
                            onClick={() => handleDeleteCallback(cb.id)}
                            disabled={deleteCallbackReq.isPending}
                            className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCallbacks.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <Calendar className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-400">No Callbacks Found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: AUDIT LOGS ──────────────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search call logs by name, email, or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-slate-800"
              >
                <option value="all">All Logs</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="no-answer">No Answer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="border-b border-slate-100 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4.5">Caller / Customer</th>
                    <th className="px-6 py-4.5">Target Store</th>
                    <th className="px-6 py-4.5">Duration</th>
                    <th className="px-6 py-4.5">Connection Date</th>
                    <th className="px-6 py-4.5">Call Result</th>
                    <th className="px-6 py-4.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-transparent text-xs text-slate-300">
                  {filteredCalls.map((c, idx) => {
                    const callDate = new Date(c.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        key={c.id} 
                        className="hover:bg-slate-900/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 border border-slate-200 text-slate-400 shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-bold text-white block text-sm">{c.customer_name || "Guest User"}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                {c.customer_email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{c.customer_email}</span>}
                                {c.customer_phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{c.customer_phone}</span>}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-white font-semibold">
                          {c.shops?.shop_name || "—"}
                        </td>

                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {formatDuration(c.duration)}
                        </td>

                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {callDate}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            c.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : c.status === "rejected"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {c.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Button
                            onClick={() => handleDeleteLog(c.id)}
                            disabled={deleteCall.isPending}
                            className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCalls.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <Clock className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-400">No Call Logs Match Filter Criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
