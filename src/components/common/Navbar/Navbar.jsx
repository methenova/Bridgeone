import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, ChevronDown, Shield } from "lucide-react";

import { Container } from "../Container";
import { useAuthContext } from "@/context/AuthContext";
import NotificationsDropdown from "@/components/common/Notifications/NotificationsDropdown";

export default function Navbar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, logout, isAuthenticated } = useAuthContext();

  async function handleLogout() {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md">
              B
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none text-slate-900">BridgeOne</p>
              <p className="text-[10px] text-slate-500">Live Video Selling</p>
            </div>
          </Link>

          {/* Center Navigation Menu (mockup structure) */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              About
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationsDropdown />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                  >
                    <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-bold text-white">
                      {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden max-w-[80px] truncate sm:block">
                      {profile?.full_name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {profile?.full_name || "My Account"}
                          </p>
                          <p className="truncate text-xs text-slate-500">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          {profile?.role === "admin" && (
                            <Link
                              to="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Shield className="h-4 w-4" />
                              Admin Panel
                            </Link>
                          )}
                          {(profile?.role === "seller" || profile?.role === "admin") && (
                            <Link
                              to="/seller"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                              <LayoutDashboard className="h-4 w-4" />
                              Seller Dashboard
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-200 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm"
                >
                  Get Started Free
                </Link>
              </div>
            )}

          </div>
        </div>
      </Container>
    </header>
  );
}