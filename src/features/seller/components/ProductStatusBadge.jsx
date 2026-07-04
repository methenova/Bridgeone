import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  },
  inactive: {
    label: "Inactive",
    className: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  },
  featured: {
    label: "Featured",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  },
  "low-stock": {
    label: "Low Stock",
    className: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  },
  "out-of-stock": {
    label: "Out of Stock",
    className: "bg-red-500/15 text-red-400 border border-red-500/30",
  },
};

/**
 * Reusable product status badge
 * @param {"active"|"inactive"|"featured"|"low-stock"|"out-of-stock"} status
 */
export default function ProductStatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status];

  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
