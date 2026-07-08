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
  AlertCircle,
  ZapOff
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAdminCalls, useLiveRooms, useDeleteCallLog } from "../hooks/useAdmin";
import { supabase } from "@/config/supabase";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";

export default function AdminCallsPage() {
  const { data: calls = [], isLoading: callsLoading } = useAdminCalls();
  const { data: liveRooms = [], isLoading: roomsLoading } = useLiveRooms();
  const deleteCall = useDeleteCallLog();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Terminate a live video session by deleting the signaling room record
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

  // Filter Logic
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

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = calls.length;
    const completed = calls.filter((c) => c.status === "completed").length;
    const missed = total - completed;
    const active = liveRooms.length;
    return { total, completed, missed, active };
  }, [calls, liveRooms]);

  // Formatter for seconds
  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const loading = callsLoading || roomsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <ProductSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white max-w-7xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Live Calls</h1>
          <p className="mt-1 text-xs text-slate-400">Monitor active WebRTC video sessions and audit historical consultations.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 max-w-4xl">
        {/* Active Session count */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live Rooms</p>
            <p className="text-xl font-bold tracking-tight text-emerald-400">{stats.active}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="h-4.5 w-4.5 animate-pulse" />
          </div>
        </div>

        {/* Total calls */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Consults</p>
            <p className="text-xl font-bold tracking-tight">{stats.total}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Video className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold tracking-tight text-blue-400">{stats.completed}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Missed / Rejected */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Missed / Rejected</p>
            <p className="text-xl font-bold tracking-tight text-amber-400">{stats.missed}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* 🟢 Live / Active Consultations Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Live Ongoing Consultations</span>
        </h2>

        {liveRooms.length === 0 ? (
          <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-10 text-center flex flex-col items-center justify-center space-y-2">
            <Video className="h-8 w-8 text-slate-750" />
            <p className="text-xs text-slate-500 font-bold">No active video consult rooms currently live</p>
            <p className="text-[10px] text-slate-600">Active customer video calls with merchants will display here in real-time.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveRooms.map((room) => (
              <motion.div 
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                      Live Call
                    </span>
                    <h3 className="text-sm font-extrabold text-white block pt-1.5">{room.shops?.shop_name || "Merchant Shop"}</h3>
                    <p className="text-[9px] text-slate-500 font-mono">Code: {room.room_code}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0 text-slate-400">
                    <Store className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                  <div className="text-[10px] text-slate-500 font-medium">
                    Seller: <span className="text-slate-300 font-bold">{room.profiles?.full_name || "Online Agent"}</span>
                  </div>
                  
                  {/* Terminate button */}
                  <button
                    onClick={() => handleTerminateSession(room.id, room.room_code)}
                    className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-red-500/20 transition-all cursor-pointer"
                  >
                    <ZapOff className="h-3 w-3" /> Terminate
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 📁 Historical Call logs list */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-455 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <span>Historical Call Audit Logs</span>
        </h2>

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by customer name, email, or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-850 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-slate-800"
            >
              <option value="all">All Logs</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="no-answer">No Answer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="border-b border-slate-900 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
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
                      {/* Customer contact card */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 border border-slate-850 text-slate-400 shrink-0">
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

                      {/* Targeted Store */}
                      <td className="px-6 py-4 text-white font-semibold">
                        {c.shops?.shop_name || "—"}
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {formatDuration(c.duration)}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-450 font-medium">
                        {callDate}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                          c.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : c.status === "rejected"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteLog(c.id)}
                          disabled={deleteCall.isPending}
                          title="Delete Call Log"
                          className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
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

    </div>
  );
}
