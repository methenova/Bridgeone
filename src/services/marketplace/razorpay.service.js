import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// Razorpay Service
//
// NOTE: Razorpay order must be created server-side (key_secret required).
// We use a Supabase Edge Function for this.
// Edge Function name: "create-razorpay-order"
//
// To deploy the edge function, run:
//   supabase functions new create-razorpay-order
// Then add the code from /supabase/functions/create-razorpay-order/index.ts
// ─────────────────────────────────────────────────────────────

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

// ─────────────────────────────────────────────────────────────
// CREATE RAZORPAY ORDER — via Supabase Edge Function
// ─────────────────────────────────────────────────────────────
export async function createRazorpayOrder(amountInRupees) {
  const { data, error } = await supabase.functions.invoke(
    "create-razorpay-order",
    {
      body: { amount: Math.round(amountInRupees * 100) }, // paise
    }
  );

  if (error) throw new Error(error.message || "Failed to create payment order");

  return data; // { id, amount, currency }
}

// ─────────────────────────────────────────────────────────────
// OPEN RAZORPAY CHECKOUT MODAL
// ─────────────────────────────────────────────────────────────
export function openRazorpayCheckout({ order, userProfile, onSuccess, onFailure }) {
  if (!window.Razorpay) {
    onFailure?.(new Error("Razorpay SDK not loaded"));
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency || "INR",
    name: "BridgeOne",
    description: "Order Payment",
    order_id: order.id,
    prefill: {
      name: userProfile?.full_name || "",
      email: userProfile?.email || "",
      contact: userProfile?.phone || "",
    },
    theme: {
      color: "#2563eb",
    },
    handler: (response) => {
      onSuccess?.({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: () => {
        onFailure?.(new Error("Payment cancelled by user"));
      },
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on("payment.failed", (response) => {
    onFailure?.(new Error(response.error?.description || "Payment failed"));
  });

  rzp.open();
}
