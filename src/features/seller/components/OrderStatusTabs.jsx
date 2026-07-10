const STATUS_TABS = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrderStatusTabs({ activeTab, onChange, orders = [] }) {
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    packed: orders.filter((o) => o.status === "packed").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
      {STATUS_TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        const count = counts[tab.value] ?? 0;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`relative flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
