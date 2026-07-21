import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  MessageSquare,
  Phone,
  Calendar,
  Bot,
  ArrowRight,
  ShieldCheck,
  Globe,
  ChevronDown,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Lock,
  Cpu,
  Server,
  Layers,
  BarChart3,
  Star,
  Mic,
  Send,
  Play
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   1. FLOATING NAVIGATION BAR (Warm White & Soft Pearl)
   ═══════════════════════════════════════════════════════════════════════════ */
function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 px-4 sm:px-8 py-4 transition-transform duration-500 pointer-events-none ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <nav
        className={`max-w-[1400px] mx-auto px-6 py-3.5 rounded-full transition-all duration-500 pointer-events-auto flex items-center justify-between ${
          scrolled
            ? "bg-[#FDFDFC]/90 backdrop-blur-xl border border-[#E8E6E1] shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
            : "bg-[#FDFDFC]/60 backdrop-blur-md border border-[#E8E6E1]/60"
        }`}
      >
        {/* Brand Identity */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_14px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-300">
            B
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-fuchsia-500 transition-colors">
              BridgeOne
            </span>
            <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
              Communication OS
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#platform" className="hover:text-slate-900 transition-colors">Platform</a>
          <a href="#journey" className="hover:text-slate-900 transition-colors">Visitor Journey</a>
          <a href="#features" className="hover:text-slate-900 transition-colors">Capabilities</a>
          <a href="#live-demo" className="hover:text-slate-900 transition-colors">Live Demo</a>
          <a href="#shopify" className="hover:text-slate-900 transition-colors">Integrations</a>
          <a href="#security" className="hover:text-slate-900 transition-colors">Enterprise</a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-full transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-950 hover:bg-black rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. CINEMATIC HERO (Intelligent Light Theme)
   ═══════════════════════════════════════════════════════════════════════════ */
function CinematicHero() {
  const [activeTab, setActiveTab] = useState("video");

  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden bg-white">
      {/* Cinematic Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Blue Orb */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] left-[10%] w-[700px] h-[700px] rounded-full bg-blue-400/15 blur-[120px]" 
        />
        
        {/* Animated Cyan Orb */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-cyan-400/15 blur-[120px]" 
        />

        {/* Animated Purple/Indigo subtle accent */}
        <motion.div 
          animate={{ 
            scale: [0.9, 1.2, 0.9],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[40%] w-[500px] h-[500px] rounded-full bg-indigo-300/10 blur-[100px]" 
        />

        {/* Subtle Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
            backgroundSize: "36px 36px"
          }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="text-left space-y-6">
          {/* Category Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
          >
            <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Next-Gen Customer Communication Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]"
          >
            Transform Your Workflow <br/>
            <span className="bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Max Efficiency.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-xl"
          >
            Start your learning journey with us and unlock endless opportunities. Our platform provides you with the tools, resources, and support to launch live video calls seamlessly.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link
              to="/register"
              className="px-8 py-4 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-sm shadow-2xl shadow-slate-900/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#live-demo"
              className="px-8 py-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <span>Learn more</span>
            </a>
          </motion.div>

          {/* Micro Trust Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center gap-6 pt-6 text-xs font-semibold text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-fuchsia-500" />
              More Than 1000+ Companies <span className="text-fuchsia-600 font-bold">Trusted Us</span>
            </span>
          </motion.div>
        </div>

        {/* ── HERO FLOATING INTERFACE SHOWCASE ── */}
        <div className="relative w-full h-[500px] lg:h-[650px] flex items-center justify-center mt-12 lg:mt-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-fuchsia-400/20 to-pink-300/20 rounded-[40%] blur-3xl z-0"
          ></motion.div>

          {/* Video Feed (Top left floating) */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            whileHover={{ scale: 1.04, zIndex: 40, rotate: -1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 md:top-10 left-0 w-[90%] sm:w-[420px] z-10 cursor-pointer"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-fuchsia-500/5 space-y-6"
            >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-950 text-white font-extrabold flex items-center justify-center text-sm">
                  LUXE
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Luxe Apparel & Accessories</h4>
                  <p className="text-xs text-slate-400">Flagship E-Commerce Store</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                Item #9482
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="h-44 rounded-xl bg-slate-100 border border-slate-200/60 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Silk Cashmere Overcoat</span>
                <span className="text-xs font-mono font-bold text-fuchsia-500">$1,450.00</span>
              </div>
              <div className="space-y-3 flex flex-col justify-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-fuchsia-500 bg-fuchsia-50 px-2.5 py-1 rounded inline-block w-fit">
                  In Stock • Ready to Ship
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  Tailored Italian Wool Blend
                </h3>
                <p className="text-[10px] text-slate-500">
                  Handcrafted in Milan. Requires fitting advice or live sizing consultation?
                </p>
              </div>
            </div>
          </motion.div>

            </motion.div>
          {/* Visitor Widget (Bottom right overlapping) */}
          <motion.div 
            initial={{ opacity: 0, x: 30, y: 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            whileHover={{ scale: 1.04, zIndex: 40, rotate: 1 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 md:bottom-10 right-0 w-[95%] sm:w-[400px] z-20 cursor-pointer"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-900/10 space-y-4"
            >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-900">BridgeOne Visitor Widget</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">v2.4.0</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 text-[11px] font-bold">
              {[
                { id: "video", label: "Video", icon: Video },
                { id: "chat", label: "Chat", icon: MessageSquare },
                { id: "audio", label: "Audio", icon: Phone },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === m.id
                      ? "bg-white text-fuchsia-500 shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <div className="h-72 rounded-xl bg-slate-50 border border-slate-200/70 p-4 flex flex-col justify-between relative overflow-hidden">
              {activeTab === "video" && (
                <div className="space-y-3 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        className="w-8 h-8 rounded-full object-cover border border-fuchsia-500"
                        alt="Agent"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Elena Rostova</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">Live Sales Advisor</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-fuchsia-100 text-fuchsia-600 text-[10px] font-bold font-mono">
                      02:14
                    </span>
                  </div>

                  <div className="h-44 rounded-lg bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] text-white font-bold">
                      Live 1080p Stream
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-end gap-1">
                      {[6, 12, 8, 14, 10].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [h, h * 1.5, h] }}
                          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-emerald-400 rounded-full"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-1.5 rounded-lg bg-slate-950 text-white font-bold text-xs shadow-sm hover:bg-black">
                      Push Item to Cart
                    </button>
                    <button className="px-3 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">
                      Mute
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="h-full flex flex-col justify-between space-y-2">
                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-950 text-white p-2.5 rounded-2xl rounded-tr-none max-w-[80%] ml-auto font-medium">
                      Hi! Does the cashmere jacket fit true to size?
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-800 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] font-medium shadow-xs">
                      Hello! Yes, it features an Italian tailored fit. Would you like a live video demo of the lining?
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      readOnly
                      value="Yes please, show me live!"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                    <button className="p-2 rounded-lg bg-slate-950 text-white">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "audio" && (
                <div className="h-full flex flex-col justify-between items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-fuchsia-50 border border-fuchsia-200 flex items-center justify-center text-fuchsia-500">
                    <Phone className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Crystal Clear Audio Call</h5>
                    <p className="text-[10px] text-slate-400">Sub-50ms latency Opus codec active</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2.5 rounded-full bg-slate-200 text-slate-700">
                      <Mic className="w-4 h-4" />
                    </button>
                    <button className="px-4 py-2 rounded-full bg-rose-600 text-white font-bold text-xs">
                      End Call
                    </button>
                  </div>
                </div>
              )}
            </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustedCompanies() {
  const brands = [
    { name: "Luxe Group", metric: "+44% Conversion" },
    { name: "Aura Commerce", metric: "3.2s Avg Connect" },
    { name: "Vanguard Tech", metric: "SOC 2 Type II" },
    { name: "Monaco Jewels", metric: "$2.4M Sales Driven" },
    { name: "Nova Apparel", metric: "99.9% CSAT" },
    { name: "Apex Retail", metric: "Global WebRTC" },
  ];

  return (
    <section className="py-16 bg-slate-50/50 border-y border-[#E8E6E1] overflow-hidden">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="max-w-[1400px] mx-auto px-6 text-center space-y-8">
        <p className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
          Trusted by high-growth commerce brands & global customer experience teams
        </p>

        <div className="relative flex overflow-hidden w-full">
          <div className="flex w-max animate-marquee space-x-4 pb-4">
            {[...brands, ...brands, ...brands].map((b, i) => (
              <div
                key={i}
                className="w-[220px] shrink-0 p-4 rounded-2xl bg-white border border-[#E8E6E1]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-lg shadow-fuchsia-500/5 transition-all text-center space-y-1"
              >
                <p className="font-extrabold text-sm text-slate-900">{b.name}</p>
                <p className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-wider">{b.metric}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. VISITOR JOURNEY (Interactive 4-Step Architecture)
   ═══════════════════════════════════════════════════════════════════════════ */
function VisitorJourney() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "01",
      title: "Visitor Lands & Widget Activates",
      subtitle: "Asynchronous < 12KB widget script loads instantly without slowing down page render times.",
      details: "BridgeOne monitors real-time browsing behavior, scroll depth, and cart additions silently.",
      badge: "Step 1: Seamless Entry",
      icon: Globe,
    },
    {
      id: "02",
      title: "AI Intent Routing & Qualification",
      subtitle: "Autonomous AI co-pilot evaluates buyer urgency and calculates lifetime value potential.",
      details: "High-intent visitors are immediately presented with a 1-click video or chat prompt.",
      badge: "Step 2: Smart Detection",
      icon: Bot,
    },
    {
      id: "03",
      title: "Sub-100ms Live Video or Voice Connect",
      subtitle: "Instant peer-to-peer WebRTC connection established without software downloads.",
      details: "Agents answer from their desktop or mobile console in 1 click with full visitor history.",
      badge: "Step 3: Direct Engagement",
      icon: Video,
    },
    {
      id: "04",
      title: "In-Stream Product Push & Conversion",
      subtitle: "Agents push product cards, variants, and coupon codes directly into the buyer's screen.",
      details: "Customers add items to cart and check out while staying on the live video call.",
      badge: "Step 4: Immediate Sale",
      icon: ShoppingBag,
    },
  ];

  return (
    <section id="journey" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            End-To-End Customer Journey
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            How BridgeOne turns passive website visitors into loyal buyers.
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            Click through the 4 stages below to experience the real-time customer communication workflow.
          </p>
        </div>

        {/* 4 Interactive Step Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`p-4 md:p-5 rounded-2xl text-left transition-all duration-300 border cursor-pointer ${
                  isActive
                    ? "bg-white border-fuchsia-600 shadow-lg shadow-fuchsia-500/5 scale-[1.02] z-10 relative"
                    : "bg-white border-[#E8E6E1] hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono font-bold text-fuchsia-500 bg-fuchsia-50 px-2 py-0.5 rounded-full border border-fuchsia-200/60">
                    {step.id}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? "text-fuchsia-500" : "text-slate-400"}`} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-1.5 leading-snug">{step.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{step.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep Dive Frame */}
        <div className="py-8 px-4 md:py-12 md:px-8 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[10px] font-bold text-fuchsia-500 bg-fuchsia-50 px-3 py-1 rounded-full uppercase tracking-wider border border-fuchsia-200/60 inline-block">
              {steps[activeStep].badge}
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              {steps[activeStep].title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
              {steps[activeStep].subtitle}
            </p>
            <p className="text-xs font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              💡 <span className="font-bold">Key Operational Advantage:</span> {steps[activeStep].details}
            </p>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E8E6E1] p-8 shadow-inner flex flex-col justify-center items-center text-center min-h-[250px] space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/5 shadow-slate-900/10">
              {(() => {
                const ActiveIcon = steps[activeStep].icon;
                return <ActiveIcon className="w-6 h-6" />;
              })()}
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-900">{steps[activeStep].title}</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                Automated telemetry & sub-100ms WebRTC event loop firing seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. BRIDGEONE PLATFORM (Architectural Capabilities)
   ═══════════════════════════════════════════════════════════════════════════ */
function BridgeOnePlatform() {
  const pillars = [
    {
      title: "WebRTC Global Sub-100ms Mesh",
      description: "Low-latency peer-to-peer video and audio routing through 45+ global TURN edge nodes for instant connection.",
      icon: Server,
      tag: "Infrastructure",
    },
    {
      title: "Omni-Channel Agent Console",
      description: "Unified workspace where agents handle live video streams, text chats, voice calls, and AI tickets in one view.",
      icon: Layers,
      tag: "Agent OS",
    },
    {
      title: "Real-Time Cart & Intent Sync",
      description: "Live visibility into visitor page position, active cart total, search terms, and past order history.",
      icon: ShoppingBag,
      tag: "Commerce Sync",
    },
    {
      title: "Autonomous AI Intent Engine",
      description: "AI co-pilot transcribes calls live, generates post-call summaries, and auto-answers standard product questions.",
      icon: Cpu,
      tag: "Artificial Intelligence",
    },
  ];

  return (
    <section id="platform" className="py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Engineered For Scale
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built like an enterprise communication engine.
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            A high-performance communication stack engineered to connect buyers with sellers in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm hover:shadow-lg shadow-fuchsia-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-50 border border-blue-100 flex items-center justify-center text-fuchsia-500 mb-2">
                  <p.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-fuchsia-500">
                  {p.tag}
                </span>
                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-fuchsia-500">
                <span>Explore Technical Specs</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. FEATURES (Real UI Product Modules)
   ═══════════════════════════════════════════════════════════════════════════ */
function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Full Communication Suite
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Every mode of customer communication in one place.
          </h2>
        </div>

        {/* Feature Grid with Real Software UI Representation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Feature 1: Live Video Engine */}
          <div className="lg:col-span-7 p-6 md:p-6 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm space-y-5">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-widest bg-fuchsia-50 px-3 py-1 rounded-full inline-block mb-2">01 • Video Engine</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">HD WebRTC 1-on-1 Video Consultation</h3>
              <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
                Showcase physical products live, answer sizing queries face-to-face, and build trust in high-ticket transactions.
              </p>
            </div>
            {/* Real UI Mockup */}
            <div className="rounded-2xl bg-slate-900 p-3.5 text-white space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Live 1080p Stream
                </span>
                <span className="font-mono text-slate-400">ID: call_8492</span>
              </div>
              <div className="h-32 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <div className="text-center space-y-2">
                  <Video className="w-6 h-6 text-blue-400 mx-auto" />
                  <p className="text-xs font-bold">1-on-1 Consultation In Progress</p>
                  <p className="text-[10px] text-slate-400">Camera & Microphone Encrypted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: In-Call Product Push */}
          <div className="lg:col-span-5 p-6 md:p-6 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest bg-cyan-50 px-3 py-1 rounded-full inline-block mb-2">02 • In-Call Commerce</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">Push Products Direct to Screen</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Agents can pin items into the active call window. The customer clicks once to add to cart without hanging up.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 shadow-inner mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Featured Item Pushed</p>
                  <p className="text-[10px] text-slate-500">Milan Wool Overcoat — $1,450</p>
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs shadow-sm hover:bg-black transition-colors">
                Add to Cart & Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. LIVE PRODUCT DEMO (Interactive Sandbox)
   ═══════════════════════════════════════════════════════════════════════════ */
function LiveProductDemo() {
  const [activeTab, setActiveTab] = useState("video");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "agent", text: "Hello! Welcome to our store. How can I assist you today?" },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: "Thanks! Connecting you with an expert live advisor..." },
      ]);
    }, 800);
  };

  return (
    <section id="live-demo" className="py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Interactive Widget Sandbox
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Test the BridgeOne Widget live right now.
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            Switch between communication channels below to preview how your website visitors will interact with your store.
          </p>
        </div>

        {/* Interactive Widget Box */}
        <div className="max-w-4xl mx-auto rounded-3xl p-6 md:p-8 bg-white border border-[#E8E6E1] shadow-2xl shadow-fuchsia-500/5 space-y-5">
            {/* Nav Tabs */}
            <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-white border border-[#E8E6E1] text-[11px] font-bold">
              {[
                { id: "video", label: "Live Video", icon: Video },
                { id: "chat", label: "Live Chat", icon: MessageSquare },
                { id: "audio", label: "Audio Call", icon: Phone },
                { id: "callback", label: "Callback", icon: Calendar },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-slate-950 text-white shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Sandbox Container */}
            <div className="h-64 rounded-xl bg-white border border-[#E8E6E1] p-6 flex flex-col justify-between shadow-sm">
              {activeTab === "video" && (
                <div className="h-full flex flex-col justify-between text-center space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Advisor Ready
                    </span>
                    <span className="text-xs font-mono text-slate-400">Sub-50ms WebRTC</span>
                  </div>
                  <div className="my-auto space-y-2">
                    <Video className="w-12 h-12 text-fuchsia-500 mx-auto animate-bounce" />
                    <h4 className="font-extrabold text-lg text-slate-900">Start 1-on-1 Video Consultation</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Connect face-to-face with an advisor. Camera and mic options are configurable.
                    </p>
                  </div>
                  <button className="py-3 rounded-xl bg-slate-950 text-white font-bold text-xs shadow-lg shadow-fuchsia-500/5 hover:bg-black">
                    Launch Test Call
                  </button>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-3 overflow-y-auto max-h-56 pr-2">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${
                          m.sender === "user"
                            ? "bg-slate-950 text-white ml-auto rounded-tr-none"
                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-fuchsia-600"
                    />
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs">
                      Send
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "audio" && (
                <div className="h-full flex flex-col justify-between text-center items-center py-6">
                  <Phone className="w-10 h-10 text-fuchsia-500 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-base text-slate-900">High-Definition Voice Call</h4>
                    <p className="text-xs text-slate-400 mt-1">Instant browser audio without app downloads</p>
                  </div>
                  <button className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-fuchsia-500/5">
                    Start Voice Call
                  </button>
                </div>
              )}

              {activeTab === "callback" && (
                <div className="h-full flex flex-col justify-between text-center py-4 space-y-3">
                  <Calendar className="w-10 h-10 text-cyan-600 mx-auto" />
                  <div>
                    <h4 className="font-bold text-base text-slate-900">Schedule Callback Appointment</h4>
                    <p className="text-xs text-slate-500">We'll call you back at your preferred time.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto w-full">
                    <input
                      type="text"
                      placeholder="Phone Number"
                      className="px-3 py-2 border rounded-lg text-xs"
                      readOnly
                      value="+1 (555) 019-2834"
                    />
                    <button className="py-2 bg-slate-900 text-white font-bold text-xs rounded-lg">
                      Request Call
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="h-full flex flex-col justify-between text-center py-4 space-y-3">
                  <Bot className="w-10 h-10 text-fuchsia-500 mx-auto" />
                  <div>
                    <h4 className="font-bold text-base text-slate-900">AI Instant Support Assistant</h4>
                    <p className="text-xs text-slate-500">Autonomous intent resolution and lead routing.</p>
                  </div>
                  <div className="p-3 bg-fuchsia-50 border border-fuchsia-200 rounded-xl text-xs text-blue-800 max-w-md mx-auto">
                    "AI automatically answers 80% of common shipping & inventory questions."
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. DASHBOARD SHOWCASE (Agent Console UI)
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardShowcase() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Agent Operations OS
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for high-efficiency support & sales teams.
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Give your team a unified dashboard with caller telemetry, active cart sync, and 1-click call response.
          </p>
        </div>

        {/* Dashboard Mock Container */}
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#E8E6E1] shadow-2xl shadow-fuchsia-500/5 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold">
                B
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] text-slate-900 leading-tight">BridgeOne Seller Workspace</h4>
                <p className="text-[11px] text-slate-400">Agent: Sarah Jenkins (Online)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                Status: Available
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Incoming Call Alert</h5>
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-blue-100 space-y-3 shadow-sm">
                <div>
                  <p className="font-bold text-sm text-slate-900">Sarah C. (London, UK)</p>
                  <p className="text-xs text-slate-500">Cart Total: $1,450.00</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="flex-1 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs shadow-lg shadow-fuchsia-500/5 shadow-slate-900/10">
                    Accept Call
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-2">
              <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Live Call Performance Telemetry</h5>
              <div className="grid grid-cols-3 gap-4 text-center h-[126px]">
                <div className="p-4 flex flex-col justify-center rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-sm">
                  <p className="text-2xl font-extrabold text-slate-900">98.4%</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">Answer Rate</p>
                </div>
                <div className="p-4 flex flex-col justify-center rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-sm">
                  <p className="text-2xl font-extrabold text-fuchsia-500">3.2s</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">Avg Response</p>
                </div>
                <div className="p-4 flex flex-col justify-center rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-sm">
                  <p className="text-2xl font-extrabold text-emerald-600">+38.4%</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">Conversion Lift</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. SHOPIFY & E-COMMERCE INTEGRATION
   ═══════════════════════════════════════════════════════════════════════════ */
function ShopifyIntegration() {
  return (
    <section id="shopify" className="py-16 md:py-20 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              1-Click Shopify Integration
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Installs on Shopify in 60 seconds. <br className="hidden md:block"/>Zero coding required.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
              BridgeOne syncs automatically with your Shopify catalog, orders, and customer data using official Shopify GraphQL APIs.
            </p>
            <div className="space-y-2 pt-2">
              {[
                "Instant catalog sync & product pin overlay",
                "Direct checkout cart injection during live video calls",
                "Automated customer identity & order history matching",
                "Compatible with Shopify Dawn & custom liquid themes",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E8E6E1] p-8 text-center space-y-5 shadow-inner">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xl mx-auto shadow-lg shadow-fuchsia-500/5 shadow-emerald-600/20">
              S
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Available on Shopify App Store</h3>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                Rated 4.9/5 stars by top Shopify Plus merchants worldwide.
              </p>
            </div>
            <button className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-lg shadow-fuchsia-500/5 hover:bg-slate-800 transition-colors w-full sm:w-auto">
              Install Shopify App Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. ANALYTICS & METRICS
   ═══════════════════════════════════════════════════════════════════════════ */
function Analytics() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Real-Time Analytics
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Measure conversion lift & call performance.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm space-y-4">
            <BarChart3 className="w-8 h-8 text-fuchsia-500" />
            <h3 className="text-3xl font-extrabold text-slate-900">+38.4%</h3>
            <p className="text-xs font-bold text-slate-700">Conversion Rate Increase</p>
            <p className="text-xs text-slate-500">Average sales conversion lift on visitors who initiate live video consultations.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm space-y-4">
            <Clock className="w-8 h-8 text-cyan-600" />
            <h3 className="text-3xl font-extrabold text-slate-900">3.2 Seconds</h3>
            <p className="text-xs font-bold text-slate-700">Average Response Time</p>
            <p className="text-xs text-slate-500">Fast connection velocity ensures no high-intent customer is left waiting.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm space-y-4">
            <Star className="w-8 h-8 text-amber-500 fill-current" />
            <h3 className="text-3xl font-extrabold text-slate-900">4.9 / 5.0</h3>
            <p className="text-xs font-bold text-slate-700">Average CSAT Score</p>
            <p className="text-xs text-slate-500">Customer satisfaction rating from over 500,000 completed live video calls.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. ENTERPRISE SECURITY & INFRASTRUCTURE
   ═══════════════════════════════════════════════════════════════════════════ */
function Security() {
  return (
    <section id="security" className="py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Enterprise Grade Infrastructure
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Security, compliance, and 99.99% uptime.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8E6E1] space-y-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            <h4 className="font-extrabold text-lg text-slate-900">SOC 2 Type II Certified</h4>
            <p className="text-xs text-slate-500">Audited security controls ensuring user privacy and data protection compliance.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8E6E1] space-y-3">
            <Lock className="w-8 h-8 text-fuchsia-500" />
            <h4 className="font-extrabold text-lg text-slate-900">End-to-End Encryption</h4>
            <p className="text-xs text-slate-500">DTLS-SRTP encryption standards for all live WebRTC video and audio channels.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8E6E1] space-y-3">
            <Server className="w-8 h-8 text-cyan-600" />
            <h4 className="font-extrabold text-lg text-slate-900">99.99% SLA Uptime</h4>
            <p className="text-xs text-slate-500">Multi-region redundant TURN infrastructure guaranteeing high availability.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   12. AI ASSISTANT SHOWCASE
   ═══════════════════════════════════════════════════════════════════════════ */
function AIAssistant() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="py-8 px-4 md:py-12 md:px-8 rounded-3xl bg-white border border-[#E8E6E1] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Autonomous AI Co-Pilot
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              24/7 AI Assistance for off-hours inquiries.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
              When human agents are offline, BridgeOne AI steps in to resolve queries, collect visitor details, and schedule warm callback appointments.
            </p>
          </div>

          <div className="lg:col-span-5 p-8 rounded-2xl bg-white border border-[#E8E6E1] space-y-5 shadow-inner text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-950 text-white font-extrabold flex items-center justify-center mx-auto shadow-lg shadow-fuchsia-500/5 shadow-slate-900/10">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900">BridgeOne Conversational AI</h4>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Active & Resolving Queries</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-800">"AI resolved 84% of after-hours questions without agent escalation."</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   13. TESTIMONIALS
   ═══════════════════════════════════════════════════════════════════════════ */
function Testimonials() {
  const reviews = [
    {
      quote: "BridgeOne completely transformed how we assist high-intent visitors. Customers love being able to talk face-to-face.",
      author: "Michael T.",
      role: "Head of Sales, TechStore",
    },
    {
      quote: "The agent console is incredibly intuitive. Pushing items directly into the customer's cart during a call is a game changer.",
      author: "Sarah J.",
      role: "Founder, StyleBoutique",
    },
    {
      quote: "We host hundreds of calls daily. The WebRTC video quality is crystal clear even on mobile networks.",
      author: "David L.",
      role: "CX Director, HomeGoods",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Customer Success
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by commerce leaders worldwide.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-[#E8E6E1] space-y-4 shadow-sm">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">"{r.quote}"</p>
              <div className="pt-4 border-t border-slate-100">
                <p className="font-extrabold text-sm text-slate-900">{r.author}</p>
                <p className="text-xs text-slate-400">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   14. PRICING (Luxury Tier Cards)
   ═══════════════════════════════════════════════════════════════════════════ */
function Pricing() {
  const [billingCycle, setBillingCycle] = useState("annual");

  const plans = [
    {
      name: "Starter",
      desc: "For growing stores looking to introduce live communication.",
      monthlyPrice: 15,
      annualPrice: 144,
      features: [
        "Up to 2 Agent Seats",
        "Live Chat & Audio Calls",
        "Standard WebRTC Engine",
        "Shopify 1-Click Integration",
      ],
      cta: "Start 14-Day Trial",
      popular: false,
    },
    {
      name: "Pro",
      desc: "For high-volume commerce brands scaling live video sales.",
      monthlyPrice: 25,
      annualPrice: 240,
      features: [
        "Up to 10 Agent Seats",
        "HD Live 1-on-1 Video Calls",
        "In-Stream Product Push & Cart Sync",
        "AI Intent Co-Pilot & Routing",
        "Real-Time Telemetry Analytics",
      ],
      cta: "Start 14-Day Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      desc: "Custom infrastructure & dedicated support for enterprise teams.",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      features: [
        "Unlimited Agent Seats",
        "Dedicated TURN Server Infrastructure",
        "Custom API & Webhook Access",
        "SOC 2 & HIPAA Compliance Guarantee",
        "24/7 Dedicated Account Manager",
      ],
      cta: "Contact Enterprise Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Transparent Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple plans for modern commerce teams.
          </h2>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-slate-100 border border-slate-200 mt-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "annual" ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-[9px] font-black uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between space-y-6 relative ${
                p.popular
                  ? "border-fuchsia-600 shadow-lg shadow-fuchsia-500/5 scale-[1.02]"
                  : "border-[#E8E6E1] shadow-sm hover:shadow-lg shadow-fuchsia-500/5"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-fuchsia-500/5">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.desc}</p>
                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {typeof p.monthlyPrice === "number"
                      ? `$${billingCycle === "annual" ? p.annualPrice : p.monthlyPrice}`
                      : p.monthlyPrice}
                  </span>
                  {typeof p.monthlyPrice === "number" && (
                    <span className="text-xs text-slate-400 font-bold">
                      {billingCycle === "annual" ? " / year" : " / month"}
                    </span>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  {p.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/register"
                className={`w-full py-3.5 rounded-full text-xs font-bold text-center transition-all ${
                  p.popular
                    ? "bg-slate-950 text-white hover:bg-black shadow-lg shadow-fuchsia-500/5 shadow-slate-900/10"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   15. FAQ (Accessible Accordion)
   ═══════════════════════════════════════════════════════════════════════════ */
function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How long does it take to install BridgeOne on my website?",
      a: "Installation takes less than 2 minutes. On Shopify, simply install our official app from the Shopify App Store. For custom websites, insert a single lightweight JavaScript snippet before the closing </body> tag.",
    },
    {
      q: "Do visitors need to download any software to start a video call?",
      a: "No! BridgeOne uses native WebRTC built directly into all modern web browsers (Safari, Chrome, Firefox, Edge, iOS, Android). Calls launch instantly in the browser.",
    },
    {
      q: "How does the in-call product push feature work?",
      a: "While on an active video or chat consultation, agents can browse the store catalog from their console and click 'Push Item'. The product card pops up on the customer's screen with a direct Add to Cart button.",
    },
    {
      q: "Can we use BridgeOne with custom domains and branding?",
      a: "Yes. Growth and Enterprise plans allow complete custom styling, brand logos, primary color customization, and custom domain routing.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-[1000px] mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything you need to know about BridgeOne.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-white border border-[#E8E6E1] overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-6 text-left font-bold text-sm md:text-base text-slate-900 flex justify-between items-center gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-fuchsia-500" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   16. FOOTER (Luxury Light Design)
   ═══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-white border-t border-[#E8E6E1] pt-20 pb-12 text-slate-600">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-950 text-white font-bold flex items-center justify-center text-sm">
                B
              </div>
              <span className="font-extrabold text-lg text-slate-900">BridgeOne</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              The premier customer communication OS for modern e-commerce and high-growth digital brands.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full w-fit">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              All WebRTC Edge Systems Operational
            </div>
          </div>

          <div>
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-4">Product</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#platform" className="hover:text-slate-900 transition-colors">Platform Engine</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Live Video Consultation</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">In-Call Cart Push</a></li>
              <li><a href="#live-demo" className="hover:text-slate-900 transition-colors">Interactive Widget Sandbox</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-4">Integrations</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#shopify" className="hover:text-slate-900 transition-colors">Shopify App Store</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Custom Web SDK</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">GraphQL Gateway API</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Klaviyo & CRM Sync</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-4">Company & Legal</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#security" className="hover:text-slate-900 transition-colors">Security & SOC 2</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Contact Enterprise Sales</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E8E6E1] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© 2026 BridgeOne Technologies Inc. All rights reserved.</p>
          <p className="font-mono text-[11px]">Sub-100ms Global WebRTC Network</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN REDESIGNED LANDING PAGE AGGREGATOR
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans bg-white text-slate-900 selection:bg-fuchsia-100 selection:text-blue-900 overflow-x-hidden antialiased">
      <FloatingNav />
      <CinematicHero />
      <TrustedCompanies />
      <VisitorJourney />
      <BridgeOnePlatform />
      <Features />
      <LiveProductDemo />
      <DashboardShowcase />
      <ShopifyIntegration />
      <Analytics />
      <Security />
      <AIAssistant />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
