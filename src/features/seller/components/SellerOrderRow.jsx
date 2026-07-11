import { Eye, Printer } from "lucide-react";
import ProductStatusBadge from "./ProductStatusBadge";

export default function SellerOrderRow({ order, onView, onPrintInvoice }) {
  const customerName = order.customer?.full_name || "Guest Customer";
  const customerEmail = order.customer?.email || "—";
  const dateStr = new Date(order.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const mainItem = order.items[0];
  const countOtherItems = order.items.length - 1;



  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      {/* Order ID */}
      <td className="px-6 py-5 align-middle font-mono text-sm font-bold text-slate-600">
        #{order.id.slice(0, 8).toUpperCase()}
      </td>

      {/* Date */}
      <td className="px-6 py-5 align-middle text-sm text-slate-500 font-medium">
        {dateStr}
      </td>

      {/* Customer */}
      <td className="px-6 py-5 align-middle">
        <div className="text-sm font-bold text-slate-900">{customerName}</div>
        <div className="text-[10px] font-mono text-slate-500 mt-0.5">{customerEmail}</div>
      </td>

      {/* Items Summary */}
      <td className="px-6 py-5 align-middle">
        {mainItem && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200">
              {mainItem.product?.thumbnail_url ? (
                <img
                  src={mainItem.product.thumbnail_url}
                  alt={mainItem.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs">📦</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 max-w-[180px]">
                {mainItem.product?.name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Qty: {mainItem.quantity}
                {countOtherItems > 0 && ` (+${countOtherItems} more)`}
              </p>
            </div>
          </div>
        )}
      </td>

      {/* Value */}
      <td className="px-6 py-5 align-middle text-sm font-bold text-slate-900">
        ₹{order.shopTotal.toLocaleString()}
      </td>

      {/* Status */}
      <td className="px-6 py-5 align-middle">
        <div className="flex items-center gap-2">
          <ProductStatusBadge status={order.status === "pending" ? "inactive" : order.status === "cancelled" ? "inactive" : "active"} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {order.status}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-5 align-middle text-right">
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={() => onView(order)}
            title="View details"
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPrintInvoice(order)}
            title="Print Invoice"
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
