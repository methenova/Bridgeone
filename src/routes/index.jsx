/* eslint-disable react/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { RoleSettingsPage, RoleCallsPage, RoleAnalyticsPage, RoleNotificationsPage } from "@/routes/RoleRouter";

import ErrorBoundary from "@/components/common/ErrorBoundary";

// Loadable utility wrapper
const Loadable = (Component) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    }>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// Layouts
import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import OnboardingLayout from "@/features/onboarding/components/OnboardingLayout";

// Landing
import LandingPage from "@/features/landing/LandingPage";

// Dashboard Selector
import DashboardPage from "@/features/dashboard/DashboardPage";

// Lazy Load Auth Pages
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/features/auth/pages/VerifyEmailPage"));

// Lazy Load Seller Pages
const MyShopPage = lazy(() => import("@/features/seller/pages/MyShopPage"));
const ProductsPage = lazy(() => import("@/features/seller/pages/ProductsPage"));
const OrdersPage = lazy(() => import("@/features/seller/pages/OrdersPage"));
const AnalyticsPage = lazy(() => import("@/features/seller/pages/AnalyticsPage"));

// Lazy Load Seller Pages
const LivePage = lazy(() => import("@/features/seller/pages/LivePage"));
const ChatInboxPage = lazy(() => import("@/features/seller/pages/ChatInboxPage"));
const CustomersPage = lazy(() => import("@/features/seller/pages/CustomersPage"));
const SettingsPage = lazy(() => import("@/features/seller/pages/SettingsPage"));
const WidgetPage = lazy(() => import("@/features/chat/pages/WidgetPage"));
const CallHistoryPage = lazy(() => import("@/features/seller/pages/CallHistoryPage"));
const CallbacksPage = lazy(() => import("@/features/seller/pages/CallbacksPage"));
const SellerAgentsPage = lazy(() => import("@/features/seller/pages/SellerAgentsPage"));
const SellerWidgetPage = lazy(() => import("@/features/seller/pages/SellerWidgetPage"));
const SellerNotificationsPage = lazy(() => import("@/features/seller/pages/SellerNotificationsPage"));
const SellerIntegrationsPage = lazy(() => import("@/features/seller/pages/SellerIntegrationsPage"));
const OnboardingProfilePage = lazy(() => import("@/features/onboarding/pages/OnboardingProfilePage"));
const OnboardingBusinessPage = lazy(() => import("@/features/onboarding/pages/OnboardingBusinessPage"));
const OnboardingWorkspacePage = lazy(() => import("@/features/onboarding/pages/OnboardingWorkspacePage"));
const OnboardingSubscriptionPage = lazy(() => import("@/features/onboarding/pages/OnboardingSubscriptionPage"));
const OnboardingCompletePage = lazy(() => import("@/features/onboarding/pages/OnboardingCompletePage"));
const CheckoutPage = lazy(() => import("@/features/checkout/pages/CheckoutPage"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/features/auth/pages/ResetPasswordPage"));

// Lazy Load Admin Pages
const AdminDashboardPage = lazy(() => import("@/features/admin/pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/features/admin/pages/AdminUsersPage"));
const AdminOrganizationsPage = lazy(() => import("@/features/admin/pages/AdminOrganizationsPage"));
const AdminOrgAdminsPage = lazy(() => import("@/features/admin/pages/AdminOrgAdminsPage"));
const AdminSubscriptionsPage = lazy(() => import("@/features/admin/pages/AdminSubscriptionsPage"));
const AdminWidgetsPage = lazy(() => import("@/features/admin/pages/AdminWidgetsPage"));
const AdminAnalyticsPage = lazy(() => import("@/features/admin/pages/AdminAnalyticsPage"));
const AdminSupportPage = lazy(() => import("@/features/admin/pages/AdminSupportPage"));
const AdminNotificationsPage = lazy(() => import("@/features/admin/pages/AdminNotificationsPage"));
const AdminAuditLogsPage = lazy(() => import("@/features/admin/pages/AdminAuditLogsPage"));
const AdminDeveloperPage = lazy(() => import("@/features/admin/pages/AdminDeveloperPage"));
const AdminSystemHealthPage = lazy(() => import("@/features/admin/pages/AdminSystemHealthPage"));
const AdminCallsPage = lazy(() => import("@/features/admin/pages/AdminCallsPage"));
const AdminSettingsPage = lazy(() => import("@/features/admin/pages/AdminSettingsPage"));

const router = createBrowserRouter([
  // ============================================
  // Public Routes
  // ============================================
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
    ],
  },
  {
    path: "/checkout",
    element: Loadable(CheckoutPage),
  },

  // ============================================
  // Authentication
  // ============================================
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: Loadable(LoginPage),
      },
    ],
  },
  {
    path: "/register",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: Loadable(RegisterPage),
      },
    ],
  },
  {
    path: "/verify-email",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: Loadable(VerifyEmailPage),
      },
    ],
  },
  {
    path: "/forgot-password",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: Loadable(ForgotPasswordPage),
      },
    ],
  },
  {
    path: "/reset-password",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: Loadable(ResetPasswordPage),
      },
    ],
  },

  // ============================================
  // Onboarding System (Protected Layout & Middleware)
  // ============================================
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "profile",
        element: Loadable(OnboardingProfilePage),
      },
      {
        path: "business",
        element: Loadable(OnboardingBusinessPage),
      },
      {
        path: "workspace",
        element: Loadable(OnboardingWorkspacePage),
      },
      {
        path: "subscription",
        element: Loadable(OnboardingSubscriptionPage),
      },
      {
        path: "complete",
        element: Loadable(OnboardingCompletePage),
      },
      {
        path: "installation",
        element: Loadable(OnboardingCompletePage),
      },
    ],
  },

  // ============================================
  // Consolidated Dashboard System (Protected & Role-Based Guarded)
  // ============================================
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      // Central dynamic role dashboard routing page
      {
        index: true,
        element: <DashboardPage />,
      },

      // ── Owner-Only Routes ──────────────────────────
      {
        path: "shop",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller"]}>
            {Loadable(MyShopPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "products",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller"]}>
            {Loadable(ProductsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller"]}>
            <RoleAnalyticsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "agents",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller"]}>
            {Loadable(SellerAgentsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "widget",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller"]}>
            {Loadable(SellerWidgetPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller"]}>
            <RoleNotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "integrations",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller"]}>
            {Loadable(SellerIntegrationsPage)}
          </ProtectedRoute>
        ),
      },

      // ── Shared Owner & Agent Routes ───────────────
      {
        path: "profile",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            {Loadable(MyShopPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            {Loadable(OrdersPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "live",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            {Loadable(LivePage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "chat",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            {Loadable(ChatInboxPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            {Loadable(CustomersPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            <RoleSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "calls",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            <RoleCallsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "callbacks",
        element: (
          <ProtectedRoute allowedRoles={["owner", "seller", "agent"]}>
            {Loadable(CallbacksPage)}
          </ProtectedRoute>
        ),
      },

      // ── Admin & Super Admin Routes ─────────────────
      {
        path: "organizations",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminOrganizationsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "org-admins",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminOrgAdminsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminUsersPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "subscriptions",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminSubscriptionsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "widgets",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminWidgetsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "support",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminSupportPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "audit",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminAuditLogsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "developer",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminDeveloperPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "health",
        element: (
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            {Loadable(AdminSystemHealthPage)}
          </ProtectedRoute>
        ),
      },

    ],
  },

  // ============================================
  // Widget (Embeddable, public)
  // ============================================
  {
    path: "/widget/:shopId",
    element: Loadable(WidgetPage),
  },

  // ============================================
  // Catch-all — redirect to home / dashboard
  // ============================================
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;