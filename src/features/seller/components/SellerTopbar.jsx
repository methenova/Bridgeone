import { useState, useEffect, useRef } from "react";
import { Menu, Loader2, ChevronDown, Settings, Store, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsDropdown from "@/components/common/Notifications/NotificationsDropdown";
import useSellerShop from "../hooks/useSellerShop";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";
import toast from "react-hot-toast";

export default function SellerTopbar({ onToggleSidebar }) {
  const { shop, reloadShop } = useSellerShop();
  const { profile, logout } = useAuthContext();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (shop) {
      setIsOnline(!!shop.is_online);
    }
  }, [shop]);

  // Click outside to close user menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggleStatus() {
    if (!shop || updating) return;
    setUpdating(true);
    const newStatus = !isOnline;

    try {
      const { error } = await supabase
        .from("shops")
        .update({ is_online: newStatus })
        .eq("id", shop.id);

      if (error) throw error;
      setIsOnline(newStatus);
      toast.success(newStatus ? "Widget Call Status: ONLINE" : "Widget Call Status: OFFLINE");
      reloadShop();
    } catch (err) {
      console.error("[Topbar] Failed to toggle online status:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Failed to logout");
    }
  };

  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || "S";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-900 bg-slate-950 px-4 md:px-8 sticky top-0 z-30 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3.5">
        {/* Toggle button on mobile */}
        <button 
          onClick={onToggleSidebar} 
          className="rounded-xl border border-slate-900 bg-slate-900/40 p-2 text-slate-400 hover:bg-slate-900/60 hover:text-white lg:hidden transition-colors cursor-pointer"
        >
          <Menu size={18} />
        </button>
        
        <h1 className="text-sm md:text-base font-extrabold text-white tracking-wide uppercase">
          Seller Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Call Widget Presence Toggle */}
        {shop && (
          <button
            onClick={handleToggleStatus}
            disabled={updating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] uppercase tracking-wider font-extrabold transition-all active:scale-[0.98] cursor-pointer ${
              isOnline
                ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                : "bg-slate-900/40 border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            {updating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-slate-500"}`} />
            )}
            <span className="hidden sm:inline">Widget Status: {isOnline ? "Online" : "Offline"}</span>
            <span className="sm:hidden">{isOnline ? "Online" : "Offline"}</span>
          </button>
        )}

        <NotificationsDropdown />

        {/* User Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/40 p-1.5 pr-3 text-xs text-slate-300 hover:bg-slate-900/60 hover:text-white transition-all cursor-pointer"
          >
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-blue-600/15">
              {userInitial}
            </div>
            <span className="hidden sm:inline font-semibold truncate max-w-[100px]">
              {profile?.full_name || "Merchant"}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-550 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-900 bg-slate-950 p-1.5 shadow-2xl z-50"
              >
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-slate-900 mb-1">
                  <p className="text-xs font-bold text-white truncate">{profile?.full_name || "Merchant Seller"}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{profile?.email || ""}</p>
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                    {profile?.role || "Seller"}
                  </span>
                </div>

                {/* Dropdown Items */}
                <Link
                  to="/seller/shop"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900/60 hover:text-white transition-colors"
                >
                  <Store size={14} />
                  <span>My Shop</span>
                </Link>
                
                <Link
                  to="/seller/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900/60 hover:text-white transition-colors"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </Link>

                {/* Divider */}
                <div className="h-px bg-slate-900 my-1.5" />

                {/* Log Out */}
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}