export default function AdminTableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-4 relative">
      {/* Table Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-3 rounded bg-slate-200 relative overflow-hidden flex-1 ${i === 1 ? 'max-w-[200px]' : 'max-w-[100px]'}`}>
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-6">
            
            {/* Primary Column (Icon + Text) */}
            <div className="flex flex-1 max-w-[200px] items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 rounded bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
                <div className="h-3 w-1/2 rounded bg-slate-50 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              </div>
            </div>

            {/* Middle Columns */}
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex-1 max-w-[100px] space-y-2">
                <div className="h-4 w-full rounded bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              </div>
            ))}

            {/* Action Column */}
            <div className="flex flex-1 max-w-[100px] justify-end gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
