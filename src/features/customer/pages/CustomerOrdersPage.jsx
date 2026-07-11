import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";

import { Container } from "@/components/common/Container";
import { useOrders } from "../hooks/useOrders";

export default function CustomerOrdersPage() {
  const { data: orders = [], isLoading } = useOrders();

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="mt-1 text-slate-500">
            View order details, invoice receipts, and delivery tracking.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white shadow-sm border border-slate-200" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-slate-200 bg-white/50 shadow-sm text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No orders yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              You haven't placed any orders on BridgeOne.
            </p>
            <Link
              to="/products"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const orderDate = new Date(order.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:border-slate-200"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/40 px-6 py-4 border-b border-slate-200 text-sm">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Date Placed</p>
                        <p className="mt-0.5 font-semibold text-slate-700">{orderDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Total Paid</p>
                        <p className="mt-0.5 font-semibold text-slate-900">₹{Number(order.total).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Order ID</p>
                        <p className="mt-0.5 font-mono font-medium text-slate-500">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        order.status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : order.status === "cancelled"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {order.status}
                      </span>

                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Track Order
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="p-6 divide-y divide-slate-100">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                          {item.products?.thumbnail_url ? (
                            <img
                              src={item.products.thumbnail_url}
                              alt={item.products.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-600">📦</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">
                            {item.products?.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Qty: {item.quantity} · Price: ₹{(item.discount_price ? Number(item.discount_price) : Number(item.price)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
