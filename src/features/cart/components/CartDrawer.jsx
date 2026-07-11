import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import useCartStore from "@/store/cartStore";

function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCartStore();

  const product = item.product;
  const price = product.discount_price
    ? Number(product.discount_price)
    : Number(product.price);

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ||
    product.product_images?.[0]?.url ||
    product.thumbnail_url;

  return (
    <div className="flex gap-3 py-4">
      {/* Image */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">📦</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {product.name}
            </p>
            <p className="text-xs text-slate-500">{product.shops?.name || product.sku}</p>
          </div>
          <button
            onClick={() => removeItem(product.id)}
            className="shrink-0 text-slate-600 transition-colors hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100">
            <button
              onClick={() => updateQuantity(product.id, item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:text-slate-900"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-medium text-slate-900 tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(product.id, item.quantity + 1)}
              disabled={item.quantity >= Number(product.stock)}
              className="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Price */}
          <span className="text-sm font-semibold text-slate-900">
            ₹{(price * item.quantity).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({ isOpen, onClose }) {
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount);
  const subtotal = useCartStore((s) => s.subtotal);

  const DELIVERY_FEE = subtotal >= 499 ? 0 : 49;
  const total = subtotal + DELIVERY_FEE;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Cart
                  {itemCount > 0 && (
                    <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs">
                      {itemCount}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <ShoppingBag className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500">Your cart is empty</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Add products to start shopping
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <CartItem key={item.product.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="shrink-0 space-y-3 border-t border-slate-200 bg-white shadow-sm px-5 py-5">
                {/* Summary */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery</span>
                    <span className={DELIVERY_FEE === 0 ? "text-emerald-400" : "text-slate-900"}>
                      {DELIVERY_FEE === 0 ? "FREE" : `₹${DELIVERY_FEE}`}
                    </span>
                  </div>
                  {DELIVERY_FEE > 0 && (
                    <p className="text-xs text-slate-600">
                      Add ₹{(499 - subtotal).toLocaleString()} more for free delivery
                    </p>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
