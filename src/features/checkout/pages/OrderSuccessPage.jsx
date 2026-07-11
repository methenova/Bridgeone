import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Package, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/common/Container";
import { useOrder } from "@/features/customer/hooks/useOrders";

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { data: order, isLoading } = useOrder(orderId);

  return (
    <div className="min-h-screen bg-slate-50 py-20">
      <Container>
        <div className="mx-auto max-w-lg text-center">

          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 ring-8 ring-emerald-500/10"
          >
            <CheckCircle className="h-12 w-12 text-emerald-400" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-slate-900">Order Placed! 🎉</h1>
            <p className="mt-3 text-slate-500">
              Thank you for your purchase. Your order has been placed successfully.
            </p>

            {orderId && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3">
                <p className="text-xs text-slate-500">Order ID</p>
                <p className="mt-1 font-mono text-sm text-slate-700">
                  {orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}
          </motion.div>

          {/* Order items summary */}
          {!isLoading && order?.order_items?.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 text-left"
            >
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Items Ordered</h3>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {item.products?.thumbnail_url && (
                        <img
                          src={item.products.thumbnail_url}
                          alt={item.products.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-slate-900">{item.products?.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      ₹{item.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              {order && (
                <div className="mt-4 border-t border-slate-200 pt-3 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Paid</span>
                  <span>₹{Number(order.total).toLocaleString()}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex flex-col gap-3"
          >
            <Link
              to="/orders"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
            >
              <Package className="h-4 w-4" />
              Track My Order
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/products"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </motion.div>

        </div>
      </Container>
    </div>
  );
}
