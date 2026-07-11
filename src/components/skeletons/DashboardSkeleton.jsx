import CardSkeleton from "./CardSkeleton";

/**
 * DashboardSkeleton — Full dashboard loading state.
 * Combines the premium header banner skeleton, KPI card grid, chart area, and list panel.
 * Used across Admin & Seller dashboards.
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header Banner Skeleton */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100/80 space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="h-7 w-56 bg-slate-100 rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-slate-50 rounded-lg" />
        </div>

        {/* 6 Stats Cards Grid Skeleton */}
        <div className="relative z-10">
          <CardSkeleton count={6} />
        </div>
      </div>

      {/* Chart + Side Panel Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Chart Area */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-100 rounded-md" />
              <div className="h-3 w-56 bg-slate-50 rounded-md" />
            </div>
            <div className="h-6 w-24 bg-slate-50 rounded-full" />
          </div>
          <div className="relative z-10 h-48 w-full flex items-end justify-between gap-2 pt-4">
            {[40, 70, 45, 90, 65, 80, 50, 100, 60, 85, 30, 75].map((h, i) => (
              <div key={i} className="w-full bg-slate-100 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="h-4 w-36 bg-slate-100 rounded-md" />
            <div className="h-3 w-48 bg-slate-50 rounded-md" />
          </div>
          <div className="relative z-10 space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-14 bg-slate-50/50 rounded-xl border border-slate-100" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="h-4 w-28 bg-slate-100 rounded-md" />
              <div className="h-3 w-40 bg-slate-50 rounded-md" />
            </div>
            <div className="relative z-10 space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-12 bg-slate-50/50 rounded-2xl border border-slate-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
