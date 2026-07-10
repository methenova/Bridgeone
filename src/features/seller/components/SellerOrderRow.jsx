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
    <tr className="hover:bg-slate-50/40 transition-colors">
      {/* Order ID */}
      <td className="px-6 py-4 font-mono text-sm text-slate-600">
        #{order.id.slice(0, 8).toUpperCase()}
      </td>

      {/* Date */}
      <td className="px-6 py-4 text-sm text-slate-500">
        {dateStr}
      </td>

      {/* Customer */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900">{customerName}</div>
        <div className="text-xs text-slate-500">{customerEmail}</div>
      </td>

      {/* Items Summary */}
      <td className="px-6 py-4">
        {mainItem && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-200">
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
              <p className="truncate text-sm text-slate-900 max-w-[180px]">
                {mainItem.product?.name}
              </p>
              <p className="text-xs text-slate-500">
                Qty: {mainItem.quantity}
                {countOtherItems > 0 && ` (+${countOtherItems} more)`}
              </p>
            </div>
          </div>
        )}
      </td>

      {/* Value */}
      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
        ₹{order.shopTotal.toLocaleString()}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <ProductStatusBadge status={order.status === "pending" ? "inactive" : order.status === "cancelled" ? "inactive" : "active"} />
          <span className="text-xs font-semibold capitalize text-slate-600">
            {order.status}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onView(order)}
            title="View details"
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:border-slate-500 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPrintInvoice(order)}
            title="Print Invoice"
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:border-slate-500 transition-colors"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
