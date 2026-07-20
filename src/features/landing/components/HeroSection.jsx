import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  Video,
  MessageSquare,
  Phone,
  ArrowUpRight,
  ShoppingBag,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Globe,
  CheckCircle2,
  Eye,
  Bot,
} from "lucide-react";

/* ─── Status Dot ─── */
function StatusDot({ color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-500 shadow-emerald-500/40",
    blue: "bg-blue-600 shadow-blue-600/40",
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colors[color]}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full shadow-sm ${colors[color]}`} />
    </span>
  );
}

/* ─── Ambient Subtle Particle Field ─── */
function ParticleField() {
  const particles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 18 + 14,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.1 + 0.03,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-500"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [p.opacity, p.opacity * 1.8, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Live Counter Badge ─── */
function LiveCounter() {
  const [count, setCount] = useState(3142);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 2) + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
    >
      <StatusDot color="emerald" />
      <span className="text-xs font-semibold text-slate-500">
        <span className="text-slate-900 font-extrabold tabular-nums">{count.toLocaleString()}</span> active visitor sessions live
      </span>
      <span className="h-1 w-1 rounded-full bg-slate-200" />
      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Enterprise OS</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INTELLIGENT LIGHT HERO SECTION (APPLE + STRIPE + LINEAR POLISH)
   ═══════════════════════════════════════════════════════════ */
export default function HeroSection() {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 25 });

  // Subtle 3D Tilt Physics
  const rotateX = useTransform(smoothY, [0, 1], [4, -4]);
  const rotateY = useTransform(smoothX, [0, 1], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    const el = containerRef.current;
    el?.addEventListener("mousemove", handleMouseMove);
    return () => el?.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Cycling Live Activity Stream
  const [activeNotif, setActiveNotif] = useState(0);
  const notifs = [
    { text: "Sarah from London connected via 1-on-1 Video", icon: Video, tag: "LIVE VIDEO", color: "text-blue-600 bg-blue-50 border-blue-200/60" },
    { text: "Product Shared: Silk Emerald Dress — ₹24,000", icon: ShoppingBag, tag: "IN-CALL PUSH", color: "text-cyan-700 bg-cyan-50 border-cyan-200/60" },
    { text: "AI Assistant auto-scheduled callback request", icon: Bot, tag: "AI ROUTING", color: "text-emerald-700 bg-emerald-50 border-emerald-200/60" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setActiveNotif((n) => (n + 1) % notifs.length), 3800);
    return () => clearInterval(interval);
  }, [notifs.length]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen lg:h-screen flex flex-col justify-center overflow-hidden bg-[#FCFCFD] selection:bg-blue-100 selection:text-blue-900"
    >
      {/* ── SUBTLE ENTERPRISE LIGHTING ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-blue-50 via-indigo-50/40 to-transparent blur-[120px]" />
        <div className="absolute top-[10%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-cyan-50 via-sky-50/30 to-transparent blur-[120px]" />
      </div>

      {/* Precise Micro Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      <ParticleField />

      {/* ── MAIN CONTENT GRID ── */}
      <div className="relative z-10 w-full mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16 pt-24 lg:pt-16 pb-8 lg:pb-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-10">

          {/* ── LEFT COLUMN: REFINED TYPOGRAPHY ── */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-7">
            <LiveCounter />

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-slate-900">
                Transform website visitors into{" "}
                <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  real conversations.
                </span>
              </h1>

              <p className="max-w-[480px] text-base sm:text-lg font-normal leading-[1.65] text-slate-500">
                BridgeOne connects businesses with website visitors instantly through Live Video Calls, Live Chat, Audio, Callbacks, and AI Conversations.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:bg-blue-700 hover:shadow-[0_6px_25px_rgba(37,99,235,0.35)] hover:scale-[1.02]"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <span>Book Platform Demo</span>
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>

            {/* Trust Micro Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-400"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                SOC 2 Type II Certified
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-blue-600" />
                Global WebRTC Edge
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-cyan-600" />
                3.4x Response Velocity
              </span>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: PURE LIGHT FLOATING UI PANEL ── */}
          <div className="lg:col-span-7 xl:col-span-7 relative perspective-[1400px]">
            <motion.div
              style={{ rotateX, rotateY }}
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-[620px] ml-auto mt-4 lg:mt-8 p-1 rounded-3xl bg-white border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
            >
              <div className="p-4 sm:p-5 space-y-3.5 rounded-[22px] bg-[#F8FAFC]">

                {/* ── TOP LAYER: AGENT COMMUNICATION CONSOLE ── */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">BridgeOne Communication Console</h3>
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">Live Channel</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Real-time visitor queue & live call dispatcher</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusDot color="emerald" />
                      <span className="text-[11px] font-bold text-slate-600">Active</span>
                    </div>
                  </div>

                  {/* Clean Column Metric Bar Chart */}
                  <div className="flex items-end gap-1.5 h-14 mb-3 px-0.5">
                    {[45, 70, 52, 88, 60, 95, 78, 90, 65, 100, 82, 58, 92, 70, 85, 96, 72, 88, 64, 94].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-sm bg-blue-600/80"
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: 0.5 + i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ))}
                  </div>

                  {/* Clean Metric Cards */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/60 p-2.5 text-center">
                      <p className="text-lg font-extrabold text-slate-900 tabular-nums">47</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Active Visitors</p>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/60 p-2.5 text-center">
                      <p className="text-lg font-extrabold text-blue-600 tabular-nums">12</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">In Video Call</p>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/60 p-2.5 text-center">
                      <p className="text-lg font-extrabold text-cyan-600 tabular-nums">3.8s</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Avg Response</p>
                    </div>
                  </div>
                </div>

                {/* ── BOTTOM ROW: DYNAMIC TILES (LIGHT VIDEO CALL + REAL-TIME STREAM) ── */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                  {/* Live Video Call Component */}
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="md:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest">Live Video Call</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">04:32</span>
                    </div>

                    {/* Light Pearl Call Container */}
                    <div className="relative h-24 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center shadow-inner">
                      <div className="text-center">
                        <div className="h-10 w-10 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-xs font-black text-white shadow-md">
                          MK
                        </div>
                        <p className="text-[11px] font-bold text-white mt-1">Agent Maya</p>
                        <p className="text-[8px] text-slate-300">Live Video & Product Share</p>
                      </div>

                      {/* Customer PIP */}
                      <div className="absolute bottom-1.5 right-1.5 h-8 w-11 rounded-md bg-slate-800 border border-white/20 overflow-hidden flex items-center justify-center shadow-sm">
                        <span className="text-[8px] font-bold text-slate-200">Sarah C.</span>
                      </div>

                      {/* Live Equalizer Bar */}
                      <div className="absolute bottom-1.5 left-2 flex items-end gap-[2px]">
                        {[4, 8, 5, 10, 6, 9, 4, 7].map((h, i) => (
                          <motion.div
                            key={i}
                            className="w-[1.5px] rounded-full bg-emerald-400"
                            animate={{ height: [h, h * 1.6, h] }}
                            transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-blue-600" />
                        HD WebRTC Audio
                      </span>
                      <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded border border-blue-200/60">
                        Item Pushed
                      </span>
                    </div>
                  </motion.div>

                  {/* Realtime Stream Component */}
                  <motion.div
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="md:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Real-time Stream</span>
                      <span className="text-[9px] font-bold text-blue-600">Auto Sync</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F8FAFC] border border-slate-200/60">
                        <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Eye className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">Visitor from London</p>
                          <p className="text-[9px] text-slate-500 truncate">High Purchase Intent</p>
                        </div>
                        <span className="text-[8px] font-semibold text-slate-400">Just now</span>
                      </div>

                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F8FAFC] border border-slate-200/60">
                        <div className="h-6 w-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <ShoppingBag className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">Product Shared</p>
                          <p className="text-[9px] text-slate-500 truncate">₹24,000 in Session</p>
                        </div>
                        <span className="text-[8px] font-semibold text-slate-400">12s ago</span>
                      </div>
                    </div>

                    {/* Cycling Notification Pill */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeNotif}
                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.4 }}
                        className={`mt-2 p-1.5 rounded-lg border flex items-center gap-2 ${notifs[activeNotif].color}`}
                      >
                        {(() => {
                          const Icon = notifs[activeNotif].icon;
                          return <Icon className="h-3.5 w-3.5 shrink-0" />;
                        })()}
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-extrabold tracking-wider uppercase opacity-75">{notifs[activeNotif].tag}</p>
                          <p className="text-[10px] font-bold truncate">{notifs[activeNotif].text}</p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Subtle Bottom Fade */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#FCFCFD] to-transparent pointer-events-none z-10" />
    </section>
  );
}
