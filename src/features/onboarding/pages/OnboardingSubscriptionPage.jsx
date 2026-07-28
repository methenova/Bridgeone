import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, ArrowRight, Sparkles, AlertCircle, Check, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { saveTemporaryOnboardingState, finalizeOnboarding } from "@/features/onboarding/services/onboarding.service";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: "Base Plan",
    price: "$15",
    period: "per month",
    description: "For growing stores looking to introduce live communication.",
    limits: "Max 2 Agents • 500 calls/mo • 1 Shop",
    features: [
      "Up to 2 Agent seats",
      "Live HD Video & Crystal Audio",
      "In-Call product pushing & cart add",
      "Standard web widget embed",
      "Basic call analytics & logs",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    price: "$25",
    period: "per month",
    description: "For high-volume commerce brands scaling live video sales.",
    limits: "Max 10 Agents • 5,000 calls/mo • Multi-Store",
    features: [
      "Up to 10 Agent seats",
      "Sub-50ms ultra-fast video streams",
      "Full CRM & Shopify Integration",
      "Custom branding & color themes",
      "AI call summaries & customer analytics",
      "Priority web widget routing",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Unlimited Scale",
    price: "Custom",
    period: "contact sales",
    description: "Custom infrastructure & dedicated support for enterprise teams.",
    limits: "Unlimited Agents • Unlimited calls • White-Label",
    features: [
      "Unlimited Agent seats",
      "Dedicated low-latency edge node",
      "Custom domain & full White Labeling",
      "24/7 Priority SLA support & account manager",
      "Custom Webhook & API integrations",
      "Advanced fraud & security controls",
    ],
    popular: false,
  },
];

export default function OnboardingSubscriptionPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuthContext();

  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useState(() => {
    const meta = profile?.onboarding_metadata || {};
    if (meta.selectedPlan) {
      setSelectedPlan(meta.selectedPlan);
    }
  }, [profile]);

  async function handleSaveSubscription(e) {
    e.preventDefault();

    if (!selectedPlan) {
      setErrorMsg("Please select a subscription plan.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      if (user?.id) {
        // 1. Save plan temporarily to get the complete metadata set
        const updatedProfile = await saveTemporaryOnboardingState(user.id, {
          selectedPlan: selectedPlan,
        });

        const onboardingMetadata = updatedProfile?.onboarding_metadata || {};

        // 2. Finalize onboarding: Creates Organization, Shop, Widget Credentials, and Subscription with automatic rollback
        const result = await finalizeOnboarding(user.id, onboardingMetadata);

        // 3. Refresh context profiles state
        await refreshProfile();

        // 4. Redirect to Stripe checkout session for paid tiers
        if (selectedPlan === "growth" || selectedPlan === "enterprise") {
          const { supabase } = await import("@/config/supabase");
          const { data, error: stripeError } = await supabase.functions.invoke("create-checkout-session", {
            body: {
              plan: selectedPlan,
              shopId: result.shop.id,
              successUrl: `${window.location.origin}/onboarding/installation?session_id={CHECKOUT_SESSION_ID}`,
              cancelUrl: `${window.location.origin}/onboarding/subscription`
            }
          });

          if (stripeError) throw stripeError;
          if (data?.url) {
            window.location.href = data.url;
            return;
          } else {
            throw new Error("Failed to initialize Stripe Payment session URL.");
          }
        }
      }

      // Redirect to /onboarding/installation (Free trial plans)
      navigate("/onboarding/installation", { replace: true });
    } catch (error) {
      console.error("Subscription save & finalize onboarding error:", error);
      setErrorMsg(error.message || "Failed to finalize onboarding setup. Rollback initiated successfully.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200/60 text-fuchsia-600 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Flexible Seller Pricing
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Select Your Subscription Plan
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto">
          Choose a plan that fits your business scale. All plans include live video streaming & instant agent call routing.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      <form onSubmit={handleSaveSubscription} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 text-white shadow-2xl shadow-slate-900/30 scale-[1.02] ring-4 ring-fuchsia-500/30 border-transparent"
                    : "bg-white/85 backdrop-blur-2xl border border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-xl"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-5">
                  {/* Title & Badge */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-xl font-extrabold ${isSelected ? "text-white" : "text-slate-900"}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs font-medium mt-1 ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold tracking-tight ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-xs font-semibold ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      /{plan.period}
                    </span>
                  </div>

                  {/* Limits Callout */}
                  <div className={`p-3 rounded-2xl text-xs font-semibold border ${
                    isSelected
                      ? "bg-slate-900 border-slate-800 text-fuchsia-400"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <span className="font-extrabold uppercase text-[10px] tracking-wider block text-slate-400 mb-0.5">Limits</span>
                    {plan.limits}
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 pt-2">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider block ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      Included Features:
                    </span>
                    <ul className="space-y-2 text-xs">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-fuchsia-400" : "text-emerald-500"}`} />
                          <span className={isSelected ? "text-slate-200" : "text-slate-700"}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Select Plan Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                  className={`w-full mt-6 py-3.5 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/30"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Plan Selected</span>
                    </>
                  ) : (
                    <span>Select {plan.name}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Submit Action */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-md flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-4 text-sm shadow-xl shadow-slate-900/15 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Saving Subscription...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 text-fuchsia-400" />
                <span>Confirm Subscription & Continue to Installation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="pt-2 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Stores record in subscriptions table & sets current_onboarding_step = 5
      </div>
    </motion.div>
  );
}
