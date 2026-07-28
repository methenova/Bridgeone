import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { updatePassword, getSession } from "../services/auth.service";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function checkAuthSession() {
      try {
        const { data } = await getSession();
        if (!data?.session) {
          setErrorMsg("No active reset session found. Please request a new link.");
        }
      } catch (err) {
        console.warn("Session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkAuthSession();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      await updatePassword(password);

      setSuccessMsg("Your password has been reset successfully! Redirecting you to login...");
      toast.success("Password reset successful!");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Password reset update error:", err);
      setErrorMsg(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-fuchsia-600 animate-spin" />
      </div>
    );
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
              <KeyRound className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Enter your new secure password below to regain account access.
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

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
              <input
                type="password"
                required
                placeholder="New Password"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E8E6E1] bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all font-semibold text-xs placeholder:text-slate-400 placeholder:font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="relative group">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
              <input
                type="password"
                required
                placeholder="Confirm Password"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E8E6E1] bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all font-semibold text-xs placeholder:text-slate-400 placeholder:font-medium"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || errorMsg.includes("No active reset session")}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-fuchsia-500/20 hover:opacity-95 transition-opacity active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
