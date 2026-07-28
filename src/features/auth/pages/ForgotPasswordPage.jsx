import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/config/supabase";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      // Trigger password reset email via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccessMsg("Reset instructions sent! Please check your email inbox.");
      setEmail("");
    } catch (err) {
      console.error("Password reset error:", err);
      setErrorMsg(err.message || "Failed to send reset email. Please verify the address.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative font-sans flex items-center justify-center p-6">
      {/* Ambient Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] left-[10%] w-[600px] h-[600px] rounded-full bg-fuchsia-400/15 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-pink-400/15 blur-[120px]"
        />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 space-y-7"
      >
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <Mail className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Forgot Password?</h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Enter your registered email address and we'll send you recovery instructions.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white/60 pl-12 pr-4 py-3.5 text-sm text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-4 text-sm shadow-xl shadow-slate-900/15 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending email...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs">
          <Link to="/login" className="font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
