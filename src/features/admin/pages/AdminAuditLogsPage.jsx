import { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Activity, 
  Globe,
  Terminal
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  // Load audit logs from db
  async function loadLogs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("[AuditLogs] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  // Clear log logs helper
  async function handleClearAll() {
    if (!window.confirm("CRITICAL: Are you sure you want to clear all system audit logs? This cannot be undone.")) return;
    try {
      const { error } = await supabase
        .from("audit_logs")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all

      if (error) throw error;
      toast.success("Audit log history cleared");
      loadLogs();
    } catch (err) {
      toast.error(err.message || "Failed to clear audit trail");
    }
  }

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const actorName = log.profiles?.full_name || "System Autopilot";
      const actorEmail = log.profiles?.email || "";
      const matchesSearch = 
        actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      const matchesModule = moduleFilter === "all" || log.module === moduleFilter;

      return matchesSearch && matchesStatus && matchesModule;
    });
  }, [logs, searchQuery, statusFilter, moduleFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Security Audit Logs</h1>
          <p className="mt-1 text-xs text-slate-500">Track and inspect Super Admin actions, role changes, and tenant modification details.</p>
        </div>

        <Button
          onClick={handleClearAll}
          className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 cursor-pointer transition-all active:scale-[0.98]"
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear Logs History</span>
        </Button>
      </div>

      {/* Utilities bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by action, module, or admin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All States</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Module filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-955 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-200"
            >
              <option value="all">All Modules</option>
              <option value="Users">Users</option>
              <option value="Shops">Organizations</option>
              <option value="Settings">Settings</option>
              <option value="Plans">Subscriptions</option>
              <option value="LiveCalls">Live Calls</option>
            </select>
          </div>
        </div>

      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-5 align-middle">Administrator / Actor</th>
                <th className="px-6 py-5 align-middle">Audit Action details</th>
                <th className="px-6 py-5 align-middle">Target Module</th>
                <th className="px-6 py-5 align-middle">Client IP / Client Browser</th>
                <th className="px-6 py-5 align-middle">Status</th>
                <th className="px-6 py-5 align-middle">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
              {filteredLogs.map((log, idx) => {
                const dateText = log.created_at ? new Date(log.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "—";

                const isSuccess = log.status === "success";
                const actorName = log.profiles?.full_name || "System Autopilot";
                const actorEmail = log.profiles?.email || "system@bridgeone.com";

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={log.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Actor profile */}
                    <td className="px-6 py-5 align-middle">
                      <div className="font-semibold text-slate-900">{actorName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{actorEmail}</div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-5 align-middle max-w-xs leading-relaxed font-bold text-slate-800">
                      {log.action}
                    </td>

                    {/* Target Module */}
                    <td className="px-6 py-5 align-middle font-semibold text-slate-500">
                      {log.module}
                    </td>

                    {/* IP & Browser */}
                    <td className="px-6 py-5 align-middle text-[10px] font-mono leading-normal text-slate-500">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>IP: {log.ip_address || "127.0.0.1"}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Terminal className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{log.browser || "Chrome Browser"}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-5 align-middle">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                        isSuccess
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {isSuccess ? (
                          <>
                            <CheckCircle2 className="h-2.5 w-2.5" /> OK
                          </>
                        ) : (
                          <>
                            <XCircle className="h-2.5 w-2.5" /> ERR
                          </>
                        )}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5 align-middle text-slate-500 font-medium">{dateText}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <FileText className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No system audit logs found</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
