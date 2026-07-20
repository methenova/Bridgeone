import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Globe,
  MessageCircle,
  Zap,
  UserCheck,
  Video,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Phone,
  ArrowRight,
} from "lucide-react";

/* ── 8-STEP JOURNEY DATA ── */
const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Website Visitor",
    subtitle: "High-intent shopper arrives",
    icon: Globe,
    badge: "Intent Engine",
    color: "blue",
    detail: "A buyer explores high-value products on your store. BridgeOne detects engagement signals in real time.",
    preview: (
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/60">
        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
          UK
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-800 truncate">Visitor from London</p>
          <p className="text-[9px] text-slate-400">Viewing Product Page</p>
        </div>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
      </div>
    ),
  },
  {
    step: "02",
    title: "Widget Opens",
    subtitle: "Contextual assistant prompt",
    icon: MessageCircle,
    badge: "Smart Trigger",
    color: "cyan",
    detail: "An elegant, non-intrusive floating widget greets the buyer offering live help before bounce.",
    preview: (
      <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-[10px] font-semibold text-slate-700 leading-tight">
          "Hi! Would you like a 1-on-1 live product demo?"
        </p>
      </div>
    ),
  },
  {
    step: "03",
    title: "Conversation Starts",
    subtitle: "Buyer taps to connect",
    icon: Zap,
    badge: "Instant Signal",
    color: "blue",
    detail: "Visitor requests a live session or sends an instant inquiry with complete context attached.",
    preview: (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/60">
        <span className="text-[10px] font-bold text-slate-700">Request: Video Call</span>
        <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
          Initiated
        </span>
      </div>
    ),
  },
  {
    step: "04",
    title: "Agent Responds",
    subtitle: "Sub-3s SIP routing",
    icon: UserCheck,
    badge: "Sub-3s Dispatch",
    color: "amber",
    detail: "BridgeOne routes the session to the available expert with full visitor browsing history.",
    preview: (
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/60">
        <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          MK
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-800">Agent Maya</p>
          <p className="text-[9px] text-slate-400">Accepted in 1.8s</p>
        </div>
      </div>
    ),
  },
  {
    step: "05",
    title: "Video Call",
    subtitle: "WebRTC 1080p stream",
    icon: Video,
    badge: "HD WebRTC",
    color: "emerald",
    detail: "Face-to-face video connects seamlessly in-browser. Agent demonstrates items and shares product cards.",
    preview: (
      <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[10px] font-bold">1080p Video</span>
        </div>
        <span className="text-[9px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">Product Pushed</span>
      </div>
    ),
  },
  {
    step: "06",
    title: "Questions Answered",
    subtitle: "Real-time doubt elimination",
    icon: HelpCircle,
    badge: "Zero Friction",
    color: "cyan",
    detail: "Customer gets instant answers on sizing, material quality, and delivery timelines.",
    preview: (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-[10px] font-semibold text-slate-700">All buyer questions resolved live</p>
      </div>
    ),
  },
  {
    step: "07",
    title: "Trust Built",
    subtitle: "100% merchant confidence",
    icon: ShieldCheck,
    badge: "Human Touch",
    color: "violet",
    detail: "Personalized interaction builds authentic trust, eliminating purchase hesitation.",
    preview: (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/60">
        <span className="text-[10px] font-bold text-slate-700">Merchant CSAT</span>
        <span className="text-[11px] font-black text-violet-600">4.9 / 5.0 ★</span>
      </div>
    ),
  },
  {
    step: "08",
    title: "Customer Converts",
    subtitle: "In-session cart checkout",
    icon: ShoppingBag,
    badge: "Success",
    color: "emerald",
    detail: "Customer completes purchase directly within the session. AOV increases by +45%.",
    preview: (
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
        <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-900">Sale Completed!</p>
          <p className="text-[9px] font-bold text-emerald-600">₹48,000 Order</p>
        </div>
      </div>
    ),
  },
];

export default function ConnectedJourneySection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.85], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      className="relative bg-[#FCFCFD] py-28 overflow-hidden text-slate-900 border-t border-slate-200/60 selection:bg-blue-100"
    >
      {/* Background Soft Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-blue-50/50 blur-[130px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-cyan-50/40 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── SECTION HEADER ── */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
            HOW BRIDGEONE WORKS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.15] text-slate-900">
            The Complete Customer Journey: <br className="hidden sm:block" />
            From <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">Visitor to Conversion</span>
          </h2>
          <p className="text-slate-500 text-base font-normal leading-[1.65]">
            See how BridgeOne transforms anonymous website traffic into real, high-trust human conversations that drive revenue.
          </p>
        </div>

        {/* ── CONNECTED CARDS MATRIX (8 STEPS WITH FLOWING BEAM) ── */}
        <div className="relative">

          {/* Central Flowing Connection Line (Desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-10 bottom-10 w-0.5 -translate-x-1/2 bg-slate-200/80 z-0">
            <motion.div
              className="w-full bg-gradient-to-b from-blue-600 via-indigo-600 to-emerald-500 origin-top"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-16 relative z-10">
            {JOURNEY_STEPS.map((item, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col ${
                    isEven ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"
                  }`}
                >
                  {/* Card Container */}
                  <div className="w-full max-w-[540px] rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group space-y-4">

                    {/* Top Row: Badge & Step Indicator */}
                    <div className={`flex items-center justify-between gap-3 ${isEven ? "lg:flex-row-reverse" : ""}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400">Step {item.step}</span>
                      </div>

                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                        {item.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{item.title}</h3>
                      <p className="text-xs font-semibold text-blue-600">{item.subtitle}</p>
                    </div>

                    <p className="text-xs sm:text-sm font-normal text-slate-500 leading-[1.65]">
                      {item.detail}
                    </p>

                    {/* Interactive UI Preview Component */}
                    <div className="pt-2 border-t border-slate-100">
                      {item.preview}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
