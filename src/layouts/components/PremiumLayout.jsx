import { useState, useEffect, useMemo } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, LogOut, ChevronDown, Search, Zap, ChevronLeft, ChevronRight, Settings, Bell, ZapOff
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/config/supabase";
import toast from "react-hot-toast";
import NotificationDrawer from "./NotificationDrawer";

export default function PremiumLayout({ 
  menuItems = [], 
  profile, 
  onLogout,
  workspaceName = "Workspace",
  workspaces = [], // [{name: 'HQ'}, {name: 'Sandbox'}]
  onWorkspaceChange,
  baseRoute = "/admin",
  marketplaceRoute = "/"
}) {
  const handleLogout = onLogout;
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
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Notification Drawer
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

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
    if (!searchQuery.trim()) return menuItems;
    return menuItems.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, menuItems]);

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

  

  // Generate dynamic breadcrumbs
  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const path = `/${pathParts.slice(0, index + 1).join("/")}`;
    // Map base route to 'Dashboard' to avoid duplicates like 'Admin / Admin'
    const title = path === baseRoute ? "Dashboard" : part.charAt(0).toUpperCase() + part.slice(1);
    return { title, path };
  });

  return (
    <div className="admin-theme flex min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-blue-600/30 selection:text-blue-200 p-4 gap-4">
      
      {/* ── Left Sidebar (Desktop) ────────────────────── */}
      <div className="relative hidden md:flex shrink-0">
        <aside 
          className={`flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 overflow-hidden relative ${
            sidebarCollapsed ? "w-[68px]" : "w-64"
          }`}
        >
          
          {/* Logo & Name */}
          <div className={`flex h-16 items-center ${sidebarCollapsed ? "justify-center" : "justify-between px-4"} border-b border-slate-100 relative shrink-0`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-black text-white shrink-0 shadow-lg shadow-blue-500/10">
                B
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-bold text-slate-900 truncate">{workspaceName}</span>
              )}
            </div>

            {!sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(true)}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-none">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.path}
              end={item.path === baseRoute}
              title={sidebarCollapsed ? item.title : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 relative group overflow-hidden ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                    />
                  )}
                  <item.icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {!sidebarCollapsed && (
                    <span className="truncate flex-1 transition-transform duration-200 group-hover:translate-x-0.5">
                      {item.title}
                    </span>
                  )}
                  {!sidebarCollapsed && item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 shadow-sm shrink-0">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Settings & Bottom Profile Summary */}
        <div className="border-t border-slate-100 p-3 shrink-0 space-y-2 bg-slate-50/50">
          
          {/* Quick Settings (Collapsed Icon or Full Text) */}
          <Link 
            to={`${baseRoute}/settings`}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Preferences</span>}
          </Link>

          {/* User Widget */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-2 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-[11px] text-white">
                {(profile?.full_name || "A").charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-none">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate mt-0.5 leading-none">
                    {profile?.role || "user"}
                  </p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button 
                onClick={handleLogout}
                title="Logout"
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </div>

      </aside>

      {/* Floating Expand Toggle */}
      {sidebarCollapsed && (
        <button 
          onClick={() => setSidebarCollapsed(false)}
          className="absolute -right-3 top-[1.125rem] z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:text-slate-900 transition-transform hover:scale-110 active:scale-95"
        >
          <ChevronRight className="h-4 w-4 ml-0.5" />
        </button>
      )}
    </div>

      {/* ── Mobile Sidebar Drawer ──────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-white shadow-sm/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-200/50 p-4 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-slate-900 shadow-lg">B</div>
                  <span className="font-extrabold text-slate-900 text-sm">BridgeOne Admin</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.path}
                    end={item.path === baseRoute}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="border-t border-slate-200 pt-4">
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
      <div className="flex flex-1 flex-col min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* Sticky Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-lg px-6 sticky top-0 z-30 transition-all">
          
          {/* Breadcrumbs & Title */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 md:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Breadcrumb Navigator */}
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
              <Link to={baseRoute} className="hover:text-slate-900 transition-colors capitalize">{baseRoute.replace('/', '')}</Link>
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  <span className="text-slate-700">/</span>
                  <Link 
                    to={crumb.path} 
                    className={`transition-colors ${idx === breadcrumbs.length - 1 ? "text-slate-900 font-semibold" : "hover:text-slate-900"}`}
                  >
                    {crumb.title}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Connections */}
          <div className="flex items-center gap-3">
            
            {/* Stripe-style Search Bar */}
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex h-9 w-64 items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 px-3 text-sm text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-500 group-hover:text-slate-600 transition-colors" />
                <span>Search...</span>
              </div>
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-sans text-[10px] font-bold text-slate-500 shadow-sm">
                <span>Ctrl K</span>
              </kbd>
            </button>
            
            {/* Mobile Search Icon */}
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
            
            {/* Notification Bell */}
            <button
              onClick={() => setNotifDrawerOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600 border-2 border-white" />
            </button>


            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-[11px] text-slate-900 shadow-sm shrink-0">
                  {(profile?.full_name || "A").charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {profile?.full_name || "User"}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 z-40"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || "User"}</p>
                        <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">{profile?.email || "admin@bridgeone.com"}</p>
                      </div>
                      
                      <div className="p-1.5">
                        <Link
                          to={`${baseRoute}/settings`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-slate-500 shrink-0" />
                          Preferences
                        </Link>
                        <Link
                          to={marketplaceRoute}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Zap className="h-4 w-4 text-blue-500 shrink-0" />
                          Marketplace View
                        </Link>
                      </div>
                      
                      <div className="p-1.5 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Body View */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-50/30">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>

      </div>

      {/* ── Command Palette (Modal Dialog) ──────────────────────── */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/20 backdrop-blur-sm">
            {/* Outside click closes palette */}
            <div className="absolute inset-0" onClick={() => { setCommandPaletteOpen(false); setSearchQuery(""); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[400px]"
            >
              {/* Search bar header */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <Search className="h-4.5 w-4.5 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type a page name or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleCommandKeyDown}
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                />
                <kbd className="inline-flex items-center gap-0.5 rounded bg-slate-50 border border-slate-200 px-1.5 font-mono text-[9px] text-slate-500">
                  <span>esc</span>
                </kbd>
                <button
                  onClick={() => { setCommandPaletteOpen(false); setSearchQuery(""); }}
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
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
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
              <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/40 text-[9px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>↑↓ Nav</span>
                  <span>↵ Select</span>
                </span>
                <span>Command Palette</span>
              </div>
            </motion.div>
          </div>
        )}
        {/* Notification Drawer */}
        <NotificationDrawer open={notifDrawerOpen} onClose={() => setNotifDrawerOpen(false)} />

        {/* Profile Dropdown outside-click overlay */}
        {dropdownOpen && (
          <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setDropdownOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline useMemo implementation to prevent lint dependencies or react version limits

