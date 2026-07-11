import { useState, useEffect, useMemo } from "react";
import { Loader2, Calendar, CheckCircle2, Trash2, Clock } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";
import { motion } from "framer-motion";

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
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center pb-4">
          <div className="h-6 w-32 bg-slate-100 rounded-md" />
          <div className="h-10 w-24 bg-slate-100 rounded-md" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
          <div className="h-10 bg-slate-50 rounded-xl" />
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-12 bg-slate-50/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Callback Requests</h1>
        <p className="mt-1 text-slate-500">Manage callback requests scheduled by offline customers.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-3">
        {/* Total Callbacks */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-bold text-slate-900 font-sans">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Callbacks */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Callbacks</p>
            <p className="text-2xl font-bold text-amber-600 font-semibold font-sans">{stats.pending}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 font-semibold flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Resolved Callbacks */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-emerald-600 font-semibold font-sans">{stats.resolved}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 font-semibold flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Callback Queue Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-5 align-middle">Customer</th>
                <th className="px-6 py-5 align-middle">Email</th>
                <th className="px-6 py-5 align-middle">Phone</th>
                <th className="px-6 py-5 align-middle">Scheduled Date & Time</th>
                <th className="px-6 py-5 align-middle">Status</th>
                <th className="px-6 py-5 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
              {callbacks.map((c, idx) => {
                const pending = c.status === "pending";
                const overdue = isOverdue(c.scheduled_time, c.status);
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={c.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5 align-middle font-bold text-slate-900 text-sm">{c.customer_name}</td>
                    <td className="px-6 py-5 align-middle font-mono text-[10px] text-slate-500">{c.customer_email || "-"}</td>
                    <td className="px-6 py-5 align-middle font-mono text-[10px] text-slate-500">{c.customer_phone || "-"}</td>
                    <td className="px-6 py-5 align-middle font-medium text-slate-500">
                      <div className="space-y-0.5">
                        <span className={`text-xs font-medium ${overdue ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                          {formatDateTime(c.scheduled_time)}
                        </span>
                        {overdue && (
                          <p className="text-[9px] text-rose-600 uppercase font-bold tracking-wider animate-pulse mt-0.5">Overdue</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        pending
                          ? overdue
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}>
                        {pending ? "Pending" : "Resolved"}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-middle text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {pending && (
                          <button
                            onClick={() => handleResolve(c.id)} 
                            title="Resolve"
                            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)} 
                          title="Delete Request"
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:ring-offset-1 text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {callbacks.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Calendar className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No Scheduled Callbacks</p>
              <p className="text-xs text-slate-500 mt-1">Callback requests submitted by offline visitors will display here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
