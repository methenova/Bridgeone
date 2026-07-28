import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Store, Settings, Zap, Code, Check, LogOut, Shield } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

const ONBOARDING_STEPS = [
  {
    number: 1,
    id: "profile",
    path: "/onboarding/profile",
    title: "Profile Setup",
    subtitle: "Personal information",
    icon: User,
  },
  {
    number: 2,
    id: "business",
    path: "/onboarding/business",
    title: "Business Setup",
    subtitle: "Store credentials",
    icon: Store,
  },
  {
    number: 3,
    id: "workspace",
    path: "/onboarding/workspace",
    title: "Workspace Setup",
    subtitle: "Working hours & language",
    icon: Settings,
  },
  {
    number: 4,
    id: "subscription",
    path: "/onboarding/subscription",
    title: "Subscription",
    subtitle: "Select plan",
    icon: Zap,
  },
  {
    number: 5,
    id: "complete",
    path: "/onboarding/complete",
    title: "Widget Setup",
    subtitle: "Live installation",
    icon: Code,
  },
];

export default function OnboardingLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthContext();

  // Find active step index (1-indexed)
  const currentStep =
    ONBOARDING_STEPS.find((step) => location.pathname.startsWith(step.path)) ||
    ONBOARDING_STEPS[0];

  const activeIndex = currentStep.number;
  const progressPercentage = (activeIndex / 5) * 100;

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      console.warn("Logout error during onboarding:", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[25%] left-[15%] w-[700px] h-[700px] rounded-full bg-fuchsia-400/10 blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[25%] -right-[15%] w-[600px] h-[600px] rounded-full bg-pink-400/10 blur-[140px]"
        />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Top Header Navbar */}
      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-rose-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-fuchsia-500/20">
              B
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                BridgeOne
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-600 text-[10px] font-extrabold uppercase tracking-wider">
                Setup
              </span>
            </div>
          </div>

          {/* Current Step Indicator Pill */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
            <span>
              Step {activeIndex} of 5 &mdash; <strong className="text-slate-900">{currentStep.title}</strong>
            </span>
          </div>

          {/* User Account / Sign Out */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {profile?.full_name || user?.email || "Seller Account"}
              </p>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Top Animated Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 relative overflow-hidden z-30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 shadow-sm shadow-fuchsia-500/50"
        />
      </div>

      {/* Step Timeline Navigation Bar */}
      <div className="w-full bg-white/40 backdrop-blur-md border-b border-slate-200/60 py-4 px-6 relative z-20 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {ONBOARDING_STEPS.map((step) => {
              const StepIcon = step.icon;
              const isCompleted = step.number < activeIndex;
              const isActive = step.number === activeIndex;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center text-center space-y-1.5 transition-all ${
                    isActive
                      ? "opacity-100"
                      : isCompleted
                      ? "opacity-90"
                      : "opacity-40"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : isActive
                        ? "bg-slate-950 text-white shadow-slate-900/20 ring-4 ring-fuchsia-500/20 scale-105"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="hidden sm:block">
                    <p
                      className={`text-[11px] font-extrabold leading-tight ${
                        isActive
                          ? "text-slate-900"
                          : isCompleted
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[90px]">
                      Step {step.number}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Animated Step Content Container */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full max-w-4xl"
          >
            {children || <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Security Badge */}
      <footer className="py-4 text-center text-xs text-slate-400 font-medium relative z-10 flex items-center justify-center gap-1.5 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        <span>BridgeOne SSL Encrypted & Protected Setup &bull; Step {activeIndex} of 5</span>
      </footer>
    </div>
  );
}
