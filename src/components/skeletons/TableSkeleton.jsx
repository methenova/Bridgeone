/**
 * TableSkeleton — Universal table loading placeholder.
 * Used across Admin & Seller table pages.
 * @param {number} rows - Number of row skeletons (default 6)
 * @param {number} columns - Number of data columns (default 5)
 */
export default function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden relative">
      {/* Table Header */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex gap-6">
        {[...Array(columns)].map((_, i) => (
          <div
            key={i}
            className={`h-3 rounded-md bg-slate-100 relative overflow-hidden flex-1 ${i === 0 ? "max-w-[200px]" : "max-w-[100px]"}`}
          >
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-6">
            {/* Primary Column (Icon + Text) */}
            <div className="flex flex-1 max-w-[200px] items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 rounded-md bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
                <div className="h-3 w-1/2 rounded-md bg-slate-50 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Middle Columns */}
            {[...Array(Math.max(columns - 2, 1))].map((_, j) => (
              <div key={j} className="flex-1 max-w-[100px]">
                <div className="h-4 w-full rounded-md bg-slate-50 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
              </div>
            ))}

            {/* Action Column */}
            <div className="flex flex-1 max-w-[100px] justify-end gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
