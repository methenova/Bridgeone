import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, RefreshCw, LogOut, RotateCcw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthContext } from "@/context/AuthContext";

const SellerDashboardPage = lazy(() => import("@/features/seller/pages/SellerDashboardPage"));
const AgentDashboardPage = lazy(() => import("./pages/AgentDashboardPage"));
const AdminDashboardPage = lazy(() => import("@/features/admin/pages/AdminDashboardPage"));
const ManagementDashboardPage = lazy(() => import("./pages/ManagementDashboardPage"));
const CustomerMarketplacePage = lazy(() => import("./pages/CustomerMarketplacePage"));

const Loadable = (Component) => (
  <Suspense
    fallback={
      <div className="min-h-[400px] flex items-center justify-center text-slate-600">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-650" />
      </div>
    }
  >
    <Component />
  </Suspense>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { role, loading, refreshProfile, logout } = useAuthContext();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    try {
      setRetrying(true);
      await refreshProfile();
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    } finally {
      setRetrying(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-fuchsia-200 border-t-fuchsia-600 shadow-md" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Hydrating profile & dashboard permissions...
        </p>
      </div>
    );
  }

  switch (role) {
    case "owner":
    case "seller":
      return Loadable(SellerDashboardPage);
    case "agent":
      return Loadable(AgentDashboardPage);
    case "admin":
      return Loadable(AdminDashboardPage);
    case "super_admin":
      return Loadable(ManagementDashboardPage);
    case "customer":
      return Loadable(CustomerMarketplacePage);
    default:
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-7 text-center relative overflow-hidden"
          >
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600" />

            {/* Header Icon */}
            <div className="flex justify-center pt-2">
              <div className="h-20 w-20 rounded-3xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ShieldAlert className="w-10 h-10" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Permission Notice
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Unrecognized Account Role
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto">
                We could not determine your access permissions for role:{" "}
                <strong className="text-slate-900 font-mono px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200">
                  {role || "Unassigned"}
                </strong>
                . This can occur during initial profile setup or temporary session sync delays.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Retry Sync Button */}
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-4 text-xs shadow-lg shadow-fuchsia-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
                  <span>{retrying ? "Syncing..." : "Retry Sync"}</span>
                </button>

                {/* Reload Session Button */}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 text-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Refresh Session</span>
                </button>
              </div>

              {/* Sign Out / Return to Login Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-3.5 text-xs shadow-xl shadow-slate-900/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out & Return to Login</span>
              </button>
            </div>
          </motion.div>
        </div>
      );
  }
}