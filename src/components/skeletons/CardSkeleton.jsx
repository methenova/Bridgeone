/**
 * CardSkeleton — Premium KPI metric card loading placeholder.
 * Used across Admin & Seller dashboards.
 * @param {number} count - Number of cards to render (default 6)
 */
export default function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]"
        >
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded-md" />
              <div className="h-7 w-28 bg-slate-100 rounded-md" />
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100" />
          </div>
          <div className="relative z-10 pt-4 border-t border-slate-100 flex items-end justify-between">
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
              <div className="h-2.5 w-20 bg-slate-50 rounded-md" />
            </div>
            <div className="h-8 w-20 flex items-end justify-between gap-1">
              {[40, 60, 45, 80, 50, 70, 90, 65].map((h, i) => (
                <div key={i} className="w-1.5 bg-slate-100 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
