import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  Radio,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/seller",
  },
  {
    title: "My Shop",
    icon: Store,
    path: "/seller/shop",
  },
  {
    title: "Products",
    icon: Package,
    path: "/seller/products",
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    path: "/seller/orders",
  },
  {
    title: "Customers",
    icon: Users,
    path: "/seller/customers",
  },
  {
    title: "Live Selling",
    icon: Radio,
    path: "/seller/live",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/seller/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/seller/settings",
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
                  `flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}