/**
 * Role-aware route wrappers for paths shared between seller and admin.
 * 
 * React Router v6 cannot have duplicate sibling paths, so these components
 * inspect the user's role and render the correct page — same pattern as DashboardPage.
 */
import { lazy, Suspense } from "react";
import { useAuthContext } from "@/context/AuthContext";

const Loadable = (Component) => (
  <Suspense fallback={
    <div className="min-h-[400px] flex items-center justify-center text-slate-600">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  }>
    <Component />
  </Suspense>
);

// Lazy imports — seller
const SettingsPage = lazy(() => import("@/features/seller/pages/SettingsPage"));
const CallHistoryPage = lazy(() => import("@/features/seller/pages/CallHistoryPage"));
const AnalyticsPage = lazy(() => import("@/features/seller/pages/AnalyticsPage"));
const SellerNotificationsPage = lazy(() => import("@/features/seller/pages/SellerNotificationsPage"));

// Lazy imports — admin
const AdminSettingsPage = lazy(() => import("@/features/admin/pages/AdminSettingsPage"));
const AdminCallsPage = lazy(() => import("@/features/admin/pages/AdminCallsPage"));
const AdminAnalyticsPage = lazy(() => import("@/features/admin/pages/AdminAnalyticsPage"));
const AdminNotificationsPage = lazy(() => import("@/features/admin/pages/AdminNotificationsPage"));

// ── Settings (/dashboard/settings) ──────────────────────────
export function RoleSettingsPage() {
  const { role } = useAuthContext();
  if (role === "admin" || role === "super_admin") return Loadable(AdminSettingsPage);
  return Loadable(SettingsPage);
}

// ── Calls (/dashboard/calls) ────────────────────────────────
export function RoleCallsPage() {
  const { role } = useAuthContext();
  if (role === "admin" || role === "super_admin") return Loadable(AdminCallsPage);
  return Loadable(CallHistoryPage);
}

// ── Analytics (/dashboard/analytics) ────────────────────────
export function RoleAnalyticsPage() {
  const { role } = useAuthContext();
  if (role === "admin" || role === "super_admin") return Loadable(AdminAnalyticsPage);
  return Loadable(AnalyticsPage);
}

// ── Notifications (/dashboard/notifications) ────────────────
export function RoleNotificationsPage() {
  const { role } = useAuthContext();
  if (role === "admin" || role === "super_admin") return Loadable(AdminNotificationsPage);
  return Loadable(SellerNotificationsPage);
}
