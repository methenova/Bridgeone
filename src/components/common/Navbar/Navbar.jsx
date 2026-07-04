import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, LogOut, LayoutDashboard, Package, ChevronDown } from "lucide-react";

import { Container } from "../Container";
import CartDrawer from "@/features/cart/components/CartDrawer";
import useCartStore from "@/store/cartStore";
import { useAuthContext } from "@/context/AuthContext";
import NotificationsDropdown from "@/components/common/Notifications/NotificationsDropdown";

export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const { user, profile, logout, isAuthenticated } = useAuthContext();
  const itemCount = useCartStore((s) => s.itemCount);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }

  async function handleLogout() {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  }

  const navLinks = [
    { to: "/", label: "Home", end: true },
    { to: "/products", label: "Products" },
    { to: "/shops", label: "Shops" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                B
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-none text-white">BridgeOne</p>
                <p className="text-[10px] text-slate-500">Live Commerce</p>
              </div>
            </Link>

            {/* Nav Links — desktop */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600/15 text-blue-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden flex-1 lg:block" style={{ maxWidth: 360 }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, shops..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <NotificationsDropdown />
              )}

              {/* User */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
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
                      <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
                        <div className="border-b border-slate-800 px-4 py-3">
                          <p className="truncate text-sm font-medium text-white">
                            {profile?.full_name || "My Account"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user?.email}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/seller"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Seller Dashboard
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                          >
                            <Heart className="h-4 w-4" />
                            Wishlist
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                          >
                            <Package className="h-4 w-4" />
                            My Orders
                          </Link>
                        </div>

                        <div className="border-t border-slate-800 py-1">
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
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="rounded-xl border border-slate-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

            </div>
          </div>
        </Container>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}