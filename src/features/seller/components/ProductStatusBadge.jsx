import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  inactive: {
    label: "Inactive",
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
  featured: {
    label: "Featured",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  "low-stock": {
    label: "Low Stock",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  "out-of-stock": {
    label: "Out of Stock",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
