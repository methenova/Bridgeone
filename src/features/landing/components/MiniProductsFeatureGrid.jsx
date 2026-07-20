import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Monitor,
  BarChart3,
  Sliders,
  Phone,
  Send,
  Bot,
  CheckCircle2,
  MousePointer,
  Zap,
  Globe,
  ArrowUpRight,
} from "lucide-react";

export default function MiniProductsFeatureGrid() {
  // Interactive state for Mini Products
  const [chatMessages, setChatMessages] = useState([
    { sender: "customer", text: "Hi! Does this jacket run true to size?" },
    { sender: "agent", text: "Hello! Yes, but I can show you the exact fit live in video!" },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [pushedProduct, setPushedProduct] = useState(false);
  const [widgetColor, setWidgetColor] = useState("bg-blue-600");

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setChatMessages((prev) => [...prev, { sender: "agent", text: inputVal }]);
    setInputVal("");
  };

  return (
    <section id="features" className="relative bg-[#FCFCFD] py-28 border-t border-slate-200/60 text-slate-900 selection:bg-blue-100">
      
      {/* Background Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-50/50 blur-[140px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[45vw] h-[45vw] rounded-full bg-cyan-50/40 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
            THE BRIDGEONE PRODUCT SUITE
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.15] text-slate-900">
            Miniature Software Engines <br className="hidden sm:block" />
            Built for <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">Instant Connection</span>
          </h2>
          <p className="text-slate-500 text-base font-normal leading-[1.65]">
            Every feature is engineered as a precision tool. Experience interactive miniature software interfaces designed to remove buyer friction instantly.
          </p>
        </div>

        {/* 8 MINIATURE SOFTWARE PRODUCT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* ── MINI PRODUCT 1: LIVE VIDEO CALLING ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center">
                  <Video className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  WebRTC 4K
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Video Calling</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Face-to-face 1-on-1 HD video session straight in the customer browser without downloads.
              </p>
            </div>

            {/* Interactive Mini UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2.5">
              <div className="relative h-28 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="h-9 w-9 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center text-xs font-bold shadow-md">
                    MK
                  </div>
                  <p className="text-[10px] font-bold text-white mt-1">Agent Maya</p>
                </div>
                <div className="absolute bottom-2 right-2 h-7 w-10 rounded bg-slate-800 border border-white/20 flex items-center justify-center text-[7px] text-slate-200 font-bold">
                  Buyer
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-blue-600" /> HD Audio</span>
                <span className="text-emerald-600 font-bold">Connected</span>
              </div>
            </div>
          </motion.div>

          {/* ── MINI PRODUCT 2: LIVE TEXT CHAT ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-cyan-50 border border-cyan-200/60 text-cyan-600 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/60">
                  Instant Sync
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Omnichannel Chat</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Real-time text messaging with read receipts and typing indicators.
              </p>
            </div>

            {/* Interactive Mini Chat UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2">
              <div className="h-24 overflow-y-auto space-y-1.5 text-[10px]">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl max-w-[85%] ${
                      msg.sender === "agent"
                        ? "bg-blue-600 text-white ml-auto rounded-br-none"
                        : "bg-white text-slate-700 border border-slate-200/80 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-1">
                <input
                  type="text"
                  placeholder="Type reply..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500"
                />
                <button type="submit" className="px-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold">
                  <Send className="h-3 w-3" />
                </button>
              </form>
            </div>
          </motion.div>

          {/* ── MINI PRODUCT 3: AI COPILOT SUGGESTIONS ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-violet-50 border border-violet-200/60 text-violet-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60">
                  AI Engine
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Sales Copilot</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Suggests optimal answers and product recommendations to sales agents in real time.
              </p>
            </div>

            {/* Interactive AI Suggestion UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600">
                <Sparkles className="h-3.5 w-3.5" /> Recommended Response
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-[10px] text-slate-700 font-medium leading-relaxed">
                "Recommend the Emerald Silk Dress — matches visitor's saved wishlist item."
              </div>
              <button className="w-full py-1 rounded-lg bg-violet-600 text-white text-[10px] font-bold shadow-sm">
                Insert Suggestion
              </button>
            </div>
          </motion.div>

          {/* ── MINI PRODUCT 4: IN-CALL PRODUCT SHARING ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Cart Sync
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Product Sharing</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Agents push product cards directly into buyer screen with 1-click cart add.
              </p>
            </div>

            {/* Interactive Product Push UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-800">
                <span>Silk Dress</span>
                <span className="text-emerald-600">₹24,000</span>
              </div>
              <button
                onClick={() => setPushedProduct((p) => !p)}
                className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  pushedProduct
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {pushedProduct ? "✓ Product Pushed to Buyer" : "Push Item to Screen"}
              </button>
            </div>
          </motion.div>

          {/* ── MINI PRODUCT 5: SCREEN SHARING ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center">
                  <Monitor className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  Co-Browse
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Interactive Screen Share</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Guide customers through complex configurations and checkout steps live.
              </p>
            </div>

            {/* Interactive Co-Browse UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                <span className="flex items-center gap-1"><MousePointer className="h-3 w-3 text-blue-600" /> Agent Pointer</span>
                <span className="text-xs font-bold text-blue-600">Active</span>
              </div>
              <div className="h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                Sharing Checkout View
              </div>
            </div>
          </motion.div>

          {/* ── MINI PRODUCT 6: REAL-TIME ANALYTICS ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  Metrics
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Real-time Analytics</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Monitor live shopper count, agent response velocity, and influenced revenue.
              </p>
            </div>

            {/* Interactive Analytics UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2">
              <div className="flex items-end gap-1.5 h-10 px-1">
                {[40, 65, 85, 55, 95, 75, 90, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-blue-600 opacity-90" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-600 pt-1 border-t border-slate-200/60">
                <span>Conversion +3.4x</span>
                <span className="text-emerald-600 font-bold">₹1.4M Sales</span>
              </div>
            </div>
          </motion.div>

          {/* ── MINI PRODUCT 7: WIDGET CUSTOMIZATION ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-cyan-50 border border-cyan-200/60 text-cyan-600 flex items-center justify-center">
                  <Sliders className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/60">
                  Custom UI
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Widget Customization</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Match your store brand identity with custom colors, positions, and fonts.
              </p>
            </div>

            {/* Interactive Color Switcher UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600">Theme</span>
                <div className="flex gap-1.5">
                  {["bg-blue-600", "bg-emerald-600", "bg-violet-600"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setWidgetColor(c)}
                      className={`h-4 w-4 rounded-full ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className={`h-8 rounded-xl ${widgetColor} text-white flex items-center justify-center text-[10px] font-bold shadow-sm transition-colors`}>
                Preview Widget Button
              </div>
            </div>
          </motion.div>

          {/* ── MINI PRODUCT 8: PLATFORM INTEGRATION ── */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center">
                  <Globe className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  Shopify & Web
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Instant Platform Integration</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Connects in 2 minutes to Shopify, custom React, and web stores with zero code.
              </p>
            </div>

            {/* Interactive Integration UI */}
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Shopify App Store</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-[10px] font-semibold text-slate-600 flex items-center justify-between">
                <span>Status: Connected</span>
                <span className="text-blue-600 font-bold">2-Min Setup</span>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
