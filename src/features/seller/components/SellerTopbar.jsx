import { useState, useEffect } from "react";
import { Menu, Loader2 } from "lucide-react";
import NotificationsDropdown from "@/components/common/Notifications/NotificationsDropdown";
import useSellerShop from "../hooks/useSellerShop";
import { supabase } from "@/config/supabase";
import toast from "react-hot-toast";

export default function SellerTopbar({ onToggleSidebar }) {
  const { shop, reloadShop } = useSellerShop();
  const [isOnline, setIsOnline] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (shop) {
      setIsOnline(!!shop.is_online);
    }
  }, [shop]);

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

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3.5">
        {/* Toggle button on mobile */}
        <button 
          onClick={onToggleSidebar} 
          className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <h1 className="text-base md:text-xl font-bold text-white tracking-wide">
          Seller Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Call Widget Presence Toggle */}
        {shop && (
          <button
            onClick={handleToggleStatus}
            disabled={updating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] ${
              isOnline
                ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                : "bg-slate-800 border-slate-700/60 text-slate-400 hover:text-white"
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

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/10 shrink-0">
          S
        </div>
      </div>
    </header>
  );
}