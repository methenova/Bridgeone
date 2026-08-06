import React from "react";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS = {
  // Positive / Active / Online
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  online: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
  verified: "bg-emerald-50 text-emerald-600 border-emerald-200",

  // Warning / Pending / Waiting
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  waiting: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ringing: "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse",
  open: "bg-amber-50 text-amber-600 border-amber-200",

  // Negative / Inactive / Offline / Closed
  inactive: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  offline: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
  failed: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  canceled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  abandoned: "bg-rose-500/10 text-rose-600 border-rose-500/20"
};

/**
 * Shared Status Badge Component for displaying consistent status indicators across the app.
 */
export function StatusBadge({ status, label, className, dot = true, pulse = false }) {
  const normalizedStatus = String(status || "").toLowerCase();
  const variantClass = STATUS_VARIANTS[normalizedStatus] || "bg-slate-100 text-slate-600 border-slate-200";
  const displayLabel = label || status || "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border transition-colors",
        variantClass,
        pulse && "animate-pulse",
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            ["active", "online", "completed", "resolved", "verified"].includes(normalizedStatus)
              ? "bg-emerald-500"
              : ["pending", "waiting", "ringing", "open"].includes(normalizedStatus)
              ? "bg-amber-500"
              : ["failed", "canceled", "rejected", "abandoned"].includes(normalizedStatus)
              ? "bg-rose-500"
              : "bg-slate-400"
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
