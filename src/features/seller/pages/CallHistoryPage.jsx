import { useState, useEffect, useMemo } from "react";
import { Loader2, Phone, PhoneCall, PhoneMissed, Trash2, Calendar, X, Star, Save, Activity, BadgeDollarSign, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function CallHistoryPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const shopId = shop?.id;

  const [selectedCall, setSelectedCall] = useState(null);
  const [editingResolution, setEditingResolution] = useState("Resolved");
  const [editingRevenue, setEditingRevenue] = useState(0);
  const [editingCSAT, setEditingCSAT] = useState(5);
  const [savingCallDetails, setSavingCallDetails] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    async function loadCallHistory() {
      try {
        const { data, error } = await supabase
          .from("call_logs")
          .select(`
            *,
            transferred_agent:transferred_agent_id ( full_name )
          `)
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

  // Save call log edits
  async function handleSaveCallDetails() {
    if (!selectedCall || savingCallDetails) return;
    setSavingCallDetails(true);
    try {
      const { error } = await supabase
        .from("call_logs")
        .update({
          resolution_status: editingResolution,
          revenue_generated: Number(editingRevenue) || 0,
          csat_score: Number(editingCSAT) || 5
        })
        .eq("id", selectedCall.id);

      if (error) throw error;
      toast.success("Call logs upgraded successfully!");
      
      // Reload
      const { data } = await supabase
        .from("call_logs")
        .select(`
          *,
          transferred_agent:transferred_agent_id ( full_name )
        `)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      
      setCalls(data || []);
      setSelectedCall(null);
    } catch (err) {
      toast.error("Failed to update call log details");
    } finally {
      setSavingCallDetails(false);
    }
  }

  function handleOpenDetails(call) {
    setSelectedCall(call);
    setEditingResolution(call.resolution_status || "Resolved");
    setEditingRevenue(call.revenue_generated || 0);
    setEditingCSAT(call.csat_score || 5);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Call History</h1>
          <p className="mt-1 text-slate-500">Track and review customer video consultation call logs.</p>
        </div>

        {calls.length > 0 && (
          <button
            onClick={handleClearHistory} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-650 font-semibold hover:text-rose-350 bg-rose-50 border border-rose-100/50 hover:bg-rose-500/20 border-rose-500/20 rounded-2xl transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All History
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Total Calls */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Calls</p>
            <p className="text-2xl font-bold text-slate-900 font-sans">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center shrink-0">
            <PhoneCall className="h-5 w-5" />
          </div>
        </div>

        {/* Connected Calls */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connected</p>
            <p className="text-2xl font-bold text-emerald-600 font-semibold font-sans">{stats.connected}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 font-semibold flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5" />
          </div>
        </div>

        {/* Missed Calls */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed / Missed Callback</p>
            <p className="text-2xl font-bold text-rose-650 font-semibold font-sans">{stats.missed}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-100/50 text-rose-650 font-semibold flex items-center justify-center shrink-0">
            <PhoneMissed className="h-5 w-5" />
          </div>
        </div>

        {/* Average Duration */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Duration</p>
            <p className="text-2xl font-bold text-slate-900 font-sans">{stats.avgDuration ? formatDuration(stats.avgDuration) : "0s"}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider hover:bg-slate-50/50 transition-colors group">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Customer</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Email</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Phone</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Date & Time</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Duration</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => {
                const isMissed = call.status === "missed" || !call.duration;
                return (
                  <tr 
                    key={call.id} 
                    onClick={() => handleOpenDetails(call)} className="border-b border-slate-100 hover:bg-slate-50 text-sm text-slate-600 cursor-pointer transition-colors"
                  >
                    <td className="py-4.5 font-semibold text-slate-900 px-6 py-5 align-middle">{call.customer_name}</td>
                    <td className="py-4.5 text-slate-500 px-6 py-5 align-middle">{call.customer_email || "-"}</td>
                    <td className="py-4.5 text-slate-500 px-6 py-5 align-middle">{call.customer_phone || "-"}</td>
                    <td className="py-4.5 text-xs text-slate-500 font-medium px-6 py-5 align-middle">{formatDateTime(call.created_at)}</td>
                    <td className="py-4.5 font-mono text-xs px-6 py-5 align-middle">{formatDuration(call.duration)}</td>
                    <td className="py-4.5 px-6 py-5 align-middle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isMissed
                          ? "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                          : "bg-green-500/10 text-green-500 border border-green-500/20"
                      }`}>
                        {isMissed ? "Missed" : "Completed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* CALL DETAILS SLIDE OUT DRAWER */}
          <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out ${
            selectedCall ? "translate-x-0" : "translate-x-full"
          }`}>
            {selectedCall && (
              <div className="h-full flex flex-col justify-between p-6">
                <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{selectedCall.customer_name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Call Ref: #{selectedCall.id.substring(0,8).toUpperCase()}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedCall(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Operational Quality metrics */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-white shadow-sm border border-slate-100/80 p-3.5 rounded-2xl border-slate-100">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Call Quality</span>
                      <span className="text-sm font-bold text-slate-900 block mt-1">
                        {selectedCall.call_quality || "Good Quality"}
                      </span>
                    </div>

                    <div className="bg-white shadow-sm border border-slate-100/80 p-3.5 rounded-2xl border-slate-100">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Network Quality</span>
                      <span className="text-sm font-bold text-slate-900 block mt-1">
                        {selectedCall.network_quality || "45ms Latency (Excellent)"}
                      </span>
                    </div>
                  </div>

                  {/* Products & Revenue */}
                  <div className="space-y-4">
                    <div className="bg-white shadow-sm border border-slate-100/80 p-4 rounded-2xl border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Products Shared</span>
                        <span className="font-bold text-slate-600">
                          {selectedCall.products_shared?.length || 1} items
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 font-medium">
                        {selectedCall.products_shared?.join(", ") || "No Shared Products Catalog"}
                      </p>
                    </div>

                    <div className="bg-white shadow-sm border border-slate-100/80 p-4 rounded-2xl border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <BadgeDollarSign className="h-5 w-5 text-emerald-400" />
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Revenue Generated</span>
                          <span className="text-xs text-slate-900 font-bold">₹{editingRevenue.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <input 
                        type="number"
                        value={editingRevenue}
                        onChange={(e) => setEditingRevenue(e.target.value)} className="w-24 bg-slate-50 border border-slate-100 rounded-2xl px-2 py-1 text-xs text-right outline-none text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Transfer details */}
                  <div className="bg-white shadow-sm border border-slate-100/80 p-4 rounded-2xl border-slate-100 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Transferred Agent</span>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600 font-semibold" />
                      <span className="text-xs font-semibold text-slate-900">
                        {selectedCall.transferred_agent?.full_name || "Direct Agent consultation"}
                      </span>
                    </div>
                  </div>

                  {/* Resolution Status Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Resolution Status</label>
                    <select
                      value={editingResolution}
                      onChange={(e) => setEditingResolution(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer font-semibold"
                    >
                      <option value="Resolved">Resolved (Assisted checkouts)</option>
                      <option value="Follow-up Required">Follow-up Required</option>
                      <option value="No Answer">No Answer / Dropoff</option>
                      <option value="Callback Scheduled">Callback Scheduled</option>
                    </select>
                  </div>

                  {/* Call Rating Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Customer Satisfaction (CSAT)</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star}
                          onClick={() => setEditingCSAT(star)} className="text-slate-500 hover:text-amber-400 cursor-pointer"
                        >
                          <Star className={`h-6 w-6 ${editingCSAT >= star ? "text-amber-400 fill-amber-400" : "text-slate-650"}`} />
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 block">Rating: {editingCSAT * 20}% CSAT Score</span>
                  </div>

                </div>

                {/* Footer Save Button */}
                <button
                  onClick={handleSaveCallDetails}
                  disabled={savingCallDetails} className="w-full py-3 bg-blue-600 hover:bg-blue-550 rounded-2xl font-bold text-white text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-4 transition-all active:scale-[0.98] hover:bg-blue-500 shadow-lg shadow-blue-500/10"
                >
                  {savingCallDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Call Telemetry</span>
                </button>
              </div>
            )}
          </div>

          {calls.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Phone className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No Calls Registered</p>
              <p className="text-xs text-slate-500 mt-1">Live customer call logs will be logged here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
