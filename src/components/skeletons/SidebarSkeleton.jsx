/**
 * SidebarSkeleton — Navigation sidebar loading placeholder.
 * Used when the layout sidebar is loading user/shop data.
 * @param {number} items - Number of nav item skeletons (default 8)
 */
export default function SidebarSkeleton({ items = 8 }) {
  return (
    <div className="space-y-6 p-4">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2">
        <div className="h-8 w-8 rounded-xl bg-slate-100 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
        <div className="h-4 w-24 rounded-md bg-slate-100 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
      </div>

      {/* Nav Items */}
      <div className="space-y-1.5">
        {[...Array(items)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="h-4 w-4 rounded bg-slate-100 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
            <div
              className="h-3.5 rounded-md bg-slate-100 relative overflow-hidden"
              style={{ width: `${50 + Math.random() * 40}%` }}
            >
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile Area */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-20 rounded-md bg-slate-100 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
            <div className="h-2.5 w-28 rounded-md bg-slate-50 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
