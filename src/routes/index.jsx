/* eslint-disable react/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";

// Loadable utility wrapper
const Loadable = (Component) => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  }>
    <Component />
  </Suspense>
);

// Layouts
import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import SellerLayout from "@/layouts/SellerLayout";

// Landing
import LandingPage from "@/features/landing/pages/LandingPage";

// Authentication
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

// Dashboard
import DashboardPage from "@/features/dashboard/DashboardPage";

// Shop
import ShopListingPage from "@/features/shop/pages/ShopListingPage";
import ShopProfilePage from "@/features/shop/pages/ShopProfilePage";

// Seller
import SellerDashboardPage from "@/features/seller/pages/SellerDashboardPage";
import MyShopPage from "@/features/seller/pages/MyShopPage";
import ProductsPage from "@/features/seller/pages/ProductsPage";
import OrdersPage from "@/features/seller/pages/OrdersPage";
import AnalyticsPage from "@/features/seller/pages/AnalyticsPage";

// Marketplace — Customer
import MarketplacePage from "@/features/customer/pages/MarketplacePage";
import ProductDetailPage from "@/features/customer/pages/ProductDetailPage";
import SearchPage from "@/features/customer/pages/SearchPage";
import WishlistPage from "@/features/customer/pages/WishlistPage";
import CustomerOrdersPage from "@/features/customer/pages/CustomerOrdersPage";
import CustomerOrderDetailPage from "@/features/customer/pages/CustomerOrderDetailPage";
// Lazy Load Pages
const WatchLivePage = lazy(() => import("@/features/customer/pages/WatchLivePage"));
const LivePage = lazy(() => import("@/features/seller/pages/LivePage"));
const ChatInboxPage = lazy(() => import("@/features/seller/pages/ChatInboxPage"));
const CheckoutPage = lazy(() => import("@/features/checkout/pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("@/features/checkout/pages/OrderSuccessPage"));
const CustomersPage = lazy(() => import("@/features/seller/pages/CustomersPage"));
const SettingsPage = lazy(() => import("@/features/seller/pages/SettingsPage"));
const WidgetPage = lazy(() => import("@/features/chat/pages/WidgetPage"));
const CallHistoryPage = lazy(() => import("@/features/seller/pages/CallHistoryPage"));
const CallbacksPage = lazy(() => import("@/features/seller/pages/CallbacksPage"));

const SellerAgentsPage = lazy(() => import("@/features/seller/pages/SellerAgentsPage"));
const SellerWidgetPage = lazy(() => import("@/features/seller/pages/SellerWidgetPage"));
const SellerNotificationsPage = lazy(() => import("@/features/seller/pages/SellerNotificationsPage"));
const SellerIntegrationsPage = lazy(() => import("@/features/seller/pages/SellerIntegrationsPage"));

const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
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
      {
        path: "shops",
        element: <ShopListingPage />,
      },
      {
        path: "shops/:shopId",
        element: <ShopProfilePage />,
      },
      {
        path: "products",
        element: <MarketplacePage />,
      },
      {
        path: "products/:productId",
        element: <ProductDetailPage />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "live/:shopId",
        element: Loadable(WatchLivePage),
      },
    ],
  },

  // ============================================
  // Protected Customer Routes
  // ============================================
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <PublicLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "wishlist",
        element: <WishlistPage />,
      },
      {
        path: "orders",
        element: <CustomerOrdersPage />,
      },
      {
        path: "orders/:orderId",
        element: <CustomerOrderDetailPage />,
      },
      {
        path: "checkout",
        element: Loadable(CheckoutPage),
      },
      {
        path: "checkout/success",
        element: Loadable(OrderSuccessPage),
      },
    ],
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
        element: <LoginPage />,
      },
    ],
  },

  {
    path: "/register",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <RegisterPage />,
      },
    ],
  },

  // ============================================
  // Dashboard (Protected)
  // ============================================
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },

  // ============================================
  // Seller Dashboard (Protected)
  // ============================================
  {
    path: "/seller",
    element: (
      <ProtectedRoute>
        <SellerLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SellerDashboardPage />,
      },
      {
        path: "shop",
        element: <MyShopPage />,
      },
      {
        path: "profile",
        element: <MyShopPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "live",
        element: Loadable(LivePage),
      },
      {
        path: "chat",
        element: Loadable(ChatInboxPage),
      },
      {
        path: "customers",
        element: Loadable(CustomersPage),
      },
      {
        path: "settings",
        element: Loadable(SettingsPage),
      },
      {
        path: "calls",
        element: Loadable(CallHistoryPage),
      },
      {
        path: "callbacks",
        element: Loadable(CallbacksPage),
      },
      {
        path: "agents",
        element: Loadable(SellerAgentsPage),
      },
      {
        path: "widget",
        element: Loadable(SellerWidgetPage),
      },
      {
        path: "notifications",
        element: Loadable(SellerNotificationsPage),
      },
      {
        path: "integrations",
        element: Loadable(SellerIntegrationsPage),
      },
    ],
  },

  // ============================================
  // Admin Panel (Protected)
  // ============================================
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        {Loadable(AdminLayout)}
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: Loadable(AdminDashboardPage),
      },
      {
        path: "organizations",
        element: Loadable(AdminOrganizationsPage),
      },
      {
        path: "org-admins",
        element: Loadable(AdminOrgAdminsPage),
      },
      {
        path: "users",
        element: Loadable(AdminUsersPage),
      },
      {
        path: "subscriptions",
        element: Loadable(AdminSubscriptionsPage),
      },
      {
        path: "widgets",
        element: Loadable(AdminWidgetsPage),
      },
      {
        path: "calls",
        element: Loadable(AdminCallsPage),
      },
      {
        path: "analytics",
        element: Loadable(AdminAnalyticsPage),
      },
      {
        path: "support",
        element: Loadable(AdminSupportPage),
      },
      {
        path: "notifications",
        element: Loadable(AdminNotificationsPage),
      },
      {
        path: "audit",
        element: Loadable(AdminAuditLogsPage),
      },
      {
        path: "developer",
        element: Loadable(AdminDeveloperPage),
      },
      {
        path: "health",
        element: Loadable(AdminSystemHealthPage),
      },
      {
        path: "settings",
        element: Loadable(AdminSettingsPage),
      },
    ],
  },
  {
    path: "/widget/:shopId",
    element: Loadable(WidgetPage),
  },
]);

export default router;