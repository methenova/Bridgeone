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
    colorClass = "bg-red-50 text-red-700 border border-red-100";
  } else if (qty <= LOW_STOCK_THRESHOLD) {
    label = `Low · ${qty}`;
    colorClass = "bg-orange-50 text-orange-700 border border-orange-100";
  } else {
    label = qty.toLocaleString();
    colorClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
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
