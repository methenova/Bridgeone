import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Video,
  UserCheck,
  Play,
  ShieldCheck,
} from "lucide-react";

/* ── SHOPIFY INSTALLATION FLOW STEPS ── */
const INSTALL_STEPS = [
  {
    id: "step1",
    step: "01",
    title: "Merchant Opens Shopify Admin",
    subtitle: "App Store 1-Click Discovery",
    detail: "Merchant searches BridgeOne in Shopify App Store or opens store app settings.",
    cardTitle: "Shopify App Store — BridgeOne Live Video",
    preview: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
            B
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">BridgeOne Live Video & Chat</h4>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Built for Shopify
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Customer Communication Platform</p>
          </div>
          <span className="text-[10px] font-bold text-slate-600">4.9 ★ (120+ Reviews)</span>
        </div>
      </div>
    ),
  },
  {
    id: "step2",
    step: "02",
    title: "Merchant Clicks 'Install App'",
    subtitle: "Zero-Code OAuth Authorization",
    detail: "1-click installation grants secure access without touching Liquid or Theme code.",
    cardTitle: "Shopify Admin OAuth Authorization",
    preview: (
      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Authorize BridgeOne for MyShopify Store</span>
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 flex items-center justify-between">
          <span>Scope: Theme App Extensions</span>
          <span className="text-emerald-600 font-bold">Verified</span>
        </div>
        <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20">
          Install App & Authorize
        </button>
      </div>
    ),
  },
  {
    id: "step3",
    step: "03",
    title: "BridgeOne Appears inside Shopify",
    subtitle: "Embedded Polaris Dashboard",
    detail: "BridgeOne console runs natively inside your Shopify Admin dashboard.",
    cardTitle: "Embedded Shopify Admin Console",
    preview: (
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-800">BridgeOne embedded in Shopify</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Active Sync</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <p className="font-bold text-slate-900 text-sm">Online</p>
            <p className="text-slate-400">Agent Status</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <p className="font-bold text-blue-600 text-sm">Enabled</p>
            <p className="text-slate-400">Theme App Block</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "step4",
    step: "04",
    title: "Widget Becomes Active on Store",
    subtitle: "Automatic Storefront Injection",
    detail: "The live video floating widget appears automatically on product and cart pages.",
    cardTitle: "Live Storefront Assistant Injection",
    preview: (
      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-blue-200/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Storefront App Embed</span>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Live on Store</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between shadow-xs">
          <span>BridgeOne Floating Widget</span>
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
        </div>
      </div>
    ),
  },
  {
    id: "step5",
    step: "05",
    title: "Customer Starts Conversation",
    subtitle: "1-Click Visitor Trigger",
    detail: "High-intent shopper taps 'Start Video' or 'Live Chat' straight on your store.",
    cardTitle: "Customer Live Video Request",
    preview: (
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            UK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">London Shopper</p>
            <p className="text-[10px] text-slate-400">Requesting Video Call</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>
    ),
  },
  {
    id: "step6",
    step: "06",
    title: "Agent Joins Instantly",
    subtitle: "Sub-3s Dispatch & In-Call Cart",
    detail: "Merchant or support agent accepts the call and pushes products live to cart.",
    cardTitle: "Live Call & Cart Synchronization",
    preview: (
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5 text-blue-400" /> Agent Maya Connected</span>
          <span className="text-[9px] bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded">Cart Pushed</span>
        </div>
        <p className="text-[10px] text-slate-300">1080p WebRTC Session Active · ₹48,000 Order</p>
      </div>
    ),
  },
];

export default function ShopifyIntegrationSection() {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const activeStep = INSTALL_STEPS[activeStepIdx];

  return (
    <section id="shopify" className="relative bg-[#FCFCFD] py-28 border-t border-slate-200/60 text-slate-900 selection:bg-blue-100">
      
      {/* Background Soft Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] right-[15%] w-[45vw] h-[45vw] rounded-full bg-emerald-50/50 blur-[140px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-50/40 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
            <ShoppingBag className="h-3.5 w-3.5" />
            NATIVE SHOPIFY APP EXPERIENCE
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.15] text-slate-900">
            Built for Shopify: <br className="hidden sm:block" />
            From <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">App Install to Live Conversation</span>
          </h2>
          <p className="text-slate-500 text-base font-normal leading-[1.65]">
            Zero coding required. Install BridgeOne natively inside your Shopify Store in 2 minutes and start connecting with shoppers immediately.
          </p>
        </div>

        {/* INTERACTIVE 6-STEP INSTALLATION MATRIX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* LEFT: Step Selector Pills */}
          <div className="lg:col-span-5 space-y-3">
            {INSTALL_STEPS.map((s, idx) => {
              const isActive = idx === activeStepIdx;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                    isActive
                      ? "bg-white border-emerald-300 shadow-[0_8px_30px_rgba(16,185,129,0.12)] scale-[1.01]"
                      : "bg-[#F8FAFC]/80 border-slate-200/70 hover:bg-white hover:border-slate-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold shrink-0 transition-colors ${
                      isActive ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                      {s.title}
                    </h4>
                    <p className="text-xs font-normal text-slate-400 mt-0.5 truncate">{s.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT: Floating Shopify Interface Visual Panel */}
          <div className="lg:col-span-7 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_12px_45px_rgba(0,0,0,0.04)] space-y-6"
              >
                {/* Polaris Header bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      S
                    </div>
                    <span className="text-xs font-bold text-slate-800">{activeStep.cardTitle}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Step {activeStep.step} / 06</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900">{activeStep.title}</h3>
                  <p className="text-xs font-semibold text-emerald-600">{activeStep.subtitle}</p>
                  <p className="text-xs sm:text-sm font-normal text-slate-500 leading-[1.65]">
                    {activeStep.detail}
                  </p>
                </div>

                {/* Micro Interface Preview Component */}
                <div className="pt-2">
                  {activeStep.preview}
                </div>

                {/* Bottom Navigation Control */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Zero theme code modification required</span>
                  <button
                    onClick={() => setActiveStepIdx((prev) => (prev + 1) % INSTALL_STEPS.length)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    <span>Next Installation Step</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
