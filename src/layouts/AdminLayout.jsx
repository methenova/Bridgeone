import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  FolderTree,
  ShoppingBag,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

import { useAuthContext } from "@/context/AuthContext";

const menu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { title: "Users", icon: Users, path: "/admin/users" },
  { title: "Shops", icon: Store, path: "/admin/shops" },
  { title: "Products", icon: Package, path: "/admin/products" },
  { title: "Categories", icon: FolderTree, path: "/admin/categories" },
  { title: "Orders", icon: ShoppingBag, path: "/admin/orders" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

export default function AdminLayout() {
  const { profile, logout } = useAuthContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      
      {/* ── Left Sidebar (Desktop) ────────────────────── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-900 bg-slate-950 md:flex">
        
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-900 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            B
          </div>
          <div>
            <p className="text-sm font-bold text-white">BridgeOne</p>
            <p className="text-[10px] text-slate-500">Admin Control Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          {menu.map((item) => (
            <NavLink
              key={item.title}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile / Logout bottom */}
        <div className="border-t border-slate-900 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>

      </aside>

      {/* ── Mobile Sidebar Drawer ──────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-900 bg-slate-950 p-4 md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">B</div>
                <span className="font-bold text-white text-sm">BridgeOne Admin</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {menu.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* ── Right Content ────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        
        {/* Header bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950/60 px-6 backdrop-blur-md sticky top-0 z-30">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <Link
              to="/"
              className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-white transition-colors md:flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Marketplace
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white"
            >
              <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {(profile?.full_name || "A").charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate">
                {profile?.full_name || "Administrator"}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl z-20">
                  <div className="px-4 py-2 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                    My Account
                  </div>
                  <Link
                    to="/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Go to Portal
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 border-t border-slate-800"
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>

        </header>

        {/* Body View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
