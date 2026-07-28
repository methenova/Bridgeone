import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, RefreshCw, AlertCircle, Sparkles, Edit3, Check, X } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [currentEmail, setCurrentEmail] = useState(user?.email || "");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Countdown timer state (60 seconds)
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Change email edit state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setCurrentEmail(user.email);
    }
  }, [user]);

  // Countdown Timer Effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Poll for verification periodically
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          clearInterval(pollInterval);
          navigate("/onboarding/profile", { replace: true });
        }
      } catch {
        // Silent poll warning
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [navigate]);

  async function handleResendEmail() {
    if (!currentEmail || !canResend) return;

    try {
      setResending(true);
      setErrorMsg("");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: currentEmail,
      });

      if (error) throw error;

      setResendSuccess(true);
      setCountdown(60); // Reset 60s countdown
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      console.warn("Resend email error:", err);
      setErrorMsg(err.message || "Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleUpdateEmail(e) {
    e.preventDefault();
    const emailToUpdate = newEmailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailToUpdate || !emailRegex.test(emailToUpdate)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    try {
      setUpdatingEmail(true);
      setErrorMsg("");

      const { error } = await supabase.auth.updateUser({ email: emailToUpdate });
      if (error) throw error;

      setCurrentEmail(emailToUpdate);
      setIsEditingEmail(false);
      setResendSuccess(true);
      setCountdown(60);
      setNewEmailInput("");
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      console.error("Update email error:", err);
      setErrorMsg(err.message || "Failed to update email address.");
    } finally {
      setUpdatingEmail(false);
    }
  }

  async function handleCheckVerification() {
    try {
      setChecking(true);
      setErrorMsg("");

      // Query latest user status from server rather than local cache
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (user?.email_confirmed_at) {
        navigate("/onboarding/profile", { replace: true });
      } else {
        setErrorMsg("Your email is not verified yet. Please check your inbox for the verification link or request a new one.");
      }
    } catch (err) {
      console.error("Verification check error:", err);
      setErrorMsg(err.message || "Failed to check email verification status.");
    } finally {
      setChecking(false);
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
        className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 space-y-7 text-center"
      >
        {/* Animated Mail Header Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-rose-500 text-white flex items-center justify-center shadow-xl shadow-fuchsia-500/20">
            <Mail className="w-10 h-10" />
          </div>
        </div>

        {/* Header & Instructions */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200/60 text-fuchsia-600 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Verification Required
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Check your inbox
          </h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            We sent a verification link to:
          </p>

          {/* Email Address Display / Change Email Form */}
          {!isEditingEmail ? (
            <div className="flex items-center justify-center gap-2 pt-1">
              <strong className="text-slate-900 font-mono text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 break-all">
                {currentEmail || "your email address"}
              </strong>
              <button
                type="button"
                onClick={() => {
                  setNewEmailInput(currentEmail);
                  setIsEditingEmail(true);
                }}
                className="text-fuchsia-600 hover:text-fuchsia-700 p-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors cursor-pointer"
                title="Change Email"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateEmail} className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Enter new email address"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-fuchsia-500"
                  required
                />
                <button
                  type="submit"
                  disabled={updatingEmail}
                  className="p-2 rounded-xl bg-fuchsia-600 text-white hover:bg-fuchsia-700 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Save Email"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="p-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Updating email will trigger a new verification link.
              </p>
            </form>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {resendSuccess && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Verification email sent! Please check your inbox.</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {/* Resend Email Button with Countdown Timer */}
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={!canResend || resending}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            <span>
              {resending
                ? "Sending Email..."
                : canResend
                ? "Resend Verification Email"
                : `Resend Email in ${countdown}s`}
            </span>
          </button>

          {/* Continue / Check Verification Button */}
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-4 text-sm shadow-xl shadow-slate-900/15 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            {checking ? (
              <span>Verifying Session...</span>
            ) : (
              <>
                <span>I've Verified My Email — Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Change Email / Back to Register Footer Option */}
        <div className="pt-2 text-center text-xs text-slate-400 font-medium space-y-1">
          <div>
            Didn't receive email or entered wrong address?{" "}
            <button
              type="button"
              onClick={() => setIsEditingEmail(true)}
              className="font-bold text-fuchsia-600 hover:underline cursor-pointer"
            >
              Change Email
            </button>
          </div>
          <div>
            Need a fresh account?{" "}
            <Link to="/register" className="font-bold text-slate-600 hover:underline">
              Register again
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
