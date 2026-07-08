import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Users,
  Shield,
  Sliders,
  BarChart3,
  Bell,
  Layers,
  Settings,
  User,
  X
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/seller",
  },
  {
    title: "Live Calls",
    icon: Video,
    path: "/seller/live",
  },
  {
    title: "Customers",
    icon: Users,
    path: "/seller/customers",
  },
  {
    title: "Agents",
    icon: Shield,
    path: "/seller/agents",
  },
  {
    title: "Widget",
    icon: Sliders,
    path: "/seller/widget",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/seller/analytics",
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/seller/notifications",
  },
  {
    title: "Integrations",
    icon: Layers,
    path: "/seller/integrations",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/seller/settings",
  },
  {
    title: "Profile",
    icon: User,
    path: "/seller/profile",
  },
];

export default function SellerSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              BridgeOne
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Seller Panel
            </p>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={onClose} 
            className="rounded-xl border border-slate-850 p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 scrollbar-none">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.title}
                to={item.path}
                end={item.path === "/seller"}
                onClick={onClose} // close mobile drawer when route changes
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all duration-150 ${
                    isActive
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}