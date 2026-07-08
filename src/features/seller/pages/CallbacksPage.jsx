import { useState, useEffect, useMemo } from "react";
import { Loader2, Calendar, CheckCircle2, Trash2, Clock } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function CallbacksPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const [callbacks, setCallbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const shopId = shop?.id;

  useEffect(() => {
    if (!shopId) return;

    async function loadCallbacks() {
      try {
        const { data, error } = await supabase
          .from("callback_requests")
          .select("*")
          .eq("shop_id", shopId)
          .order("scheduled_time", { ascending: true });

        if (error) throw error;
        setCallbacks(data || []);
      } catch (err) {
        console.error("[Callbacks] Fetch error:", err);
        toast.error("Failed to load callback requests");
      } finally {
        setLoading(false);
      }
    }

    loadCallbacks();
  }, [shopId]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = callbacks.length;
    const pending = callbacks.filter((c) => c.status === "pending").length;
    const resolved = total - pending;

    return { total, pending, resolved };
  }, [callbacks]);

  // Mark as Resolved
  async function handleResolve(id) {
    try {
      const { error } = await supabase
        .from("callback_requests")
        .update({ status: "resolved" })
        .eq("id", id);

      if (error) throw error;

      setCallbacks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "resolved" } : c))
      );
      toast.success("Callback marked as resolved!");
    } catch (err) {
      console.error("[Callbacks] Resolve error:", err);
      toast.error("Failed to update status");
    }
  }

  // Delete Callback Request
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this callback request?")) return;

    try {
      const { error } = await supabase
        .from("callback_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCallbacks((prev) => prev.filter((c) => c.id !== id));
      toast.success("Callback request deleted!");
    } catch (err) {
      console.error("[Callbacks] Delete error:", err);
      toast.error("Failed to delete request");
    }
  }

  // Formatting helpers
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

  const isOverdue = (scheduledIso, status) => {
    if (status !== "pending") return false;
    return new Date(scheduledIso) < new Date();
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
      <div>
        <h1 className="text-3xl font-bold">Callback Requests</h1>
        <p className="mt-1 text-slate-400">Manage callback requests scheduled by offline customers.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-3">
        {/* Total Callbacks */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-bold text-white font-sans">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Callbacks */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Callbacks</p>
            <p className="text-2xl font-bold text-amber-400 font-sans">{stats.pending}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Resolved Callbacks */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-green-400 font-sans">{stats.resolved}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Callback Queue Card */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-900/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Scheduled Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {callbacks.map((c) => {
                const pending = c.status === "pending";
                const overdue = isOverdue(c.scheduled_time, c.status);
                return (
                  <tr key={c.id} className="border-b border-slate-900 hover:bg-slate-900/15 text-sm text-slate-300">
                    <td className="px-6 py-4.5 font-semibold text-white">{c.customer_name}</td>
                    <td className="px-6 py-4.5 text-slate-400">{c.customer_email || "-"}</td>
                    <td className="px-6 py-4.5 text-slate-400">{c.customer_phone || "-"}</td>
                    <td className="px-6 py-4.5">
                      <div className="space-y-0.5">
                        <span className={`text-xs font-semibold ${overdue ? "text-rose-400" : "text-white"}`}>
                          {formatDateTime(c.scheduled_time)}
                        </span>
                        {overdue && (
                          <p className="text-[9px] text-rose-500 uppercase font-bold tracking-wider animate-pulse">Overdue</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        pending
                          ? overdue
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-green-500/10 text-green-400 border border-green-500/20"
                      }`}>
                        {pending ? "Pending" : "Resolved"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {pending && (
                          <button
                            onClick={() => handleResolve(c.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                          title="Delete Request"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {callbacks.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Calendar className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No Scheduled Callbacks</p>
              <p className="text-xs text-slate-500 mt-1">Callback requests submitted by offline visitors will display here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
