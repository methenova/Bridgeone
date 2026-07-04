import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer, ShoppingBag, CreditCard, MapPin, Loader2 } from "lucide-react";

import { Container } from "@/components/common/Container";
import { useOrder, useCancelOrder, useReturnOrder } from "../hooks/useOrders";
import OrderStatusTimeline from "../components/OrderStatusTimeline";
import CustomerInvoiceModal from "../components/CustomerInvoiceModal";

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams();
  const { data: order, isLoading } = useOrder(orderId);

  const cancelOrder = useCancelOrder();
  const returnOrder = useReturnOrder();

  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 py-10">
        <Container>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-900 border border-slate-800" />
        </Container>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 py-20 text-center">
        <p className="text-xl text-white">Order not found</p>
        <Link to="/orders" className="mt-4 inline-block text-blue-400 underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = Number(order.subtotal);
  const delivery = Number(order.delivery_fee);
  const discount = Number(order.discount);
  const total = Number(order.total);

  const isPending = order.status === "pending";
  const isDelivered = order.status === "delivered";
  const isBusy = cancelOrder.isPending || returnOrder.isPending;

  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <Container>

        {/* Back Link */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Orders
        </Link>

        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Order Details</h1>
            <p className="mt-1 text-slate-400">Placed on {orderDate}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setInvoiceOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Invoice Receipt
            </button>

            {isPending && (
              <button
                disabled={isBusy}
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel this order?")) {
                    cancelOrder.mutate(order.id);
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Cancel Order
              </button>
            )}

            {isDelivered && (
              <button
                disabled={isBusy}
                onClick={() => {
                  if (window.confirm("Do you want to return this order and request a refund?")) {
                    returnOrder.mutate(order.id);
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
              >
                {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Return Order
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 mb-8">
          <h3 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Order Status Timeline
          </h3>
          <OrderStatusTimeline status={order.status} />
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Address & Payment summaries */}
            <div className="grid gap-6 sm:grid-cols-2">

              {/* Address */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Shipping Address
                </h3>
                {order.addresses ? (
                  <div className="text-sm text-slate-300 space-y-1">
                    <p className="font-semibold text-white">{order.addresses.name}</p>
                    <p className="text-xs text-slate-400">{order.addresses.phone}</p>
                    <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                      {order.addresses.address_line1}
                      {order.addresses.address_line2 ? `, ${order.addresses.address_line2}` : ""}
                      <br />
                      {order.addresses.city}, {order.addresses.state} — {order.addresses.pincode}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}
              </div>

              {/* Payment details */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Payment Method
                </h3>
                <div className="text-sm text-slate-300 space-y-1">
                  <p className="font-semibold text-white capitalize">{order.payment_method}</p>
                  {order.payment_id && (
                    <p className="text-xs text-slate-500 font-mono mt-1">Txn ID: {order.payment_id}</p>
                  )}
                  <p className="text-xs font-semibold text-emerald-400 mt-2">Paid successfully</p>
                </div>
              </div>

            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" /> Items Purchased
              </h3>
              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {order.order_items?.map((item) => {
                  const itemPrice = item.discount_price ? Number(item.discount_price) : Number(item.price);
                  return (
                    <div key={item.id} className="flex gap-4 p-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-800 border border-slate-700">
                        {item.products?.thumbnail_url ? (
                          <img
                            src={item.products.thumbnail_url}
                            alt={item.products.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs">📦</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{item.products?.name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Sold by: <span className="text-blue-400 font-medium">{item.shops?.name || "BridgeOne Vendor"}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-white">₹{item.total.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.quantity} × ₹{itemPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Pricing Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Pricing Details</h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-white">₹{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charges</span>
                  <span className={delivery === 0 ? "text-emerald-400" : "text-white"}>
                    {delivery === 0 ? "FREE" : `₹${delivery}`}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-700 pt-3 text-base font-bold text-white">
                  <span>Grand Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </Container>

      {/* Invoice Receipt Modal */}
      <CustomerInvoiceModal
        isOpen={invoiceOpen}
        order={order}
        onClose={() => setInvoiceOpen(false)}
      />
    </div>
  );
}
