export default function AdminFormSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6 relative overflow-hidden">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <div className="h-4 w-48 rounded bg-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-32 rounded bg-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
            <div className="h-10 w-full rounded-xl bg-slate-100 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
          </div>
        ))}

        <div className="sm:col-span-2 space-y-2">
          <div className="h-3 w-48 rounded bg-slate-200 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
          <div className="h-24 w-full rounded-xl bg-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6 mt-6 flex justify-end gap-3">
        <div className="h-10 w-24 rounded-xl bg-slate-100 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
