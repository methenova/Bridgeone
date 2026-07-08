import { useState, useEffect, useMemo } from "react";
import { Loader2, Phone, PhoneCall, PhoneMissed, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function CallHistoryPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const shopId = shop?.id;

  useEffect(() => {
    if (!shopId) return;

    async function loadCallHistory() {
      try {
        const { data, error } = await supabase
          .from("call_logs")
          .select("*")
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCalls(data || []);
      } catch (err) {
        console.error("[CallHistory] Fetch error:", err);
        toast.error("Failed to load call history");
      } finally {
        setLoading(false);
      }
    }

    loadCallHistory();
  }, [shopId]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = calls.length;
    const connected = calls.filter((c) => c.status === "completed" || c.duration > 0).length;
    const missed = total - connected;
    
    let totalDuration = 0;
    calls.forEach((c) => {
      totalDuration += c.duration || 0;
    });
    
    const avgDuration = connected > 0 ? Math.round(totalDuration / connected) : 0;

    return { total, connected, missed, avgDuration };
  }, [calls]);

  // Clear log history
  async function handleClearHistory() {
    if (!window.confirm("Are you sure you want to clear all call history? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("call_logs")
        .delete()
        .eq("shop_id", shopId);

      if (error) throw error;
      setCalls([]);
      toast.success("Call history cleared successfully!");
    } catch (err) {
      console.error("[CallHistory] Clear error:", err);
      toast.error("Failed to clear call history");
    }
  }

  // Format date helper
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format duration helper
  const formatDuration = (sec) => {
    if (!sec || sec === 0) return "-";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (shopLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Call History</h1>
          <p className="mt-1 text-slate-400">Track and review customer video consultation call logs.</p>
        </div>

        {calls.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-350 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All History
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Total Calls */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Calls</p>
            <p className="text-2xl font-bold text-white font-sans">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
            <PhoneCall className="h-5 w-5" />
          </div>
        </div>

        {/* Connected Calls */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connected</p>
            <p className="text-2xl font-bold text-green-400 font-sans">{stats.connected}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5" />
          </div>
        </div>

        {/* Missed Calls */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed / Missed Callback</p>
            <p className="text-2xl font-bold text-rose-400 font-sans">{stats.missed}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <PhoneMissed className="h-5 w-5" />
          </div>
        </div>

        {/* Average Duration */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Duration</p>
            <p className="text-2xl font-bold text-white font-sans">{stats.avgDuration ? formatDuration(stats.avgDuration) : "0s"}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-900/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => {
                const isMissed = call.status === "missed" || !call.duration;
                return (
                  <tr key={call.id} className="border-b border-slate-900 hover:bg-slate-900/15 text-sm text-slate-300">
                    <td className="px-6 py-4.5 font-semibold text-white">{call.customer_name}</td>
                    <td className="px-6 py-4.5 text-slate-400">{call.customer_email || "-"}</td>
                    <td className="px-6 py-4.5 text-slate-400">{call.customer_phone || "-"}</td>
                    <td className="px-6 py-4.5 text-xs text-slate-400 font-medium">{formatDateTime(call.created_at)}</td>
                    <td className="px-6 py-4.5 font-mono text-xs">{formatDuration(call.duration)}</td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isMissed
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-green-500/10 text-green-400 border border-green-500/20"
                      }`}>
                        {isMissed ? "Missed" : "Completed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {calls.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Phone className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No Calls Registered</p>
              <p className="text-xs text-slate-500 mt-1">Live customer call logs will be logged here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
