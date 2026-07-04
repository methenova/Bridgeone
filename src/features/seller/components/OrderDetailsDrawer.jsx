import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, CreditCard, User, Package, Printer, CheckCircle, Truck, ShoppingBag, Ban } from "lucide-react";
import { useUpdateOrderStatus } from "../hooks/useSellerOrders";

export default function OrderDetailsDrawer({ isOpen, order, onClose, onPrintInvoice }) {
  const updateStatus = useUpdateOrderStatus();

  if (!order) return null;

  const dateStr = new Date(order.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isBusy = updateStatus.isPending;

  // Handle changing status
  async function handleStatusTransition(nextStatus) {
    await updateStatus.mutateAsync({
      orderId: order.id,
      status: nextStatus,
    });
  }

  // Render transition button based on status
  function StatusActions() {
    switch (order.status) {
      case "pending":
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusTransition("accepted")}
              disabled={isBusy}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <CheckCircle className="h-4 w-4" />
              Accept Order
            </button>
            <button
              onClick={() => handleStatusTransition("cancelled")}
              disabled={isBusy}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <Ban className="h-4 w-4" />
              Cancel Order
            </button>
          </div>
        );
      case "accepted":
        return (
          <button
            onClick={() => handleStatusTransition("packed")}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <Package className="h-4 w-4" />
            Mark as Packed
          </button>
        );
      case "packed":
        return (
          <button
            onClick={() => handleStatusTransition("shipped")}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <Truck className="h-4 w-4" />
            Mark as Shipped
          </button>
        );
      case "shipped":
        return (
          <button
            onClick={() => handleStatusTransition("delivered")}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <CheckCircle className="h-4 w-4" />
            Mark as Delivered
          </button>
        );
      case "delivered":
        return (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-400">🎉 Order Delivered</p>
            <p className="text-xs text-slate-500 mt-0.5">This order is completed.</p>
          </div>
        );
      case "cancelled":
        return (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <p className="text-sm font-semibold text-red-400">❌ Order Cancelled</p>
            <p className="text-xs text-slate-500 mt-0.5">This order was cancelled.</p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="order-details-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            key="order-details-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-white">Order Details</h2>
                <p className="font-mono text-xs text-slate-500 mt-0.5">
                  #{order.id.toUpperCase()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Status & Transitions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                    order.status === "pending"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : order.status === "cancelled"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <StatusActions />
              </div>

              {/* Date & Payment */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Order Placed</span>
                  <span className="font-medium text-white">{dateStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-slate-800 pt-3">
                  <span className="text-slate-400">Payment Mode</span>
                  <div className="flex items-center gap-1.5 font-medium text-white capitalize">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                    {order.payment_method}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Customer Details
                </h3>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-sm font-semibold text-white">
                    {order.customer?.full_name || "Guest Customer"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{order.customer?.email || "—"}</p>
                </div>
              </div>

              {/* Shipping Address */}
              {order.address && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Shipping Address
                  </h3>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300 space-y-1">
                    <p className="font-semibold text-white">{order.address.name}</p>
                    <p className="text-xs text-slate-400">{order.address.phone}</p>
                    <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                      {order.address.address_line1}
                      {order.address.address_line2 ? `, ${order.address.address_line2}` : ""}
                      <br />
                      {order.address.city}, {order.address.state} — {order.address.pincode}
                    </p>
                  </div>
                </div>
              )}

              {/* Items breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" /> Order Items ({order.items.length})
                </h3>
                <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                  {order.items.map((item) => {
                    const price = item.discountPrice ? Number(item.discountPrice) : Number(item.price);
                    return (
                      <div key={item.id} className="flex gap-3 p-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-800 border border-slate-700">
                          {item.product?.thumbnail_url ? (
                            <img
                              src={item.product.thumbnail_url}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{item.product?.name}</p>
                          <p className="text-xs text-slate-500">SKU: {item.product?.sku || "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">₹{item.total.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{item.quantity} × ₹{price.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer with Print Invoice */}
            <div className="shrink-0 border-t border-slate-800 bg-slate-900/50 px-6 py-4 flex gap-3">
              <button
                onClick={() => onPrintInvoice(order)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
