import { useAuthContext } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import PremiumLayout from "./components/PremiumLayout";
import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Sliders,
  Video,
  BarChart3,
  LifeBuoy,
  Bell,
  FileText,
  Code,
  Activity,
  Settings,
  ShieldAlert
} from "lucide-react";

const menu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", badge: null },
  { title: "Stores & Shops", icon: Store, path: "/dashboard/shops", badge: null },
  { title: "Platform Users", icon: Users, path: "/dashboard/users", badge: null },
  { title: "Subscriptions", icon: CreditCard, path: "/dashboard/subscriptions", badge: null },
  { title: "Widgets", icon: Sliders, path: "/dashboard/widgets", badge: null },
  { title: "Live Calls", icon: Video, path: "/dashboard/calls", badge: "Live" },
  { title: "Platform Analytics", icon: BarChart3, path: "/dashboard/analytics", badge: null },
  { title: "Support Center", icon: LifeBuoy, path: "/dashboard/support", badge: null },
  { title: "Notifications", icon: Bell, path: "/dashboard/notifications", badge: null },
  { title: "Audit Logs", icon: FileText, path: "/dashboard/audit", badge: null },
  { title: "Developer", icon: Code, path: "/dashboard/developer", badge: null },
  { title: "System Health", icon: Activity, path: "/dashboard/health", badge: null },
  { title: "Settings", icon: Settings, path: "/dashboard/settings", badge: null },
];

export default function AdminLayout() {
  const { profile, loading, logout } = useAuthContext();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <span className="mt-3 text-xs uppercase tracking-widest font-bold">Verifying Access...</span>
      </div>
    );
  }

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <PremiumLayout
      menuItems={menu}
      profile={profile}
      onLogout={handleLogout}
      workspaceName="BridgeOne"
      baseRoute="/dashboard"
      marketplaceRoute="/"
    />
  );
}
