import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  MessageSquare,
  Monitor,
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Star,
  Zap,
  BarChart3,
  ShoppingBag,
  Shield,
  Phone,
  LayoutDashboard,
  Activity,
  Mail,
  User,
  Calendar,
  Clock
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("video");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between bg-white/80 px-6 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-500/20">
              B
            </div>
            <span className="text-xl font-extrabold tracking-tight">BridgeOne</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
            <a href="#integrations" className="hover:text-blue-600 transition-colors">Integrations</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:scale-105"
          >
            Start for Free
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] pt-32 pb-24 lg:pt-40 lg:pb-36 px-6 overflow-hidden bg-slate-50/50">
        
        {/* SVG Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]"></div>

        {/* Immersive Aurora Gradients (Framer Motion Shifting) */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div 
            animate={{
              x: [-100, 100, -100],
              y: [-50, 150, -50],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-rose-200/40 to-violet-300/10 blur-[120px]"
          />
          <motion.div 
            animate={{
              x: [100, -150, 100],
              y: [100, -100, 100],
              scale: [1.2, 0.9, 1.2],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-200/40 via-indigo-300/10 to-transparent blur-[140px]"
          />
          <motion.div 
            animate={{
              x: [-50, 50, -50],
              y: [150, -50, 150],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-200/30 to-amber-200/10 blur-[100px]"
          />
        </div>

        {/* Subtle Floating Particles */}
        <div className="absolute inset-0 -z-5 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: Math.random() * 0.4 + 0.1,
                scale: Math.random() * 0.6 + 0.4
              }}
              animate={{
                y: [null, Math.random() * -150 - 50],
                opacity: [null, 0]
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute h-2 w-2 rounded-full bg-indigo-400/30 blur-[1px]"
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-20">
          
          {/* Left Hero Copy - Asymmetric, Spacious */}
          <div className="lg:col-span-5 text-left space-y-10">
            
            {/* Realtime Status Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white/80 shadow-sm backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-800 tracking-wider uppercase">Live Connection Suite</span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 font-sans">
                The human link <br />
                between browsing <br />
                and buying.
              </h1>
              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed max-w-md pt-2">
                BridgeOne converts anonymous store traffic into live, high-fidelity video conversations. Connect instantly, showcase products, and build trust in real time.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                to="/register"
                className="group relative overflow-hidden rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] hover:shadow-slate-900/20"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-500 ease-out -z-0"></div>
              </Link>
              
              <a
                href="#demo"
                className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 backdrop-blur-md px-8 py-4 text-sm font-bold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-all"
              >
                <span>Book a Demo</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="pt-6 border-t border-slate-200/60 max-w-sm flex items-center gap-6 text-xs text-slate-500 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4.5 w-4.5 text-blue-600" />
                <span>Zero configuration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4.5 w-4.5 text-blue-600" />
                <span>Shopify App Embed</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Visual - Immersive, Layered Product Scene */}
          <div className="lg:col-span-7 relative h-[600px] w-full flex items-center justify-center">
            
            {/* Large Radial Glow Behind Dashboard */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent blur-[80px] pointer-events-none -z-10" />

            {/* Outer Container (Slightly tilted for depth) */}
            <div className="relative w-full max-w-[620px] h-full flex items-center justify-center scale-95 md:scale-100">

              {/* 1. Underlying Main Dashboard Layer (Slightly shifted back & blurry) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, rotateY: 15, rotateX: 5 }}
                animate={{ opacity: 0.5, scale: 1, rotateY: 12, rotateX: 4 }}
                transition={{ duration: 1.2 }}
                className="absolute w-[520px] h-[340px] rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl p-6 overflow-hidden pointer-events-none filter blur-[1px]"
              >
                <div className="flex gap-1.5 mb-6">
                  <div className="h-2 w-2 rounded-full bg-red-500/40" />
                  <div className="h-2 w-2 rounded-full bg-amber-500/40" />
                  <div className="h-2 w-2 rounded-full bg-green-500/40" />
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-1/3 rounded bg-white/10" />
                  <div className="h-32 w-full rounded bg-white/5 border border-white/5" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-10 rounded bg-white/5" />
                    <div className="h-10 rounded bg-white/5" />
                    <div className="h-10 rounded bg-white/5" />
                  </div>
                </div>
              </motion.div>

              {/* SVG Animated Connection Lines between glass layers */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-15" viewBox="0 0 620 600">
                {/* Line: Visitor Browsing to Call Ringing */}
                <motion.path
                  d="M 120 180 C 120 280, 220 280, 220 340"
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {/* Animated pulse along connection path */}
                <path
                  d="M 120 180 C 120 280, 220 280, 220 340"
                  fill="none"
                  stroke="url(#gradient-pulse)"
                  strokeWidth="2"
                  className="stroke-[2px]"
                  style={{
                    strokeDasharray: "30 150",
                    animation: "shimmerLine 4s linear infinite"
                  }}
                />
                
                {/* Line: Agent Roster to Video Ringing */}
                <motion.path
                  d="M 450 130 C 450 200, 360 200, 360 340"
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                <defs>
                  <linearGradient id="gradient-pulse" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <style>{`
                  @keyframes shimmerLine {
                    0% { stroke-dashoffset: 200; }
                    100% { stroke-dashoffset: -200; }
                  }
                `}</style>
              </svg>

              {/* 2. Floating Panel: Visitor Browsing (Top Left) */}
              <motion.div
                initial={{ opacity: 0, x: -60, y: -60 }}
                animate={{ opacity: 1, x: -50, y: -70 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute top-[80px] left-[20px] z-30 w-[230px] rounded-2xl border border-white/60 bg-white/70 shadow-lg backdrop-blur-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Activity className="h-3 w-3 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800">Visitor Browsing</span>
                  </div>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold text-slate-900 leading-tight">Sarah from Chicago</p>
                  <p className="text-[9px] text-slate-500">Cart value: $289.00</p>
                </div>
                <div className="border-t border-slate-100 pt-2 flex items-center gap-1.5 text-[8px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Home</span>
                  <span>&gt;</span>
                  <span className="text-indigo-600">Premium Trench Coat</span>
                </div>
              </motion.div>

              {/* 3. Floating Panel: Agent Roster Status (Top Right) */}
              <motion.div
                initial={{ opacity: 0, x: 60, y: -40 }}
                animate={{ opacity: 1, x: 50, y: -60 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="absolute top-[50px] right-[20px] z-30 w-[200px] rounded-2xl border border-white/60 bg-white/70 shadow-lg backdrop-blur-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-800">Available Experts</span>
                  <span className="text-[9px] font-semibold text-slate-500">(3 Online)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <img src="https://ui-avatars.com/api/?name=Sarah+J&background=6366f1&color=fff" className="h-5 w-5 rounded-full" alt="Agent" />
                      <span className="font-bold text-slate-800">Sarah J.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-green-500" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Available</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <img src="https://ui-avatars.com/api/?name=Marcus+L&background=10b981&color=fff" className="h-5 w-5 rounded-full" alt="Agent" />
                      <span className="font-bold text-slate-800">Marcus L.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-green-500" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">In Call</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 4. Floating Panel: Video Call Ringing (Center Front) */}
              <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.95 }}
                animate={{ opacity: 1, y: 40, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="absolute z-40 w-[300px] rounded-3xl border border-white/60 bg-white/80 shadow-2xl backdrop-blur-xl p-5 space-y-4"
              >
                <div className="text-center relative">
                  {/* Glowing Ring Effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-500/10 rounded-full animate-ping" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-blue-500/10 rounded-full animate-pulse" />
                  
                  <img src="https://ui-avatars.com/api/?name=Sarah+J&background=6366f1&color=fff" className="h-12 w-12 rounded-full mx-auto relative z-10 border-2 border-white shadow-md" alt="Avatar" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black text-slate-900">Initiating Video Consultation...</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Sarah J is joining from the Sales Office</p>
                </div>
                <div className="flex gap-2.5">
                  <button className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                    Decline
                  </button>
                  <button className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5">
                    <Video className="h-3 w-3" /> Accept
                  </button>
                </div>
              </motion.div>

              {/* 5. Floating Panel: Product Shared (Bottom Right) */}
              <motion.div
                initial={{ opacity: 0, x: 80, y: 60 }}
                animate={{ opacity: 1, x: 70, y: 150 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute bottom-[20px] right-[-10px] z-30 w-[190px] rounded-2xl border border-white/60 bg-white/70 shadow-lg backdrop-blur-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  <ShoppingBag className="h-3 w-3 text-indigo-600" />
                  <span>Shared Product</span>
                </div>
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0">
                    <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=150&q=80" className="h-full w-full object-cover" alt="Product" />
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="text-[10px] font-black text-slate-900 block leading-tight truncate">Wool Trench Coat</span>
                    <span className="text-[9px] font-bold text-indigo-600 block">$289.00</span>
                  </div>
                </div>
                <button className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold shadow-md shadow-indigo-500/10 transition-all">
                  Show Details
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── TRUSTED BY LOGO STRIP (Integrated smoothly at bottom) ───────── */}
        <div className="max-w-7xl mx-auto mt-24 lg:mt-32 pt-10 border-t border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 relative z-20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400/80">
            Trusted by the fastest growing global brands
          </p>
          <div className="flex flex-wrap items-center gap-8 opacity-65 grayscale">
            {['Shopify', 'Stripe', 'Framer', 'Vercel', 'Linear'].map((brand, i) => (
              <span key={i} className="text-sm font-extrabold tracking-tight hover:opacity-100 transition-opacity cursor-default">{brand}</span>
            ))}
          </div>
        </div>

      </section>


      {/* ── TRUSTED BUSINESSES (LOGO STRIP) ──────────────────────────────── */}
      <section className="bg-slate-50 py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by the fastest growing e-commerce brands
          </p>
          <div className="flex justify-center">
            {/* The generated image is used here */}
            <img 
              src="/trusted-logos.png" 
              alt="Trusted Businesses" 
              className="h-16 md:h-20 object-contain opacity-80 mix-blend-multiply filter hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </section>

      {/* ── FEATURE SUITES (Like the screenshot) ─────────────────────────── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 space-y-32">
        
        {/* Suite 1: Video Sales Suite */}
        <div>
          <div className="mb-12">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Video className="h-4 w-4" /> Feature 1
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Live Video Sales Suite</h3>
            <p className="text-slate-500 mt-4 text-lg">Bring the human touch to your digital storefront with one-click video calls.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Nav */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {[
                { id: "video", title: "1-on-1 Video Calls", desc: "Instantly connect with high-intent shoppers." },
                { id: "products", title: "Live Product Sharing", desc: "Push products directly into the call view." },
                { id: "screen", title: "Screen Sharing", desc: "Walk customers through complex checkouts." }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 ${
                    activeTab === tab.id 
                      ? "border-blue-200 bg-blue-50 shadow-sm ring-1 ring-blue-500/20" 
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <h4 className={`text-base font-bold ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-800'}`}>
                    {tab.title}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">{tab.desc}</p>
                </button>
              ))}
            </div>

            {/* Right Visual */}
            <div className="lg:col-span-8">
              <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl">
                <div className="rounded-[22px] bg-slate-900 overflow-hidden relative aspect-video flex items-center justify-center">
                  {/* Mockup UI */}
                  <div className="absolute inset-0 flex">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80" className="w-1/2 object-cover opacity-80" alt="Agent" />
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80" className="w-1/2 object-cover opacity-60" alt="Customer" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  
                  <div className="relative z-10 text-center">
                    <button className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-white/30 transition-colors hover:scale-110">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </button>
                    <p className="text-white font-bold text-lg">Watch Live Demo</p>
                  </div>

                  {/* UI Overlay */}
                  <div className="absolute bottom-6 w-full px-8 flex justify-between items-end">
                    <div className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10">
                      Agent: Sarah
                    </div>
                    <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" /> Pushed: Leather Bag
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suite 2: Support & Chat */}
        <div>
          <div className="mb-12">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Feature 2
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Omnichannel Support Suite</h3>
            <p className="text-slate-500 mt-4 text-lg">Don't miss a beat. Handle offline queries and instant chat from one dashboard.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-12 flex flex-col justify-center space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Call Requests</h4>
                      <p className="text-sm text-slate-500">Shoppers schedule callbacks when you're offline.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Live Text Chat</h4>
                      <p className="text-sm text-slate-500">Instantly reply to quick queries without video.</p>
                    </div>
                  </div>
                </div>
                <Link to="/register" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
                  See how it works <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="bg-slate-200 relative min-h-[300px]">
                {/* Dashboard Mockup Image/UI */}
                <div className="absolute inset-4 rounded-xl bg-white shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                  <div className="h-12 border-b border-slate-100 flex items-center px-4 bg-slate-50">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                      <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-600 max-w-[80%]">
                        Hi, I have a question about the sizing for the blue jacket.
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">B</div>
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 text-sm max-w-[80%] shadow-md">
                        Sure! I can start a quick video call to show you the material up close?
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Don't take our word, see what they say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"Making online shopping human again"</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                "BridgeOne completely transformed how we sell high-ticket items. Customers love seeing the product live before buying. Our conversion rate shot up by 40% in the first month."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Michael T.</p>
                  <p className="text-xs text-slate-500">CEO, TechStore</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-2xl"></div>
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"The best Shopify integration we've used"</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                "The setup took literally 2 minutes. The agent console is incredibly intuitive, and being able to push products directly into the customer's cart during a call is magical."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=Sarah+Smith&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Sarah J.</p>
                  <p className="text-xs text-slate-500">Founder, StyleBoutique</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"Incredible support and stability"</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                "We host hundreds of calls daily across our support team. The WebRTC video quality is crystal clear even on mobile networks. Highly recommend for any serious e-comm brand."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=David+L&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">David L.</p>
                  <p className="text-xs text-slate-500">CX Director, HomeGoods</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ───────────────────────────────────────────────────── */}
      <section id="integrations" className="py-24 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Integrations With All Your Favorite Apps</h2>
        <p className="text-slate-500 mb-12">BridgeOne connects seamlessly with the tools you already use.</p>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Wix', 'Squarespace', 'WordPress', 'Stripe', 'Klaviyo', 'Zendesk'].map((brand, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default">
              <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                {brand.charAt(0)}
              </div>
              <span className="font-bold text-sm text-slate-700">{brand}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 border-dashed rounded-xl px-4 py-3">
            <span className="font-bold text-sm text-slate-500">+ Custom HTML / API</span>
          </div>
        </div>
      </section>

      {/* ── CTA / FOOTER ───────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to transform your sales?
          </h2>
          <p className="text-slate-400 text-lg">
            Join thousands of modern merchants who use BridgeOne to drive revenue through live video.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="inline-block rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-blue-500 hover:-translate-y-1 transition-all"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 font-bold text-white text-[10px]">B</div>
            <span className="font-bold text-slate-300">BridgeOne Inc.</span> © 2026
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </section>

    </div>
  );
}
