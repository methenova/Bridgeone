import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Video, ShoppingBag, Phone 
} from "lucide-react";
import { Link } from "react-router-dom";

export default function CinematicDemo() {
  const [scene, setScene] = useState(1);
  const [typing, setTyping] = useState("");
  const messageToType = "Hi, can you help me choose the correct shoe size?";

  useEffect(() => {
    // 30 second total loop
    const sequence = [
      { s: 1, duration: 4000 },  // 0-4s: E-commerce scroll & zoom to widget
      { s: 2, duration: 3000 },  // 4-7s: Expand widget, greeting
      { s: 3, duration: 4000 },  // 7-11s: Customer typing & sending
      { s: 4, duration: 4000 },  // 11-15s: Transition to Dashboard, Accept
      { s: 5, duration: 3000 },  // 15-18s: Connecting...
      { s: 6, duration: 3000 },  // 18-21s: Live Video
      { s: 7, duration: 4000 },  // 21-25s: Product Share
      { s: 8, duration: 2000 },  // 25-27s: Dashboard Analytics update
      { s: 9, duration: 3000 },  // 27-30s: End screen & logo
    ];

    let timeouts = [];
    let cumulativeTime = 0;

    const playSequence = () => {
      cumulativeTime = 0;
      sequence.forEach((item) => {
        const timeout = setTimeout(() => {
          setScene(item.s);
          if (item.s === 3) {
            // Start typing effect for scene 3
            setTyping("");
            let typed = "";
            for (let i = 0; i < messageToType.length; i++) {
              setTimeout(() => {
                typed += messageToType[i];
                setTyping(typed);
              }, i * 50); // fast typing
            }
          }
          if (item.s === 9) {
             setTimeout(playSequence, item.duration); // Loop back
          }
        }, cumulativeTime);
        timeouts.push(timeout);
        cumulativeTime += item.duration;
      });
    };

    playSequence();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Shared Animation Variants
  const cinematicScale = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 1.2, ease: "easeOut" } },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="w-screen h-screen bg-[#FBFBF9] text-slate-900 overflow-hidden font-sans relative flex items-center justify-center selection:bg-blue-100">
      
      {/* Cinematic Vignette & Grain */}
      <div className="absolute inset-0 z-50 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.03)]" />
      <div 
        className="absolute inset-0 z-50 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      <AnimatePresence mode="wait">
        
        {/* SCENES 1, 2, 3: THE E-COMMERCE EXPERIENCE */}
        {(scene === 1 || scene === 2 || scene === 3) && (
          <motion.div 
            key="ecommerce-scene"
            className="absolute inset-0 flex items-center justify-center bg-[#FAF9F6]"
            variants={cinematicScale}
            initial="hidden" animate="visible" exit="exit"
          >
            {/* The E-Commerce Mockup Container */}
            <motion.div 
              className="relative w-[1200px] h-[750px] bg-white rounded-3xl shadow-[0_30px_80px_-15px_rgba(15,23,42,0.08)] border border-[#E8E6E1] overflow-hidden"
              animate={scene > 1 ? { scale: 1.05, x: -100 } : { scale: 1, x: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Fake Ecom Header */}
              <div className="h-16 border-b border-slate-100 flex items-center justify-between px-10">
                <div className="font-extrabold text-xl tracking-tighter">SNEAKERX.</div>
                <div className="flex gap-8 text-xs font-bold text-slate-500">
                  <span>Men</span><span>Women</span><span>New Arrivals</span>
                </div>
                <ShoppingBag className="w-5 h-5 text-slate-900" />
              </div>

              {/* Fake Ecom Hero Image */}
              <div className="relative h-[600px] w-full bg-slate-50 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80" 
                  className="w-full h-full object-cover opacity-90"
                  alt="Sneaker"
                />
                <div className="absolute left-16 top-32 space-y-4">
                  <h1 className="text-6xl font-black text-white mix-blend-difference drop-shadow-md">NIKE AIR MAX</h1>
                  <p className="text-xl text-white font-medium drop-shadow-md">The future of comfort.</p>
                  <button className="px-8 py-3 bg-white text-slate-900 font-bold text-sm rounded-full">Shop Now</button>
                </div>
              </div>

              {/* The BridgeOne Widget */}
              <motion.div 
                className="absolute bottom-8 right-8 z-20 flex flex-col items-end"
                animate={scene > 1 ? { scale: 1.1, y: -20, x: -20 } : { scale: 1, y: 0, x: 0 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Expanded Widget State (Scene 2 & 3) */}
                <AnimatePresence>
                  {scene >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="mb-4 w-[360px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-[#E8E6E1] overflow-hidden flex flex-col"
                    >
                      <div className="bg-blue-600 p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">B</div>
                          <div>
                            <p className="font-bold text-sm">BridgeOne Advisor</p>
                            <p className="text-[10px] text-blue-100 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                            </p>
                          </div>
                        </div>
                        <Video className="w-5 h-5 text-blue-100" />
                      </div>
                      
                      <div className="h-64 p-5 flex flex-col gap-4 bg-[#FBFBF9] overflow-y-auto">
                        {/* Greeting */}
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: 0.3 }}
                          className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-none w-[85%] text-sm font-medium text-slate-700 shadow-sm"
                        >
                          👋 Hi!<br/>How can we help you today?
                        </motion.div>

                        {/* Customer Typing / Message */}
                        {scene === 3 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="self-end bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] text-sm font-medium shadow-sm"
                          >
                            {typing}
                            {typing.length < messageToType.length && (
                              <motion.span 
                                animate={{ opacity: [1, 0] }} 
                                transition={{ repeat: Infinity, duration: 0.6 }}
                              >
                                |
                              </motion.span>
                            )}
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                        <div className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center px-4 text-xs text-slate-400">
                          {scene === 3 && typing.length === messageToType.length ? "" : "Type a message..."}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* The Widget Button itself */}
                <motion.div 
                  className="w-16 h-16 rounded-full bg-blue-600 shadow-[0_8px_30px_rgba(37,99,235,0.4)] flex items-center justify-center cursor-pointer relative"
                  animate={scene === 1 ? { scale: [1, 1.05, 1] } : { scale: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MessageSquare className="w-7 h-7 text-white" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* SCENES 4, 5, 6, 7, 8: THE AGENT DASHBOARD & LIVE CALL */}
        {(scene >= 4 && scene <= 8) && (
          <motion.div 
            key="dashboard-scene"
            className="absolute inset-0 flex items-center justify-center bg-[#F5F4F0]"
            variants={cinematicScale}
            initial="hidden" animate="visible" exit="exit"
          >
             <div className="w-[1300px] h-[800px] bg-[#FBFBF9] rounded-[32px] shadow-[0_40px_100px_-20px_rgba(15,23,42,0.12)] border border-[#E8E6E1] overflow-hidden flex flex-col">
                
                {/* Dashboard Header */}
                <div className="h-16 bg-white border-b border-[#E8E6E1] px-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">B</div>
                    <span className="font-extrabold text-sm text-slate-900">BridgeOne Workspace</span>
                  </div>
                  <div className="flex gap-4 text-xs font-bold text-slate-500">
                    <span className="text-blue-600">Active Queue</span>
                    <span>Analytics</span>
                    <span>Settings</span>
                  </div>
                </div>

                <div className="flex-1 p-8 grid grid-cols-12 gap-8 relative">
                  
                  {/* Left Panel: Analytics & Queue */}
                  <div className="col-span-3 flex flex-col gap-6">
                    <motion.div 
                      className="bg-white p-5 rounded-2xl border border-[#E8E6E1] shadow-sm space-y-4"
                      animate={scene === 8 ? { scale: 1.05, borderColor: '#2563EB' } : {}}
                      transition={{ duration: 0.6 }}
                    >
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Metrics</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500">Today's Visitors</p>
                          <p className="text-2xl font-black text-slate-900">
                            {scene === 8 ? "2,492" : "2,488"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500">Live Conversations</p>
                          <p className="text-2xl font-black text-blue-600">
                            {scene >= 5 ? "14" : "13"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500">Conversion Rate</p>
                          <p className="text-2xl font-black text-emerald-600">
                            {scene >= 8 ? "8.4%" : "7.9%"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Center Panel: Notification / Video Call */}
                  <div className="col-span-6 relative flex flex-col items-center justify-center">
                    
                    {/* Scene 4: Notification Slide In */}
                    <AnimatePresence>
                      {scene === 4 && (
                        <motion.div
                          initial={{ opacity: 0, y: 50, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="w-full bg-white p-8 rounded-3xl border border-[#E8E6E1] shadow-[0_20px_60px_rgba(15,23,42,0.08)] flex flex-col items-center text-center space-y-6"
                        >
                           <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-pulse">
                             <Video className="w-8 h-8" />
                           </div>
                           <div>
                             <h2 className="text-xl font-extrabold text-slate-900">New Visitor Request</h2>
                             <p className="text-sm text-slate-500 mt-2">Customer is viewing: <span className="font-bold text-slate-900">Nike Air Max</span></p>
                           </div>
                           <div className="flex gap-4 w-full pt-4">
                             <button className="flex-1 py-3 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">Decline</button>
                             <button className="flex-1 py-3 rounded-full bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transform hover:scale-105 transition-all">Accept Call</button>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Scene 5: Connecting */}
                    <AnimatePresence>
                      {scene === 5 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center space-y-4"
                        >
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                          <p className="text-sm font-bold text-blue-600 tracking-widest uppercase">Connecting WebRTC...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Scene 6, 7, 8: Live Video Call */}
                    <AnimatePresence>
                      {scene >= 6 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="w-full h-full bg-slate-900 rounded-[32px] overflow-hidden relative shadow-2xl"
                        >
                          {/* Agent Video Background */}
                          <img 
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80" 
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                            alt="Agent"
                          />
                          
                          {/* Top UI */}
                          <div className="absolute top-6 inset-x-6 flex justify-between items-center z-10">
                            <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold text-white flex items-center gap-2 border border-white/10">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              01:24
                            </div>
                            <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10">
                              HD 1080p
                            </div>
                          </div>

                          {/* Floating Controls */}
                          <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4 z-10">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg">
                              <Phone className="w-5 h-5 transform rotate-[135deg]" />
                            </div>
                          </div>

                          {/* Scene 7: Product Shared Overlay */}
                          <AnimatePresence>
                            {scene >= 7 && (
                              <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-64 bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-2xl"
                              >
                                <img 
                                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80" 
                                  className="w-full h-32 object-cover rounded-2xl mb-3"
                                  alt="Shoe"
                                />
                                <h4 className="font-extrabold text-sm text-slate-900">Nike Air Max</h4>
                                <p className="text-lg font-black text-blue-600 mt-1">₹5,499</p>
                                <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">Available in Size 10</div>
                                <button className="mt-3 w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Push to Customer</button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right Panel: Customer Context */}
                  <div className="col-span-3 flex flex-col gap-6">
                    <motion.div 
                      className="bg-white p-5 rounded-2xl border border-[#E8E6E1] shadow-sm h-full flex flex-col"
                      animate={scene >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Context</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">?</div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">Guest Visitor</p>
                            <p className="text-[10px] text-slate-500">Browsing for 4m 12s</p>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-500">Current Page</p>
                          <p className="text-xs font-bold text-slate-900 truncate">/product/nike-air-max</p>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                          <p className="text-[10px] font-bold text-blue-600">AI Intent Analysis</p>
                          <p className="text-xs font-bold text-blue-900">High intent. Sizing questions detected.</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                </div>
             </div>
          </motion.div>
        )}

        {/* SCENE 9: OUTRO & LOGO */}
        {scene === 9 && (
          <motion.div 
            key="outro-scene"
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDFDFC]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-[0_10px_30px_rgba(37,99,235,0.4)]">
                  B
                </div>
                <span className="font-extrabold text-3xl tracking-tight text-slate-900">BridgeOne</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">
                Every Visitor Deserves <br/>
                <span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  a Real Conversation.
                </span>
              </h1>
              
              <div className="flex gap-4 pt-4">
                <Link to="/register" className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-sm shadow-xl shadow-blue-600/30 hover:scale-105 transition-transform">
                  Start Free
                </Link>
                <Link to="/login" className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all">
                  Book Demo
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
