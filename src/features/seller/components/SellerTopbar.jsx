import { Menu } from "lucide-react";
import NotificationsDropdown from "@/components/common/Notifications/NotificationsDropdown";

export default function SellerTopbar({ onToggleSidebar }) {
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
        <NotificationsDropdown />

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/10 shrink-0">
          S
        </div>
      </div>
    </header>
  );
}