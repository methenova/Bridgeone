import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/config/supabase";
import { ShoppingBag, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const productId = searchParams.get("product_id");
  const shopId = searchParams.get("shop_id");

  const [product, setProduct] = useState(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: ""
  });

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    async function fetchCheckoutDetails() {
      try {
        setLoading(true);
        // Fetch product details
        const { data: prod, error: prodErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .maybeSingle();

        if (prodErr) throw prodErr;
        if (prod) {
          setProduct(prod);
        }

        // Fetch shop name if shopId is present
        if (shopId) {
          const { data: shop, error: shopErr } = await supabase
            .from("shops")
            .select("shop_name, business_name")
            .eq("id", shopId)
            .maybeSingle();
          if (!shopErr && shop) {
            setShopName(shop.shop_name || shop.business_name);
          }
        }
      } catch (err) {
        console.error("Fetch checkout product error:", err);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    }

    fetchCheckoutDetails();
  }, [productId, shopId]);

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!product) return;

    setCheckingOut(true);
    // Simulate secure network transaction delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Record a mock sale or log success
      toast.success("Payment authorized successfully!");
      setSuccess(true);
    } catch (err) {
      toast.error("Transaction failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-medium">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
          <p className="text-sm">Securing your checkout session...</p>
        </div>
      </div>
    );
  }

  if (!productId || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
          <Info className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-900">No Active Checkout Session</h1>
          <p className="text-slate-500 text-sm">We couldn't resolve the product credentials. Please launch checkout directly from the live shopping widget.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-slate-950 hover:bg-black font-bold text-white text-sm rounded-2xl transition-all"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Placed!</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your transaction has completed successfully. A receipt and order verification update will be dispatched to <span className="font-semibold text-slate-700">{formData.email}</span>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-left text-sm space-y-3">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Item</span>
              <span>Total Paid</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span className="truncate max-w-[200px]">{product.name}</span>
              <span className="font-bold text-slate-900">₹{Number(product.discount_price || product.price).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full py-4 bg-slate-950 hover:bg-black font-bold text-white text-sm rounded-2xl transition-all shadow-md"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const finalPrice = product.discount_price || product.price;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-12">
        {/* Left Side: Checkout Form */}
        <form onSubmit={handleSubmit} className="md:col-span-7 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-600 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure SSL Checkout
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Shipping & Payment</h2>
          </div>

          {/* Shipping Address Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Shipping Info</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
            </div>
            <input
              type="text"
              name="address"
              placeholder="Street Address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
            />
            <div className="grid gap-4 grid-cols-3">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-slate-400" /> 2. Payment Method
            </h3>
            <div className="relative">
              <input
                type="text"
                name="cardNumber"
                placeholder="Card Number"
                value={formData.cardNumber}
                onChange={handleChange}
                maxLength="16"
                required
                className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <input
                type="text"
                name="cardExpiry"
                placeholder="MM/YY"
                value={formData.cardExpiry}
                onChange={handleChange}
                maxLength="5"
                required
                className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
              <input
                type="text"
                name="cardCvc"
                placeholder="CVC"
                value={formData.cardCvc}
                onChange={handleChange}
                maxLength="3"
                required
                className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={checkingOut}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-950 hover:bg-black font-bold text-white text-sm rounded-2xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing secure payment...</span>
              </>
            ) : (
              <>
                <span>Authorize & Pay ₹{Number(finalPrice).toLocaleString()}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Right Side: Order Summary Card */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <ShoppingBag className="h-5 w-5 text-slate-500" /> Order Summary
            </h3>

            {/* Product Card */}
            <div className="flex gap-4">
              {product.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="h-20 w-20 rounded-2xl object-cover border border-slate-150"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xl">
                  {product.name.charAt(0)}
                </div>
              )}
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm leading-tight">{product.name}</p>
                {shopName && <p className="text-[11px] font-semibold text-slate-400">Store: {shopName}</p>}
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 inline-block">
                  {product.categories?.name || "Product"}
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{Number(product.price).toLocaleString()}</span>
              </div>
              {product.discount_price && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Product Discount</span>
                  <span>-₹{Number(product.price - product.discount_price).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span>₹{Number(finalPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
