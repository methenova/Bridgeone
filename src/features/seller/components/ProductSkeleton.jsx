export default function ProductSkeleton({ rows = 6 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      {/* Table header skeleton */}
      <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="flex gap-4">
          <div className="h-4 w-4 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-slate-700" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
        </div>
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-slate-800/50 px-6 py-4"
        >
          {/* Checkbox */}
          <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-slate-800" />

          {/* Product image + name */}
          <div className="flex flex-1 items-center gap-3">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800/70" />
            </div>
          </div>

          {/* Category */}
          <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />

          {/* Price */}
          <div className="h-4 w-16 animate-pulse rounded bg-slate-800" />

          {/* Stock */}
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-800" />

          {/* Status */}
          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800" />

          {/* Actions */}
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-800" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
