import { lazy, Suspense } from "react";
import { useAuthContext } from "@/context/AuthContext";

const SellerDashboardPage = lazy(() => import("@/features/seller/pages/SellerDashboardPage"));
const AgentDashboardPage = lazy(() => import("./pages/AgentDashboardPage"));
const AdminDashboardPage = lazy(() => import("@/features/admin/pages/AdminDashboardPage"));
const ManagementDashboardPage = lazy(() => import("./pages/ManagementDashboardPage"));
const CustomerMarketplacePage = lazy(() => import("./pages/CustomerMarketplacePage"));

const Loadable = (Component) => (
  <Suspense fallback={
    <div className="min-h-[400px] flex items-center justify-center text-slate-600">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-650" />
    </div>
  }>
    <Component />
  </Suspense>
);

export default function DashboardPage() {
  const { role } = useAuthContext();

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
        <div className="p-8 text-center text-slate-600 font-semibold bg-white rounded-3xl border border-slate-100 shadow-sm">
          Unauthorized or unrecognized user role: "{role || "None"}".
        </div>
      );
  }
}