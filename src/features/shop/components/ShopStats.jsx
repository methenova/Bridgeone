import {
  Package,
  Users,
  Star,
  Eye,
} from "lucide-react";

export default function ShopStats() {
  const stats = [
    {
      title: "Products",
      value: "248",
      icon: Package,
    },
    {
      title: "Followers",
      value: "12.5K",
      icon: Users,
    },
    {
      title: "Rating",
      value: "4.8",
      icon: Star,
    },
    {
      title: "Live Viewers",
      value: "524",
      icon: Eye,
    },
  ];

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  {item.title}
                </p>

                <h3 className="mt-2 text-3xl font-bold text-white">
                  {item.value}
                </h3>
              </div>

              <div className="rounded-2xl bg-blue-600/20 p-3">
                <Icon
                  className="text-blue-400"
                  size={24}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}