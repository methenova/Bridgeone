import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
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
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuthContext } from "@/context/AuthContext";

const menu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin", badge: null },
  { title: "Users", icon: Users, path: "/admin/users", badge: null },
  { title: "Shops", icon: Store, path: "/admin/shops", badge: "2" },
  { title: "Products", icon: Package, path: "/admin/products", badge: null },
  { title: "Categories", icon: FolderTree, path: "/admin/categories", badge: null },
  { title: "Live Calls", icon: Video, path: "/admin/calls", badge: "Live" },
  { title: "Orders", icon: ShoppingBag, path: "/admin/orders", badge: "New" },
  { title: "Settings", icon: Settings, path: "/admin/settings", badge: null },
];

export default function AdminLayout() {
  const { profile, loading, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("admin-sidebar-collapsed") === "true";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Command Palette Search State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Workspace Swapper
  const [workspace, setWorkspace] = useState("BridgeOne HQ");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Sync sidebar collapse state
  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Keyboard shortcut listener for Ctrl+K command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setWorkspaceOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter menu items for Command Palette search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return menu;
    return menu.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle Command Palette keys
  const handleCommandKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[selectedIndex]) {
        navigate(filteredOptions[selectedIndex].path);
        setCommandPaletteOpen(false);
        setSearchQuery("");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-blue-500" />
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

  // Generate dynamic breadcrumbs
  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const path = `/${pathParts.slice(0, index + 1).join("/")}`;
    const title = part.charAt(0).toUpperCase() + part.slice(1);
    return { title, path };
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* ── Left Sidebar (Desktop) ────────────────────── */}
      <aside 
        className={`hidden shrink-0 flex-col border-r border-slate-900 bg-slate-950 transition-all duration-300 md:flex ${
          sidebarCollapsed ? "w-[68px]" : "w-64"
        }`}
      >
        
        {/* Workspace Logo & Switcher */}
        <div className="flex h-16 items-center justify-between border-b border-slate-900 px-4 relative shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-black text-white shrink-0 shadow-lg shadow-blue-500/10">
              B
            </div>
            {!sidebarCollapsed && (
              <button 
                onClick={() => setWorkspaceOpen(!workspaceOpen)}
                className="flex items-center gap-1.5 text-sm font-bold text-white text-left truncate group"
              >
                <span className="truncate">{workspace}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
              </button>
            )}
          </div>

          {!sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(true)}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Workspace Dropdown */}
          <AnimatePresence>
            {workspaceOpen && !sidebarCollapsed && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setWorkspaceOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-4 right-4 top-14 rounded-xl border border-slate-850 bg-slate-900 p-1.5 shadow-2xl z-30 space-y-1"
                >
                  <button 
                    onClick={() => { setWorkspace("BridgeOne HQ"); setWorkspaceOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>BridgeOne HQ</span>
                    {workspace === "BridgeOne HQ" && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </button>
                  <button 
                    onClick={() => { setWorkspace("BridgeOne Sandbox"); setWorkspaceOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>BridgeOne Sandbox</span>
                    {workspace === "BridgeOne Sandbox" && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsed Expand Trigger */}
        {sidebarCollapsed && (
          <div className="py-4 flex justify-center shrink-0">
            <button 
              onClick={() => setSidebarCollapsed(false)}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-none">
          {menu.map((item) => (
            <NavLink
              key={item.title}
              to={item.path}
              end={item.path === "/admin"}
              title={sidebarCollapsed ? item.title : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all relative ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-slate-400 hover:bg-slate-900/50 hover:text-white"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="truncate flex-1">{item.title}</span>}
              {!sidebarCollapsed && item.badge && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Settings & Bottom Profile Summary */}
        <div className="border-t border-slate-900 p-3 shrink-0 space-y-2">
          
          {/* Quick Settings (Collapsed Icon or Full Text) */}
          <Link 
            to="/admin/settings"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Preferences</span>}
          </Link>

          {/* User Widget */}
          <div className="flex items-center justify-between bg-slate-900/40 border border-slate-900 rounded-2xl p-2 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-[11px] text-white">
                {(profile?.full_name || "A").charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-none">
                    {profile?.full_name || "Administrator"}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate mt-0.5 leading-none">
                    {profile?.role || "admin"}
                  </p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button 
                onClick={handleLogout}
                title="Logout"
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </div>

      </aside>

      {/* ── Mobile Sidebar Drawer ──────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-900 bg-slate-950 p-4 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg">B</div>
                  <span className="font-extrabold text-white text-sm">BridgeOne Admin</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5">
                {menu.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.path}
                    end={item.path === "/admin"}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="border-t border-slate-900 pt-4">
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Right Content ────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        
        {/* Sticky Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950 px-6 backdrop-blur-md sticky top-0 z-30">
          
          {/* Breadcrumbs & Title */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-900 bg-slate-950 text-slate-400 hover:text-white md:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Breadcrumb Navigator */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.path} className="flex items-center gap-1.5">
                  <span className="text-slate-700">/</span>
                  <Link 
                    to={crumb.path} 
                    className={`transition-colors ${idx === breadcrumbs.length - 1 ? "text-slate-300 font-bold" : "hover:text-white"}`}
                  >
                    {crumb.title}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Connections */}
          <div className="flex items-center gap-4">
            
            {/* Realtime Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-900 text-[10px] font-bold text-slate-400 tracking-wider">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="hidden sm:inline">Supabase Connected</span>
              <span className="sm:hidden">Live</span>
            </div>

            {/* Global search launcher */}
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="flex h-9 items-center gap-2.5 rounded-xl border border-slate-900 bg-slate-950 px-3.5 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-800 hover:bg-slate-900/20 transition-all select-none"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded bg-slate-900 border border-slate-850 px-1.5 font-mono text-[9px] font-bold text-slate-650">
                <span>Ctrl</span><span>K</span>
              </kbd>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/40 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-800 hover:text-white transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-blue-600 font-extrabold text-[10px] text-white shrink-0">
                  {(profile?.full_name || "A").charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {profile?.full_name || "Administrator"}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-slate-850 bg-slate-900 shadow-2xl z-20"
                    >
                      <div className="px-4 py-2 border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        My Account
                      </div>
                      <Link
                        to="/"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Zap className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        Go to Marketplace
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 border-t border-slate-850 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5 shrink-0" />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>

        </header>

        {/* Body View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>

      </div>

      {/* ── Command Palette (Modal Dialog) ──────────────────────── */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-850 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[400px]"
            >
              {/* Search bar header */}
              <div className="flex items-center gap-3 border-b border-slate-850 px-4 py-3">
                <Search className="h-4.5 w-4.5 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type a page name or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleCommandKeyDown}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
                <kbd className="inline-flex items-center gap-0.5 rounded bg-slate-950 border border-slate-800 px-1.5 font-mono text-[9px] text-slate-500">
                  <span>esc</span>
                </kbd>
              </div>

              {/* Options list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {filteredOptions.map((option, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={option.title}
                      onClick={() => {
                        navigate(option.path);
                        setCommandPaletteOpen(false);
                        setSearchQuery("");
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-blue-600 text-white" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <option.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1">{option.title}</span>
                      {isSelected && (
                        <span className="text-[10px] opacity-70 flex items-center gap-1 font-mono">
                          <span>Enter</span>
                        </span>
                      )}
                    </div>
                  );
                })}

                {filteredOptions.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500 font-semibold flex flex-col items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-slate-650" />
                    No pages matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="border-t border-slate-850 px-4 py-2.5 bg-slate-950/40 text-[9px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>↑↓ Nav</span>
                  <span>↵ Select</span>
                </span>
                <span>Command Palette</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline useMemo implementation to prevent lint dependencies or react version limits
import { useMemo } from "react";
