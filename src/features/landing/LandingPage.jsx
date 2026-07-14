import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  Zap,
  BarChart3,
  Globe,
  MessageSquare,
  Monitor,
  Bell,
  Star,
  PlayCircle,
  Code2,
  Users,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Check,
  Phone,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Shield,
  Layers,
  Heart,
  ShoppingCart
} from "lucide-react";

export default function LandingPage() {
  // --- Pricing Toggle State ---
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" or "yearly"

  // --- Live Call Simulator States ---
  const [simState, setSimState] = useState("idle"); // "idle" | "calling" | "connected"
  const [simDuration, setSimDuration] = useState(0);
  const [simMicMuted, setSimMicMuted] = useState(false);
  const [simVideoMuted, setSimVideoMuted] = useState(false);

  useEffect(() => {
    let timer;
    if (simState === "connected") {
      timer = setInterval(() => {
        setSimDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setSimDuration(0);
    }
    return () => clearInterval(timer);
  }, [simState]);

  const handleStartSimCall = () => {
    setSimState("calling");
    setTimeout(() => {
      setSimState("connected");
    }, 2500); // Connects after 2.5s
  };

  const handleEndSimCall = () => {
    setSimState("idle");
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60).toString().padStart(2, "0");
    const secs = (sec % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 pb-20 pt-16 lg:pb-28 lg:pt-24">
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-10 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Hero Text */}
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-xs font-semibold text-blue-600">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                Live Video Selling Platform
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                Turn browsers <br className="hidden sm:inline" />
                into buyers with <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  live video selling
                </span>
              </h1>

              <p className="max-w-xl text-lg text-slate-500 leading-relaxed">
                BridgeOne lets you connect instantly with shoppers through live video, chat, screen sharing and more — directly on your website. No apps. No downloads. Just real conversations that convert.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all duration-200"
                >
                  Book a Demo
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                  Setup in 5 minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Right Hero: BridgeOne Agent Console Mockup (B2B SaaS UI Showcase) */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg">
                
                {/* Outer Console Window */}
                <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden transition-all duration-300">
                  
                  {/* Console Header */}
                  <div className="bg-slate-950/80 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white shadow-sm">
                        B
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200">BridgeOne Agent Console</span>
                        <span className="ml-2 text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">v2.4</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-slate-400 font-medium">Agent Online</span>
                    </div>
                  </div>

                  {/* Simulator Area */}
                  {simState === "idle" && (
                    <div className="p-8 text-center space-y-6 bg-slate-900 min-h-[340px] flex flex-col items-center justify-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Monitor className="h-7 w-7" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-200">Simulate Live Customer Call</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                          See what your store agents see when a shopper clicks the video call button on your Shopify or WooCommerce store.
                        </p>
                      </div>
                      <button
                        onClick={handleStartSimCall}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition-all hover:scale-[1.02]"
                      >
                        <Video className="h-4 w-4" />
                        Simulate Incoming Call
                      </button>
                    </div>
                  )}

                  {/* --- Calling / Ringing State --- */}
                  {simState === "calling" && (
                    <div className="p-8 text-center bg-slate-950/80 min-h-[340px] flex flex-col items-center justify-center space-y-6 animate-fade-in">
                      <div className="relative">
                        <div className="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping opacity-75" />
                        <div className="relative h-16 w-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                          <Phone className="h-8 w-8 animate-bounce" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-200">Incoming Video Call</h3>
                        <p className="text-xs text-slate-400">Customer: Sarah M. (Shopify Store)</p>
                        <p className="text-[10px] text-blue-400 font-mono">Referrer: /products/wireless-headphones</p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={handleEndSimCall}
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => setSimState("connected")}
                          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                        >
                          Accept Consultation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- Connected B2B Console State --- */}
                  {simState === "connected" && (
                    <div className="grid grid-cols-12 bg-slate-900 min-h-[340px] text-xs divide-x divide-slate-800 animate-scale-up">
                      
                      {/* Left: Customer Telemetry & Call Stream */}
                      <div className="col-span-8 p-4 flex flex-col justify-between space-y-4">
                        
                        {/* Real-time Customer Data Card */}
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Shopper Details</span>
                            <span className="text-blue-400 font-semibold">Live on Store</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                            <div>
                              <p className="text-slate-500">Name</p>
                              <p className="font-semibold text-slate-300">Sarah M. (Guest)</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Current URL</p>
                              <p className="font-semibold text-blue-400 truncate">/products/headphones</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Cart Status</p>
                              <p className="font-semibold text-amber-500">Empty</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Device/OS</p>
                              <p className="font-semibold text-slate-300">iPhone · iOS 17</p>
                            </div>
                          </div>
                        </div>

                        {/* Split Video Call Interface */}
                        <div className="grid grid-cols-2 gap-3 relative">
                          {/* Remote Feed (Customer) */}
                          <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                            <img
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                              alt="Shopper Feed"
                              className="absolute inset-0 h-full w-full object-cover opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                            <div className="absolute bottom-2 left-2 text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                              Sarah M. (Shopper)
                            </div>
                          </div>

                          {/* Local Feed (Agent) */}
                          <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                            <img
                              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"
                              alt="Agent Feed"
                              className="absolute inset-0 h-full w-full object-cover opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                            <div className="absolute bottom-2 left-2 text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                              You (Agent)
                            </div>
                          </div>
                        </div>

                        {/* Call Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                            {formatDuration(simDuration)}
                          </span>
                          
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setSimMicMuted(!simMicMuted)}
                              className={`rounded-lg p-2 text-white transition-colors ${
                                simMicMuted ? "bg-red-500" : "bg-slate-800 hover:bg-slate-700"
                              }`}
                            >
                              {simMicMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={handleEndSimCall}
                              className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 transition-colors shadow-lg"
                            >
                              <PhoneOff className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Right: Active Product Sharing Catalog */}
                      <div className="col-span-4 p-4 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Push to Shopper</p>
                          
                          {/* Mini Catalog Grid */}
                          <div className="space-y-2">
                            {[
                              { name: "Wireless Headphones", price: "₹2,499" },
                              { name: "Smart Watch SE", price: "₹4,999" }
                            ].map((prod, idx) => (
                              <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 flex flex-col justify-between gap-1.5">
                                <div>
                                  <p className="font-semibold text-slate-300 text-[10px] truncate">{prod.name}</p>
                                  <p className="text-[9px] text-blue-400 font-mono">{prod.price}</p>
                                </div>
                                <button className="w-full py-1 bg-blue-600/20 text-blue-400 rounded text-[9px] font-bold hover:bg-blue-600 hover:text-white transition-all">
                                  Share in Call
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-[9px] text-slate-500 leading-normal">
                          Pushed products float directly inside the shopper's active video call widget.
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Console Footer */}
                  <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>WebRTC Secure Encryption</span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> PCI Compliant
                    </span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS LOGOS ROW ─────────────────────────────────────────── */}
      <section className="border-y border-slate-200/60 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Works with</span>
            
            {/* Shopify */}
            <div className="flex items-center gap-1.5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-200">
              <span className="h-5 w-5 bg-green-500 rounded flex items-center justify-center text-[10px] text-white font-extrabold">S</span>
              <span className="text-sm font-black text-slate-700">shopify</span>
            </div>

            {/* WooCommerce */}
            <div className="flex items-center gap-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-200">
              <span className="text-sm font-black text-purple-700">WOO</span>
              <span className="text-xs font-medium text-slate-500">COMMERCE</span>
            </div>

            {/* Magento */}
            <div className="flex items-center gap-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-200">
              <span className="h-4 w-4 bg-orange-600 rounded-sm transform rotate-45 flex items-center justify-center text-[8px] text-white font-bold">M</span>
              <span className="text-sm font-bold text-slate-700">Magento</span>
            </div>

            {/* WordPress */}
            <div className="flex items-center gap-1.5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-200">
              <span className="h-5 w-5 rounded-full border-2 border-slate-600 flex items-center justify-center text-xs font-black text-slate-700">W</span>
              <span className="text-sm font-bold text-slate-700">WORDPRESS</span>
            </div>

            <span className="text-xs font-semibold text-slate-400">&amp; any custom website</span>
          </div>
        </div>
      </section>

      {/* ── VALUE PROP SECTION ─────────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Why BridgeOne?
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              More conversations. More <span className="text-blue-600">trust</span>. More <span className="text-indigo-600">sales</span>.
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              BridgeOne brings the power of real-time interaction to your online store. Help shoppers, answer questions, and close deals — live.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Grid Item 1 */}
            <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Instant Video Calls</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Connect in one click. No apps, no downloads, and no friction for your potential buyers.
              </p>
            </div>

            {/* Grid Item 2 */}
            <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Build Real Trust</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Face-to-face conversations build shopper confidence, overcome objections, and reduce purchase hesitation.
              </p>
            </div>

            {/* Grid Item 3 */}
            <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Increase Conversions</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Stores using live video selling report up to 3x higher conversion rates and larger checkout carts.
              </p>
            </div>

            {/* Grid Item 4 */}
            <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Chat &amp; Callbacks</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Provide instant text messaging support or schedule later callbacks so you never miss an interested lead.
              </p>
            </div>

            {/* Grid Item 5 */}
            <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Monitor className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Screen Sharing</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Show live product catalogs, slides, sizing charts, or help docs directly during the video consultation.
              </p>
            </div>

            {/* Grid Item 6 */}
            <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Smart Notifications</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Get looping ringtones and vibration cues the instant a new visitor requests a live consultation.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── TOOLKIT / DASHBOARD SHOWCASE SECTION ───────────────────────────── */}
      <section className="bg-white border-y border-slate-200/50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Content List */}
            <div className="space-y-6 lg:col-span-4">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                All-in-one live selling toolkit
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need to sell live, <span className="text-blue-600">in one platform</span>.
              </h2>
              
              <ul className="space-y-4">
                {[
                  { title: "Video Calls", desc: "High quality, low latency peer video consultations." },
                  { title: "Chat & Callbacks", desc: "Seamless text messaging and offline scheduler." },
                  { title: "Screen Sharing", desc: "Share documents, slides, and shopping windows." },
                  { title: "Product Sharing", desc: "Send product catalogs in the widget with one click." },
                  { title: "Live Streaming", desc: "Host sales events or showcase inventory items live." },
                  { title: "Analytics & Reports", desc: "Track conversions, durations, and agent stats." }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Check className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-500"
                >
                  Explore all features
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Dashboard Mockup */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100 overflow-hidden">
                {/* Mockup Topbar */}
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">
                      B
                    </div>
                    <span className="text-xs font-semibold text-slate-200">BridgeOne Dashboard</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-700" />
                    <div className="h-2 w-2 rounded-full bg-slate-700" />
                  </div>
                </div>

                <div className="grid grid-cols-12 bg-slate-50 min-h-[380px]">
                  
                  {/* Mock Sidebar */}
                  <div className="col-span-3 border-r border-slate-200/60 bg-white p-3 space-y-4 hidden sm:block">
                    <div className="space-y-1">
                      <div className="bg-blue-50 text-blue-600 rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" /> Overview
                      </div>
                      {["Calls", "Leads", "Analytics", "Products", "Team", "Settings", "Integrations"].map((label) => (
                        <div key={label} className="text-slate-500 hover:text-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-medium flex items-center gap-2 transition-colors cursor-pointer">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Overview Content */}
                  <div className="col-span-12 sm:col-span-9 p-4 space-y-4">
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Total Calls", val: "1,248", up: "+18.5%", color: "text-green-600" },
                        { label: "Total Leads", val: "892", up: "+21.4%", color: "text-green-600" },
                        { label: "Conversion", val: "32.4%", up: "+8.3%", color: "text-green-600" },
                        { label: "Avg. Duration", val: "06:42", up: "-1.2%", color: "text-red-500" }
                      ].map((stat, idx) => (
                        <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-lg font-bold text-slate-800 mt-1">{stat.val}</p>
                          <span className={`text-[9px] font-bold ${stat.color}`}>{stat.up} vs last month</span>
                        </div>
                      ))}
                    </div>

                    {/* Chart & Top Agent Mini View */}
                    <div className="grid gap-3 md:grid-cols-3">
                      
                      {/* Simulated Chart */}
                      <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Calls Over Time</p>
                        
                        {/* Custom SVG Line Chart */}
                        <div className="h-28 w-full mt-2 flex items-end">
                          <svg className="w-full h-full" viewBox="0 0 100 35" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path d="M 0 35 Q 20 15 40 28 T 80 8 T 100 3 M 100 35 Z" fill="url(#chartGlow)" />
                            {/* Line path */}
                            <path d="M 0 35 Q 20 15 40 28 T 80 8 T 100 3" fill="none" stroke="#2563eb" strokeWidth="2" />
                          </svg>
                        </div>
                      </div>

                      {/* Top Agents */}
                      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Top Agents</p>
                        <div className="space-y-2">
                          {[
                            { name: "Anita S.", calls: "348", role: "Expert" },
                            { name: "Priya S.", calls: "186", role: "Advisor" },
                            { name: "Rahul K.", calls: "164", role: "Support" }
                          ].map((agent, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[9px]">
                                  {agent.name.charAt(0)}
                                </div>
                                <span className="font-semibold text-slate-700">{agent.name}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">{agent.calls} calls</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STEPS SECTION ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-16">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Simple as 3 steps
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Get started in minutes. <br className="sm:hidden" />
              Start selling in <span className="text-blue-600">real-time</span>.
            </h2>
          </div>

          <div className="relative mx-auto max-w-4xl">
            {/* Dashed Connecting Line for Desktop */}
            <div className="absolute top-10 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-slate-200 hidden md:block z-0" />
            
            <div className="grid gap-8 md:grid-cols-3 relative z-10">
              
              {/* Step 1 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                  1
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Code2 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add the embed code</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Copy a single line of code and paste it on your WooCommerce, Shopify theme, or custom HTML.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                  2
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Video className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Go live instantly</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Open the seller portal on any device. You are ready to receive video consultations immediately.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                  3
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BarChart3 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Close more deals</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Help buyers pick variants, recommend styles, build trust, and increase store cart sizes.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── ABOUT SECTION ───────────────────────────────────────────────────── */}
      <section id="about" className="py-20 lg:py-28 bg-white border-y border-slate-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Column: Tech Stack & Uptime Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 shadow-sm">
                <h3 className="text-sm font-bold text-blue-900 mb-4">Enterprise Grade Infrastructure</h3>
                
                <div className="space-y-4">
                  {[
                    { title: "Real-time WebRTC", desc: "No downloads, sub-second latency video & audio streams directly in-browser." },
                    { title: "Supabase Backend", desc: "Secure Postgres storage, Row-Level Security, and real-time subscription synchronization." },
                    { title: "Secure End-to-End", desc: "Fully encrypted media tunnels complying with modern data protection standards." }
                  ].map((tech, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[9px]">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{tech.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{tech.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-blue-100 flex items-center justify-between text-center">
                  <div>
                    <p className="text-xl font-extrabold text-blue-600">99.9%</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Uptime SLA</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-indigo-600">&lt;250ms</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Latency</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-blue-600">256-bit</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Encryption</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Mission & Core Value */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                About BridgeOne
              </span>
              
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight">
                Humanizing the online shopping experience, <span className="text-blue-600">one call at a time</span>.
              </h2>
              
              <p className="text-base text-slate-500 leading-relaxed">
                At BridgeOne, our mission is to close the gap between digital convenience and physical personalization. We believe that the best e-commerce conversions don't come from aggressive popups, but from real, trust-based human relationships.
              </p>

              <p className="text-sm text-slate-500 leading-relaxed">
                By enabling online store owners and sales agents to immediately present products, answer custom sizing questions, and address purchase hesitation via interactive live video, we help online businesses convert clicks into lifelong customers.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl">
                  <Users className="h-4 w-4 text-blue-600" />
                  Built for modern merchant teams
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl">
                  <Zap className="h-4 w-4 text-indigo-600" />
                  Ultra-lightweight script payload
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ───────────────────────────────────────────── */}
      <section className="bg-slate-100/50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-16">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Loved by online sellers
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Trusted by sellers. Loved by customers.
            </h2>
          </div>

          <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
            {[
              {
                stars: 5,
                quote: "BridgeOne increased our conversion rate by 40%. Customers love talking to us before they buy.",
                name: "Priya S.",
                role: "Shopify Store Owner"
              },
              {
                stars: 5,
                quote: "Setup took literally 5 minutes. It works flawlessly on our WooCommerce store.",
                name: "Marcus T.",
                role: "Head of E-commerce"
              },
              {
                stars: 5,
                quote: "The best decision we made. Our team can handle more customers and close more deals every day.",
                name: "Anita R.",
                role: "Founder, Fashion Boutique"
              }
            ].map((test, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex text-amber-400 gap-0.5 mb-4">
                    {[...Array(test.stars)].map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic">"{test.quote}"</p>
                </div>
                
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                    {test.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{test.name}</h4>
                    <p className="text-[10px] text-slate-400">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── PRICING SECTION ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 lg:py-28 bg-white border-b border-slate-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Ready to sell like never before?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Join hundreds of sellers already using BridgeOne to build real connections and grow their business.
            </p>

            {/* Toggle Billing Switch */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-xs font-semibold ${billingCycle === "monthly" ? "text-blue-600" : "text-slate-400"}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setBillingCycle((prev) => (prev === "monthly" ? "yearly" : "monthly"))}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                style={{ backgroundColor: billingCycle === "yearly" ? "#2563eb" : "#e2e8f0" }}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${billingCycle === "yearly" ? "text-blue-600" : "text-slate-400"} flex items-center gap-1.5`}>
                Yearly Billing
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-3">
            
            {/* Starter Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Starter</h3>
                  <p className="text-xs text-slate-400 mt-1">Perfect for small stores</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingCycle === "monthly" ? "₹1,499" : "₹1,199"}
                  </span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>

                <hr className="border-slate-100" />

                <ul className="text-xs space-y-2.5 text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> 100 Calls / month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> 1 Agent
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Basic Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Email Support
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 flex flex-col justify-between shadow-md relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Most Popular
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pro</h3>
                  <p className="text-xs text-slate-400 mt-1">For growing businesses</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingCycle === "monthly" ? "₹3,999" : "₹3,199"}
                  </span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>

                <hr className="border-slate-100" />

                <ul className="text-xs space-y-2.5 text-slate-600">
                  <li className="flex items-center gap-2 font-semibold text-slate-800">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Unlimited Calls
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> 3 Agents
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Advanced Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Priority Support
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-500 transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* Business Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Business</h3>
                  <p className="text-xs text-slate-400 mt-1">For large teams</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingCycle === "monthly" ? "₹9,999" : "₹7,999"}
                  </span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>

                <hr className="border-slate-100" />

                <ul className="text-xs space-y-2.5 text-slate-600">
                  <li className="flex items-center gap-2 font-semibold text-slate-800">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Unlimited Calls
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Unlimited Agents
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Custom Integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" /> Dedicated Support
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-50 border-t border-slate-200/60 py-16 text-slate-500 text-xs">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="grid gap-10 md:grid-cols-4 lg:grid-cols-5 mb-12">
            
            {/* Col 1 Brand */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md">
                  B
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">BridgeOne</p>
                  <p className="text-[10px] text-slate-400">Live Video Selling</p>
                </div>
              </div>
              <p className="max-w-xs text-slate-400 leading-relaxed">
                Real-time video calling widget that helps online stores build trust, answer customer questions, and boost conversion rates directly on the product detail pages.
              </p>
            </div>

            {/* Col 2 Product */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-slate-950 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-slate-950 transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-slate-950 transition-colors">Pricing</a></li>
                <li><Link to="/seller/integrations" className="hover:text-slate-950 transition-colors">Integrations</Link></li>
              </ul>
            </div>

            {/* Col 3 Resources */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#docs" className="hover:text-slate-950 transition-colors">Documentation</a></li>
                <li><a href="#help" className="hover:text-slate-950 transition-colors">Help Center</a></li>
                <li><a href="#blog" className="hover:text-slate-950 transition-colors">Blog</a></li>
                <li><a href="#changelog" className="hover:text-slate-950 transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Col 4 Company */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="hover:text-slate-950 transition-colors">About Us</a></li>
                <li><a href="#careers" className="hover:text-slate-950 transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-slate-950 transition-colors">Contact Us</a></li>
                <li><a href="#privacy" className="hover:text-slate-950 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
            <p>© {new Date().getFullYear()} BridgeOne. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-600 cursor-pointer">Twitter</span>
              <span className="hover:text-slate-600 cursor-pointer">LinkedIn</span>
              <span className="hover:text-slate-600 cursor-pointer">GitHub</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
