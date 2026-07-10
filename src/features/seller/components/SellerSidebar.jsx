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
    section: "Workspace"
  },
  {
    title: "Live Calls",
    icon: Video,
    path: "/seller/live",
    section: "Workspace"
  },
  {
    title: "Customers",
    icon: Users,
    path: "/seller/customers",
    section: "Workspace"
  },
  {
    title: "Agents",
    icon: Shield,
    path: "/seller/agents",
    section: "Workspace"
  },
  {
    title: "Widget",
    icon: Sliders,
    path: "/seller/widget",
    section: "Settings & Tools"
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/seller/analytics",
    section: "Settings & Tools"
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/seller/notifications",
    section: "Settings & Tools"
  },
  {
    title: "Integrations",
    icon: Layers,
    path: "/seller/integrations",
    section: "Settings & Tools"
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/seller/settings",
    section: "System"
  },
  {
    title: "Profile",
    icon: User,
    path: "/seller/profile",
    section: "System"
  },
];

export default function SellerSidebar({ isOpen, onClose }) {
  // Group menu by section
  const sections = menu.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-100 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-xs shadow-sm shadow-blue-600/10">
              <span>B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 leading-none">BridgeOne</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none uppercase tracking-wider">Seller Panel</span>
            </div>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={onClose} 
            className="rounded-lg border border-slate-150 p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 lg:hidden transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-5 space-y-6 scrollbar-none">
          {Object.entries(sections).map(([sectionName, items], sectionIndex) => (
            <div key={sectionName} className="space-y-1">
              {sectionIndex > 0 && <div className="h-px bg-slate-100/60 mx-3 my-4" />}
              <h2 className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                {sectionName}
              </h2>
              <div className="space-y-[2px]">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.title}
                      to={item.path}
                      end={item.path === "/seller"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? "bg-blue-50/50 text-blue-600"
                            : "text-slate-500 hover:bg-slate-50/70 hover:text-slate-950"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-blue-600 rounded-r" />
                          )}
                          <Icon
                            size={15}
                            className={`shrink-0 transition-colors ${
                              isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                            }`}
                            strokeWidth={1.7}
                          />
                          <span>{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}