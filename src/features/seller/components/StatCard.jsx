export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "bg-blue-50 text-blue-600",
  change,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all duration-300 p-6 hover:border-blue-500/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
          {change && (
            <p className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span>{change}</span>
            </p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${color}`}
        >
          {Icon && <Icon size={22} />}
        </div>
      </div>
    </div>
  );
}