import { useState, useEffect, useMemo } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, LogOut, ChevronDown, Search, Zap, ChevronLeft, ChevronRight, Settings, Bell, ZapOff, Trash2, ShieldAlert
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/config/supabase";
import toast from "react-hot-toast";
import NotificationDrawer from "./NotificationDrawer";
import { useAuthContext } from "@/context/AuthContext";

export default function PremiumLayout({ 
  menuItems = [], 
  profile, 
  onLogout,
  workspaceName = "Workspace",
  workspaces = [], // [{name: 'HQ'}, {name: 'Sandbox'}]
  onWorkspaceChange,
  baseRoute = "/admin",
  marketplaceRoute = "/",
  shopId = null
}) {
  const handleLogout = onLogout;
  const navigate = useNavigate();
  const location = useLocation();

  const {
    organizations,
    currentOrganization,
    shops,
    currentShop,
    switchOrganization,
    switchShop,
    createOrganization,
    renameOrganization,
    deleteOrganization,
    transferOrganizationOwnership,
    createShopInActiveOrg
  } = useAuthContext();

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

  // Organization Settings Modal States
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("settings"); // "settings" | "create_org" | "create_shop"
  const [newOrgName, setNewOrgName] = useState("");
  const [renameOrgName, setRenameOrgName] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [newShopWebsite, setNewShopWebsite] = useState("");
  const [newShopCategory, setNewShopCategory] = useState("fashion_apparel");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    <div className="admin-theme flex min-h-screen font-sans text-slate-900 selection:bg-blue-600/30 selection:text-blue-200 p-4 gap-4">
      
      {/* ── Left Sidebar (Desktop) ────────────────────── */}
      <div className="relative hidden md:flex shrink-0">
        <aside 
          className={`flex flex-col rounded-2xl glass-panel premium-shadow transition-all duration-300 overflow-hidden relative ${
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
                <button
                  onClick={() => setWorkspaceOpen(!workspaceOpen)}
                  className="flex items-center gap-1 text-sm font-extrabold text-slate-900 truncate hover:text-blue-600 transition-colors text-left"
                >
                  <span>{currentOrganization?.organization_name || workspaceName}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-550 shrink-0 transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Workspace Swapper Dropdown */}
            <AnimatePresence>
              {workspaceOpen && !sidebarCollapsed && (
                <>
                  <div className="fixed inset-0 z-35 bg-transparent" onClick={() => setWorkspaceOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute left-4 right-4 top-14 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-3 max-h-[360px] overflow-y-auto space-y-4"
                  >
                    {/* Organizations List */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Organizations</p>
                      <div className="space-y-0.5">
                        {organizations.map(org => {
                          const isSelected = org.id === currentOrganization?.id;
                          return (
                            <button
                              key={org.id}
                              onClick={() => {
                                switchOrganization(org.id);
                                setWorkspaceOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors font-bold ${
                                isSelected
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{org.organization_name}</span>
                              {isSelected && <Zap className="h-3 w-3 text-blue-600 fill-blue-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shops List */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Active Org Shops</p>
                      <div className="space-y-0.5">
                        {shops.map(s => {
                          const isSelected = s.id === currentShop?.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                switchShop(s.id);
                                setWorkspaceOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors font-semibold ${
                                isSelected
                                  ? "bg-slate-950 text-white"
                                  : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{s.shop_name}</span>
                              {isSelected && <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />}
                            </button>
                          );
                        })}
                        {shops.length === 0 && (
                          <p className="text-[10px] text-slate-400 px-2 italic">No shops in this organization</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-slate-100 pt-2.5 flex gap-1.5">
                      <button
                        onClick={() => {
                          setRenameOrgName(currentOrganization?.organization_name || "");
                          setIsOrgModalOpen(true);
                          setActiveModalTab("settings");
                          setWorkspaceOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-bold text-slate-700 cursor-pointer"
                      >
                        <Settings className="h-3.5 w-3.5" /> Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsOrgModalOpen(true);
                          setActiveModalTab("create_org");
                          setWorkspaceOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-bold cursor-pointer shadow-sm"
                      >
                        + Add Org
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

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
      <div className="flex flex-1 flex-col min-w-0 rounded-2xl glass-panel premium-shadow overflow-hidden">
        
        {/* Sticky Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/50 bg-white/40 backdrop-blur-md px-6 sticky top-0 z-30 transition-all">
          
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
                    <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setDropdownOpen(false)} />
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
      </AnimatePresence>

      {/* Notification Drawer */}
      <NotificationDrawer 
        open={notifDrawerOpen} 
        onClose={() => setNotifDrawerOpen(false)} 
        role={profile?.role}
        shopId={shopId}
      />



      {/* Organization Switcher / Management Modal */}
      <AnimatePresence>
        {isOrgModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setIsOrgModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-[2rem] border border-slate-150 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-50 animate-in"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Organization Settings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your shops and workspace contexts</p>
                </div>
                <button
                  onClick={() => setIsOrgModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1 shrink-0">
                <button
                  onClick={() => setActiveModalTab("settings")}
                  className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeModalTab === "settings" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Manage Active Org
                </button>
                <button
                  onClick={() => setActiveModalTab("create_org")}
                  className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeModalTab === "create_org" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Create Organization
                </button>
                <button
                  onClick={() => setActiveModalTab("create_shop")}
                  className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeModalTab === "create_shop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Add New Shop
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* TAB 1: ORG SETTINGS */}
                {activeModalTab === "settings" && currentOrganization && (
                  <div className="space-y-6">
                    {/* Rename */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-505 uppercase">Rename Organization</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={renameOrgName}
                          onChange={(e) => setRenameOrgName(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                          placeholder="Organization name"
                        />
                        <button
                          onClick={async () => {
                            if (!renameOrgName.trim()) return;
                            try {
                              await renameOrganization(currentOrganization.id, renameOrgName.trim());
                              toast.success("Organization renamed successfully!");
                            } catch (err) {
                              toast.error(err.message || "Failed to rename organization.");
                            }
                          }}
                          className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Transfer Ownership */}
                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <label className="text-[10px] font-bold text-amber-600 uppercase">Transfer Ownership</label>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Enter the registered user email address you wish to transfer this organization to. This action is irreversible.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={transferEmail}
                          onChange={(e) => setTransferEmail(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                          placeholder="newowner@example.com"
                        />
                        <button
                          onClick={async () => {
                            if (!transferEmail.trim()) return;
                            if (!window.confirm(`Are you absolutely sure you want to transfer ownership of ${currentOrganization.organization_name} to ${transferEmail}? You will immediately lose access!`)) return;
                            try {
                              await transferOrganizationOwnership(currentOrganization.id, transferEmail.trim());
                              toast.success("Ownership transferred successfully! Reloading workspace...");
                              setIsOrgModalOpen(false);
                            } catch (err) {
                              toast.error(err.message || "Failed to transfer ownership.");
                            }
                          }}
                          className="px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Transfer
                        </button>
                      </div>
                    </div>

                    {/* Delete Org */}
                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <label className="text-[10px] font-bold text-rose-600 uppercase">Danger Zone</label>
                      <div className="bg-red-50 border border-red-150 rounded-xl p-4 flex flex-col gap-3">
                        <p className="text-[10px] text-rose-805 leading-normal font-medium">
                          Deleting this organization will permanently remove all associated shops, widget configurations, agent details, and logs. This cannot be undone.
                        </p>
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="py-2.5 bg-rose-600 hover:bg-rose-550 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Organization
                          </button>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer bg-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await deleteOrganization(currentOrganization.id);
                                  toast.success("Organization successfully deleted!");
                                  setIsOrgModalOpen(false);
                                  setShowDeleteConfirm(false);
                                } catch (err) {
                                  toast.error(err.message || "Failed to delete organization.");
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-650 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CREATE ORG */}
                {activeModalTab === "create_org" && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newOrgName.trim()) return;
                      try {
                        await createOrganization(newOrgName.trim());
                        toast.success(`Organization "${newOrgName}" created!`);
                        setNewOrgName("");
                        setIsOrgModalOpen(false);
                      } catch (err) {
                        toast.error(err.message || "Failed to create organization.");
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-550 uppercase">Organization Name</label>
                      <input
                        type="text"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                        placeholder="e.g. Acme Corp"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/10"
                    >
                      Create Organization & Switch
                    </button>
                  </form>
                )}

                {/* TAB 3: CREATE SHOP */}
                {activeModalTab === "create_shop" && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newShopName.trim()) return;
                      try {
                        await createShopInActiveOrg(newShopName.trim(), {
                          website: newShopWebsite.trim(),
                          category: newShopCategory
                        });
                        toast.success(`Shop "${newShopName}" added to organization!`);
                        setNewShopName("");
                        setNewShopWebsite("");
                        setNewShopCategory("fashion_apparel");
                        setIsOrgModalOpen(false);
                      } catch (err) {
                        toast.error(err.message || "Failed to add shop.");
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Name</label>
                      <input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                        placeholder="e.g. London Boutique"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Shop Website URL</label>
                      <input
                        type="url"
                        value={newShopWebsite}
                        onChange={(e) => setNewShopWebsite(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                        placeholder="https://londonboutique.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Business Category</label>
                      <select
                        value={newShopCategory}
                        onChange={(e) => setNewShopCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                      >
                        <option value="fashion_apparel">Fashion & Apparel</option>
                        <option value="electronics_gadgets">Electronics & Gadgets</option>
                        <option value="home_living">Home & Living</option>
                        <option value="beauty_wellness">Beauty & Wellness</option>
                        <option value="other">Other / General Retail</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/10"
                    >
                      Add Shop & Activate
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline useMemo implementation to prevent lint dependencies or react version limits

