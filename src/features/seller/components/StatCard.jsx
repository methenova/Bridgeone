export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "bg-blue-600",
  change,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500 hover:shadow-lg">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-white">
            {value}
          </h3>

          {change && (
            <p className="mt-2 text-sm text-green-400">
              {change}
            </p>
          )}
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          {Icon && <Icon size={28} className="text-white" />}
        </div>

      </div>

    </div>
  );
}