import RegisterForm from "../components/RegisterForm";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, ShoppingBag, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden relative font-sans">
      {/* Cinematic Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] left-[10%] w-[700px] h-[700px] rounded-full bg-blue-400/15 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-cyan-400/15 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[40%] w-[500px] h-[500px] rounded-full bg-indigo-300/10 blur-[100px]" 
        />
        <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 min-h-screen relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center pt-24 lg:pt-0">
        
        {/* LEFT SIDE: Brand & Features */}
        <div className="hidden lg:flex flex-col text-left space-y-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm mb-12">
              <ArrowLeft className="w-4 h-4" />
              Back to Website
            </Link>
            
            <div className="flex items-center gap-3 group mb-10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-[0_4px_14px_rgba(219,39,119,0.3)]">
                B
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  BridgeOne
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                  Command Center
                </span>
              </div>
            </div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]"
            >
              Start Your <br/>
              <span className="bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                Free Trial.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-6 text-lg text-slate-600 leading-relaxed max-w-md font-medium"
            >
              Join thousands of fast-growing brands leveraging real-time video commerce to boost conversions and connect directly with high-intent buyers.
            </motion.p>
          </div>

          <div className="space-y-6 max-w-md">
            {[
              { title: "Sub-50ms Global Latency", icon: Zap, color: "text-blue-500", bg: "bg-blue-50 border-blue-100" },
              { title: "Enterprise Grade WebRTC", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100" },
              { title: "In-Stream Cart Integration", icon: ShoppingBag, color: "text-fuchsia-500", bg: "bg-fuchsia-50 border-fuchsia-100" },
            ].map((feature, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
                key={idx} 
                className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className={`p-3 rounded-xl border ${feature.bg}`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <span className="font-bold text-slate-800">{feature.title}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Register Form */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-0 relative w-full">
          <div className="w-full max-w-md lg:hidden mb-10 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_14px_rgba(219,39,119,0.3)]">
                B
              </div>
              <span className="font-extrabold tracking-tight text-slate-900">
                BridgeOne
              </span>
            </Link>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[440px] ml-auto mr-auto lg:mr-0 lg:ml-auto"
          >
            <RegisterForm />
          </motion.div>
        </div>

      </div>
    </div>
  );
}
