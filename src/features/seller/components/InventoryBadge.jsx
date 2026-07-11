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
    colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (qty <= LOW_STOCK_THRESHOLD) {
    label = `Low · ${qty}`;
    colorClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
  } else {
    label = qty.toLocaleString();
    colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border tabular-nums",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
