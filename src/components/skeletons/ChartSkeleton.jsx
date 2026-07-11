/**
 * ChartSkeleton — Chart area loading placeholder with bar graph.
 * Used across Admin & Seller analytics pages.
 */
export default function ChartSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-48 rounded-md bg-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
          <div className="h-3 w-64 rounded-md bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
        </div>
        <div className="h-6 w-24 rounded-full bg-slate-50 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
      </div>

      <div className="h-56 w-full flex items-end justify-between gap-2 pt-4 relative">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
          <div className="border-t border-slate-200 w-full" />
          <div className="border-t border-slate-200 w-full" />
          <div className="border-t border-slate-200 w-full" />
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Bars */}
        {[40, 70, 45, 90, 65, 80, 50, 100, 60, 85, 30, 75].map((h, i) => (
          <div
            key={i}
            className="w-full bg-slate-100 rounded-t-sm relative overflow-hidden"
            style={{ height: `${h}%` }}
          >
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
