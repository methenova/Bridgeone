import { useAdminStats, useAdminOrders, useAdminShops } from "../hooks/useAdmin";
import { Users, Store, Package, ShoppingBag, Landmark, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders = [], isLoading: ordersLoading } = useAdminOrders();
  const { data: shops = [], isLoading: shopsLoading } = useAdminShops();

  const cards = [
    { title: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-400 bg-blue-500/10" },
    { title: "Active Shops", value: stats?.totalShops, icon: Store, color: "text-emerald-400 bg-emerald-500/10" },
    { title: "Total Products", value: stats?.totalProducts, icon: Package, color: "text-amber-400 bg-amber-500/10" },
    { title: "Platform Orders", value: stats?.totalOrders, icon: ShoppingBag, color: "text-purple-400 bg-purple-500/10" },
  ];

  const recentOrders = orders.slice(0, 5);
  const recentShops = shops.slice(0, 5);

  const totalLoading = statsLoading || ordersLoading || shopsLoading;

  if (totalLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-900 border border-slate-900" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-900" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Dashboard</h1>
        <p className="mt-1 text-slate-400">Real-time marketplace health metrics and statistics.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">{card.title}</p>
                <p className="mt-2 text-3xl font-extrabold text-white">
                  {card.value?.toLocaleString() ?? 0}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Revenue */}
      <div className="rounded-2xl border border-slate-900 bg-gradient-to-r from-slate-900/60 to-slate-950 p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Landmark className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Gross Merchandise Value (GMV)</p>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              ₹{stats?.totalRevenue?.toLocaleString() ?? 0}
            </h2>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-right max-w-[200px]">
          Cumulative gross sales across all completed shop orders.
        </p>
      </div>

      {/* Lists */}
      <div className="grid gap-8 lg:grid-cols-2">

        {/* Recent Orders */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm">
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-400">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {order.profiles?.full_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">₹{Number(order.total).toLocaleString()}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase mt-1 ${
                    order.status === "pending"
                      ? "bg-amber-500/10 text-amber-400"
                      : order.status === "cancelled"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">No orders placed yet.</p>
            )}
          </div>
        </div>

        {/* Recent Shops */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">New Shops</h3>
            <Link to="/admin/shops" className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recentShops.map((shop) => (
              <div key={shop.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center">
                    {shop.logo_url ? <img src={shop.logo_url} alt="" className="h-full w-full object-cover" /> : "🏪"}
                  </div>
                  <div>
                    <p className="font-bold text-white">{shop.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{shop.categories?.name} · {shop.city}</p>
                  </div>
                </div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  shop.is_active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {shop.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {recentShops.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">No shops created yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
