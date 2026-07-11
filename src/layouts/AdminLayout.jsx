
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
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin", badge: null },
  { title: "Organizations", icon: Store, path: "/admin/organizations", badge: null },
  { title: "Org Admins", icon: ShieldAlert, path: "/admin/org-admins", badge: null },
  { title: "Platform Users", icon: Users, path: "/admin/users", badge: null },
  { title: "Subscriptions", icon: CreditCard, path: "/admin/subscriptions", badge: null },
  { title: "Widgets", icon: Sliders, path: "/admin/widgets", badge: null },
  { title: "Live Calls", icon: Video, path: "/admin/calls", badge: "Live" },
  { title: "Platform Analytics", icon: BarChart3, path: "/admin/analytics", badge: null },
  { title: "Support Center", icon: LifeBuoy, path: "/admin/support", badge: null },
  { title: "Notifications", icon: Bell, path: "/admin/notifications", badge: null },
  { title: "Audit Logs", icon: FileText, path: "/admin/audit", badge: null },
  { title: "Developer", icon: Code, path: "/admin/developer", badge: null },
  { title: "System Health", icon: Activity, path: "/admin/health", badge: null },
  { title: "Settings", icon: Settings, path: "/admin/settings", badge: null },
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

  if (profile?.role !== "admin") {
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
      workspaceName="BridgeOne HQ"
      workspaces={[{ name: "BridgeOne HQ" }, { name: "BridgeOne Sandbox" }]}
      baseRoute="/admin"
      marketplaceRoute="/"
    />
  );
}
