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

export default function SellerSidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950">

      {/* Header */}

      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-white">
          BridgeOne
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Seller Panel
        </p>
      </div>

      {/* Navigation */}

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.title}
              to={item.path}
              end={item.path === "/seller"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
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
  );
}