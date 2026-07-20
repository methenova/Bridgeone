import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, ChevronDown, Shield, Menu, X } from "lucide-react";

import { Container } from "../Container";
import { useAuthContext } from "@/context/AuthContext";
import NotificationsDropdown from "@/components/common/Notifications/NotificationsDropdown";

export default function Navbar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout, isAuthenticated } = useAuthContext();

  const isLanding = location.pathname === "/";

  // Detect scroll for glass intensity change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  }

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#integrations", label: "Integrations" },
  ];

  return (
    <header
      className={`fixed top-3 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl transition-all duration-500 ease-out ${
        scrolled
          ? "bg-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] border border-white/50"
          : "bg-white/40 border border-white/30"
      }`}
      style={{
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(12px) saturate(150%)",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(12px) saturate(150%)",
      }}
    >
      {/* Glass shine line at top */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      <Container>
        <div className="flex h-12 items-center justify-between gap-4 px-2">

          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-shadow group-hover:shadow-lg group-hover:shadow-blue-500/30">
              B
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-bold leading-none text-slate-800 tracking-tight">BridgeOne</p>
              <p className="text-[10px] text-slate-400 font-medium">Live Communication Platform</p>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-3.5 py-1.5 text-[13px] font-medium text-slate-500 rounded-lg transition-all duration-200 hover:text-slate-900 hover:bg-slate-900/[0.04]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {isAuthenticated ? (
              <>
                <NotificationsDropdown />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 backdrop-blur-sm px-3 py-1.5 text-sm text-slate-700 transition-all duration-200 hover:bg-white/80 hover:border-slate-300/60 hover:shadow-sm"
                  >
                    <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white">
                      {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden max-w-[80px] truncate sm:block text-[13px] font-medium">
                      {profile?.full_name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      {/* Glassmorphic dropdown */}
                      <div
                        className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]"
                        style={{
                          background: "rgba(255, 255, 255, 0.75)",
                          backdropFilter: "blur(24px) saturate(180%)",
                          WebkitBackdropFilter: "blur(24px) saturate(180%)",
                        }}
                      >
                        {/* Glass top shine */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

                        <div className="border-b border-slate-200/40 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {profile?.full_name || "My Account"}
                          </p>
                          <p className="truncate text-xs text-slate-400">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          {profile?.role === "admin" && (
                            <Link
                              to="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-white/60 hover:text-slate-900"
                            >
                              <Shield className="h-4 w-4" />
                              Admin Panel
                            </Link>
                          )}
                          {(profile?.role === "seller" || profile?.role === "admin") && (
                            <Link
                              to="/seller"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-white/60 hover:text-slate-900"
                            >
                              <LayoutDashboard className="h-4 w-4" />
                              Seller Dashboard
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-200/40 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-all duration-150 hover:bg-red-50/50 hover:text-red-500"
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
                  className="rounded-xl px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-slate-900 hover:bg-slate-900/[0.04]"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-400 hover:to-blue-500"
                >
                  Get Started Free
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-900/[0.04] transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu (glassmorphic) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-white/30 py-3 px-4"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-white/60 hover:text-slate-900 transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}