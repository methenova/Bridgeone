import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 10;

/**
 * Color-coded inventory badge based on stock level
 */
export default function InventoryBadge({ stock, className }) {
  const qty = Number(stock);

  let label, colorClass;

  if (qty === 0) {
    label = "Out of Stock";
    colorClass = "bg-red-500/15 text-red-400 border border-red-500/30";
  } else if (qty <= LOW_STOCK_THRESHOLD) {
    label = `Low · ${qty}`;
    colorClass = "bg-orange-500/15 text-orange-400 border border-orange-500/30";
  } else {
    label = qty.toLocaleString();
    colorClass = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
