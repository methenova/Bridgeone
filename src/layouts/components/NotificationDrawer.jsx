import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Bell,
  LifeBuoy,
  UserPlus,
  ShieldAlert,
  Activity,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { supabase } from "@/config/supabase";

/* ── helpers ──────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const typeConfig = {
  support: {
    icon: LifeBuoy,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Support",
  },
  signup: {
    icon: UserPlus,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "New User",
  },
  audit: {
    icon: Activity,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Activity",
  },
};

/* ── component ────────────────────────────────────────── */
export default function NotificationDrawer({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef(null);

  async function fetchNotifications() {
    setLoading(true);
    try {
      // 1. New support tickets (last 30)
      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id, title, type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      // 2. New user signups (last 30)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      // 3. Audit log activity (last 30)
      const { data: audits } = await supabase
        .from("audit_logs")
        .select("id, action, module, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      const merged = [
        ...(tickets || []).map((t) => ({
          id: `ticket-${t.id}`,
          type: "support",
          title: t.title || "Support Ticket",
          message: `${t.type || "General"} · Status: ${t.status || "Open"}`,
          created_at: t.created_at,
        })),
        ...(profiles || []).map((p) => ({
          id: `profile-${p.id}`,
          type: "signup",
          title: `New ${p.role === "seller" ? "Seller" : "User"} Registered`,
          message: p.full_name || "Unknown User",
          created_at: p.created_at,
        })),
        ...(audits || []).map((a) => ({
          id: `audit-${a.id}`,
          type: "audit",
          title: a.action || "Platform Action",
          message: `${a.module || "System"} · ${a.status || ""}`,
          created_at: a.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setItems(merged);
    } catch (err) {
      console.error("Notification fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-4 top-4 bottom-4 z-50 w-[360px] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  <p className="text-[10px] text-slate-400">Platform activity feed</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={fetchNotifications}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-none">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading activity…</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                  <Inbox className="h-8 w-8" />
                  <p className="text-xs font-semibold">No recent activity</p>
                </div>
              ) : (
                items.map((item, i) => {
                  const cfg = typeConfig[item.type] || typeConfig.audit;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border ${cfg.border}`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{item.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-[9px] text-slate-400">{timeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-3 shrink-0">
              <p className="text-[10px] text-slate-400 text-center">
                Showing last 30 events across support, signups & audit logs
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
