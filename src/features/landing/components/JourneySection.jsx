import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  MessageCircle,
  Bell,
  Video,
  ShoppingBag,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Play,
  Pause,
  Phone,
} from "lucide-react";

/* ── STAGES DATA ── */
const STAGES = [
  {
    id: "visitor",
    step: "01",
    title: "Website Visitor Arrives",
    tagline: "High-intent customer lands on product page",
    icon: Globe,
    techBadge: "Intent Engine AI",
    badgeColor: "bg-blue-50 text-blue-600 border-blue-200/80",
    description:
      "A shopper from London views a high-value product. BridgeOne tracks real-time engagement and identifies high purchase intent.",
    metrics: [
      { label: "Location", val: "London, UK" },
      { label: "Time on Page", val: "42s" },
      { label: "Intent Score", val: "94%" },
    ],
  },
  {
    id: "widget",
    step: "02",
    title: "Ambient Widget Invites",
    tagline: "Non-intrusive floating live prompt",
    icon: MessageCircle,
    techBadge: "Smart Context Trigger",
    badgeColor: "bg-cyan-50 text-cyan-600 border-cyan-200/80",
    description:
      "A subtle, elegant glass widget appears offering a 1-on-1 live product demo or quick chat before the visitor bounces.",
    metrics: [
      { label: "Widget State", val: "Active" },
      { label: "Greeting", val: "Custom" },
      { label: "Response Rate", val: "3.2x" },
    ],
  },
  {
    id: "routing",
    step: "03",
    title: "Instant Agent Dispatch",
    tagline: "Rings designated available expert in <3s",
    icon: Bell,
    techBadge: "Sub-Second SIP Routing",
    badgeColor: "bg-amber-50 text-amber-600 border-amber-200/80",
    description:
      "The buyer taps 'Start Video'. BridgeOne instantly notifies the active agent console with complete visitor context.",
    metrics: [
      { label: "Latency", val: "<38ms" },
      { label: "Routed Agent", val: "Maya K." },
      { label: "Wait Time", val: "1.8s" },
    ],
  },
  {
    id: "video",
    step: "04",
    title: "HD Video & Product Share",
    tagline: "WebRTC peer connection established",
    icon: Video,
    techBadge: "WebRTC 4K Ultra-Low Latency",
    badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
    description:
      "Agent connects via face-to-face HD video, demonstrates the item live, and pushes product cards straight into the buyer view.",
    metrics: [
      { label: "Resolution", val: "1080p 60fps" },
      { label: "Encryption", val: "DTLS-SRTP" },
      { label: "Items Shared", val: "2 Products" },
    ],
  },
  {
    id: "trust",
    step: "05",
    title: "Human Trust Built",
    tagline: "Uncertainty eliminated in real time",
    icon: ShieldCheck,
    techBadge: "Human Connection",
    badgeColor: "bg-violet-50 text-violet-600 border-violet-200/80",
    description:
      "Seeing the real product up close and asking questions directly builds total confidence in the merchant.",
    metrics: [
      { label: "Customer CSAT", val: "4.9 / 5.0" },
      { label: "Doubt Cleared", val: "100%" },
      { label: "Trust Index", val: "Maximum" },
    ],
  },
  {
    id: "conversion",
    step: "06",
    title: "1-Click Sale Conversion",
    tagline: "Seamless in-session checkout success",
    icon: ShoppingBag,
    techBadge: "Shopify Cart Integration",
    badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
    description:
      "Visitor completes checkout directly during the call. Average order value increases by 45% per live video transaction.",
    metrics: [
      { label: "Order Total", val: "₹48,000" },
      { label: "Conversion", val: "Success" },
      { label: "ROI Multiple", val: "12x" },
    ],
  },
];

export default function JourneySection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance loop
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentStage = STAGES[activeStep];

  return (
    <section className="relative bg-[#FCFCFD] py-24 overflow-hidden text-slate-900 selection:bg-blue-100 border-t border-slate-200/60">
      {/* ── BACKGROUND LIGHTING & PASTEL GLOW ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          key={currentStage.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 1 }}
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[75vw] h-[45vw] rounded-full blur-[120px]"
          style={{
            background:
              activeStep === 0
                ? "radial-gradient(circle, #dbeafe, transparent)"
                : activeStep === 1
                ? "radial-gradient(circle, #cffafe, transparent)"
                : activeStep === 2
                ? "radial-gradient(circle, #fef3c7, transparent)"
                : activeStep === 3
                ? "radial-gradient(circle, #d1fae5, transparent)"
                : activeStep === 4
                ? "radial-gradient(circle, #ede9fe, transparent)"
                : "radial-gradient(circle, #d1fae5, transparent)",
          }}
        />

        {/* Soft dot grid */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, #cbd5e1 0.5px, transparent 0.5px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── SECTION HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-600">
              <Zap className="h-3.5 w-3.5" />
              VISUAL STORYTELLING JOURNEY
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.025em] leading-[1.15] text-slate-900">
              From Anonymous Visitor <br className="hidden sm:block" />
              to <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">High-Trust Customer</span>
            </h2>
            <p className="text-slate-500 text-base font-normal leading-[1.65] max-w-xl">
              Experience how BridgeOne seamlessly connects browsing intent with live human interaction in seconds.
            </p>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-sm">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title={isPlaying ? "Pause auto-tour" : "Play auto-tour"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>

            <button
              onClick={() => setActiveStep((prev) => (prev + 1) % STAGES.length)}
              className="flex h-10 px-4 items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20"
            >
              <span>Next Stage</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── STAGE NAVIGATION PIPELINE (LIGHT) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStep;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveStep(idx);
                  setIsPlaying(false);
                }}
                className={`relative text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isActive
                    ? "bg-white border-blue-300 shadow-[0_8px_25px_rgba(37,99,235,0.12)] scale-[1.02]"
                    : "bg-white/60 border-slate-200/70 hover:bg-white hover:border-slate-300 opacity-70 hover:opacity-100"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlowLight"
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"
                  />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{s.step}</span>
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                </div>
                <h4 className={`text-xs font-bold truncate ${isActive ? "text-slate-900" : "text-slate-600"}`}>{s.title}</h4>
              </button>
            );
          })}
        </div>

        {/* ── INTERACTIVE CANVAS ARCHITECTURE (LIGHT THEME) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* LEFT: Dynamic Stage Details Card */}
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_10px_35px_rgba(0,0,0,0.04)] relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentStage.badgeColor}`}>
                    {currentStage.techBadge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Stage {currentStage.step} of 06</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-slate-900">{currentStage.title}</h3>
                  <p className="text-sm font-semibold text-blue-600">{currentStage.tagline}</p>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed font-medium">{currentStage.description}</p>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  {currentStage.metrics.map((m) => (
                    <div key={m.label} className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-sm font-black text-slate-900 tabular-nums">{m.val}</p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Overlapping Floating UI Canvas (Light Living Scene) */}
          <div className="lg:col-span-7 relative min-h-[440px] flex items-center justify-center">

            {/* Stage 1: Visitor Card */}
            <motion.div
              animate={{
                scale: activeStep === 0 ? 1 : 0.94,
                opacity: activeStep === 0 ? 1 : 0.35,
                y: activeStep === 0 ? 0 : -20,
              }}
              transition={{ duration: 0.5 }}
              className="absolute top-2 left-4 z-20 w-[300px] rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-black text-white shadow-sm">
                  LD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Visitor from London</p>
                  <p className="text-[10px] text-slate-400">Viewing Leather Jacket — ₹24,000</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </motion.div>

            {/* Stage 2 & 3: Live Widget & Routing Toast */}
            <motion.div
              animate={{
                scale: activeStep === 1 || activeStep === 2 ? 1.02 : 0.94,
                opacity: activeStep === 1 || activeStep === 2 ? 1 : 0.35,
                y: activeStep === 1 || activeStep === 2 ? 0 : 20,
              }}
              transition={{ duration: 0.5 }}
              className="absolute top-20 right-4 z-30 w-[310px] rounded-2xl border border-blue-200/80 bg-white/95 backdrop-blur-2xl p-4 shadow-[0_15px_40px_rgba(37,99,235,0.12)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">BridgeOne Live Assistant</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Agent Online</span>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed font-medium">
                "Hi there! Would you like a 1-on-1 video call to see the material up close?"
              </p>
              <div className="flex gap-2">
                <button className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm">
                  <Video className="h-3.5 w-3.5" /> Start Video
                </button>
                <button className="px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  Chat
                </button>
              </div>
            </motion.div>

            {/* Stage 4 & 5: Live WebRTC Call Screen */}
            <motion.div
              animate={{
                scale: activeStep === 3 || activeStep === 4 ? 1.04 : 0.92,
                opacity: activeStep === 3 || activeStep === 4 ? 1 : 0.35,
              }}
              transition={{ duration: 0.5 }}
              className="relative z-40 w-[370px] rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-extrabold text-slate-900">Live WebRTC Session</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600">1080p 60fps</span>
              </div>

              {/* Video Mock Viewport */}
              <div className="relative h-40 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 overflow-hidden flex items-center justify-center shadow-inner">
                <div className="text-center space-y-1">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-violet-500 to-blue-500 mx-auto flex items-center justify-center text-xs font-black text-white shadow-md">
                    MK
                  </div>
                  <p className="text-xs font-bold text-white pt-1">Agent Maya</p>
                  <p className="text-[9px] text-blue-200">Demonstrating Silk Dress</p>
                </div>

                {/* Shared Product Floating Pill */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-2.5 inset-x-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 p-2 flex items-center gap-2.5 shadow-sm"
                >
                  <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">Leather Jacket — Premium</p>
                    <p className="text-[9px] text-emerald-600 font-bold">₹24,000 · In Stock</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Stage 6: Sale Success Overlay */}
            <motion.div
              animate={{
                scale: activeStep === 5 ? 1.05 : 0.9,
                opacity: activeStep === 5 ? 1 : 0.2,
                y: activeStep === 5 ? 0 : 25,
              }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-3 left-6 z-50 w-[290px] rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_15px_40px_rgba(16,185,129,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Sale Completed!</p>
                  <p className="text-[11px] text-emerald-600 font-bold">₹24,000 · Instant Checkout</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Trust Score: 100%</p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
