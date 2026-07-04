/* eslint-disable react/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";

// Loadable utility wrapper
const Loadable = (Component) => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
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

const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/features/admin/pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/features/admin/pages/AdminUsersPage"));
const AdminShopsPage = lazy(() => import("@/features/admin/pages/AdminShopsPage"));
const AdminProductsPage = lazy(() => import("@/features/admin/pages/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("@/features/admin/pages/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("@/features/admin/pages/AdminOrdersPage"));
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
        path: "users",
        element: Loadable(AdminUsersPage),
      },
      {
        path: "shops",
        element: Loadable(AdminShopsPage),
      },
      {
        path: "products",
        element: Loadable(AdminProductsPage),
      },
      {
        path: "categories",
        element: Loadable(AdminCategoriesPage),
      },
      {
        path: "orders",
        element: Loadable(AdminOrdersPage),
      },
      {
        path: "settings",
        element: Loadable(AdminSettingsPage),
      },
    ],
  },
]);

export default router;