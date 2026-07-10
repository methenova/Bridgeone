import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  inactive: {
    label: "Inactive",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  featured: {
    label: "Featured",
    className: "bg-amber-50 text-amber-700 border border-amber-100",
  },
  "low-stock": {
    label: "Low Stock",
    className: "bg-orange-50 text-orange-700 border border-orange-100",
  },
  "out-of-stock": {
    label: "Out of Stock",
    className: "bg-red-50 text-red-700 border border-red-100",
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
