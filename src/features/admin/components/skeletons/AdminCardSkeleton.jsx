export default function AdminCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4 relative overflow-hidden">
      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-slate-200 relative overflow-hidden" />
        <div className="h-6 w-6 rounded-md bg-slate-100 relative overflow-hidden" />
      </div>
      <div>
        <div className="h-8 w-32 rounded bg-slate-200 mb-2 relative overflow-hidden" />
        <div className="h-3 w-48 rounded bg-slate-100 relative overflow-hidden" />
      </div>
    </div>
  );
}
