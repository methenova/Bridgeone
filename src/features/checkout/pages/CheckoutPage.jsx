import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShoppingBag, Loader2, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

import { Container } from "@/components/common/Container";
import { useAuthContext } from "@/context/AuthContext";
import useCartStore from "@/store/cartStore";
import { useCreateOrder } from "@/features/customer/hooks/useOrders";

import AddressList from "@/features/checkout/components/AddressList";
import CouponInput from "@/features/checkout/components/CouponInput";
import {
  createRazorpayOrder,
  openRazorpayCheckout,
} from "@/services/marketplace/razorpay.service";

const STEPS = ["Address", "Review", "Payment"];
const DELIVERY_FEE_THRESHOLD = 499;
const DELIVERY_FEE = 49;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);

  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrder = useCreateOrder();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
        <p className="mt-2 text-slate-400">Add items to proceed to checkout</p>
        <button
          onClick={() => navigate("/products")}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-500"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const deliveryFee = subtotal >= DELIVERY_FEE_THRESHOLD ? 0 : DELIVERY_FEE;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = subtotal + deliveryFee - discount;

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Razorpay order
      const rzpOrder = await createRazorpayOrder(total);

      // 2. Open Razorpay modal
      openRazorpayCheckout({
        order: rzpOrder,
        userProfile: { full_name: profile?.full_name, email: user?.email },
        onSuccess: async (paymentResponse) => {
          // 3. Save order to DB
          await createOrder.mutateAsync({
            addressId: selectedAddress.id,
            items,
            subtotal,
            discount,
            deliveryFee,
            total,
            couponCode: appliedCoupon?.coupon?.code,
            paymentId: paymentResponse.razorpay_payment_id,
            razorpayOrderId: paymentResponse.razorpay_order_id,
            paymentMethod: "razorpay",
          });
        },
        onFailure: (err) => {
          toast.error(err.message || "Payment failed");
          setIsProcessing(false);
        },
      });
    } catch (err) {
      toast.error(err.message || "Something went wrong");
      setIsProcessing(false);
    }
  }

  const OrderSummary = (
    <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-4 font-semibold text-white">Order Summary</h3>

      {/* Items */}
      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
        {items.map((item) => {
          const price = item.product.discount_price
            ? Number(item.product.discount_price)
            : Number(item.product.price);
          const img =
            item.product.product_images?.find((i) => i.is_primary)?.url ||
            item.product.thumbnail_url;

          return (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                {img && <img src={img} alt={item.product.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-white">{item.product.name}</p>
                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-white">
                ₹{(price * item.quantity).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-700 pt-4">
        <CouponInput
          subtotal={subtotal}
          appliedCoupon={appliedCoupon}
          onApply={setAppliedCoupon}
          onRemove={() => setAppliedCoupon(null)}
        />
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-700 pt-4 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="text-white">₹{subtotal.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Coupon Discount</span>
            <span>-₹{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-400">
          <span>Delivery</span>
          <span className={deliveryFee === 0 ? "text-emerald-400" : "text-white"}>
            {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-bold text-white">
          <span>Total</span>
          <span>₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <Container>
        <h1 className="mb-8 text-2xl font-bold text-white">Checkout</h1>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i <= step
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {i + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${i <= step ? "text-white" : "text-slate-500"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-px w-8 ${i < step ? "bg-blue-600" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* Left content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 0: Address */}
            {step === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Delivery Address</h2>
                </div>
                <AddressList
                  selectedId={selectedAddress?.id}
                  onSelect={setSelectedAddress}
                />
                {selectedAddress && (
                  <button
                    onClick={() => setStep(1)}
                    className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
                  >
                    Continue to Review →
                  </button>
                )}
              </div>
            )}

            {/* Step 1: Review */}
            {step === 1 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-5 text-lg font-semibold text-white">Review Order</h2>

                {/* Selected Address */}
                <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Delivering to</p>
                    <button onClick={() => setStep(0)} className="text-xs text-blue-400 hover:underline">
                      Change
                    </button>
                  </div>
                  <p className="text-sm text-slate-300">{selectedAddress.name} · {selectedAddress.phone}</p>
                  <p className="text-sm text-slate-400">
                    {selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.state} – {selectedAddress.pincode}
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const price = item.product.discount_price
                      ? Number(item.product.discount_price)
                      : Number(item.product.price);
                    return (
                      <div key={item.product.id} className="flex items-center gap-3 rounded-xl bg-slate-800 p-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                          {item.product.thumbnail_url && (
                            <img src={item.product.thumbnail_url} alt={item.product.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{item.product.name}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{price.toLocaleString()}</p>
                        </div>
                        <span className="text-sm font-bold text-white">
                          ₹{(price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
                >
                  Proceed to Payment →
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Payment</h2>
                </div>

                <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm text-blue-300">
                    💳 You will be redirected to Razorpay's secure payment gateway to complete your purchase.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Supports: UPI, Credit/Debit Cards, Net Banking, Wallets
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || createOrder.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-60"
                >
                  {(isProcessing || createOrder.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Pay ₹{total.toLocaleString()} with Razorpay
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="mt-3 w-full rounded-xl border border-slate-700 py-2.5 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  ← Back to Review
                </button>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            {OrderSummary}
          </div>

        </div>
      </Container>
    </div>
  );
}
