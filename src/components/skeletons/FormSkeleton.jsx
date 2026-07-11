/**
 * FormSkeleton — Settings form loading placeholder using the stacked section layout.
 * Used across Admin Settings & Seller Settings pages.
 * @param {number} sections - Number of form sections (default 2)
 */
export default function FormSkeleton({ sections = 2 }) {
  return (
    <div className="space-y-10">
      {[...Array(sections)].map((_, sIdx) => (
        <div key={sIdx}>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Left: Description */}
            <div className="md:col-span-1 space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
                <div className="h-4 w-32 rounded-md bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
              </div>
              <div className="h-3 w-full rounded-md bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              </div>
              <div className="h-3 w-3/4 rounded-md bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              </div>
            </div>

            {/* Right: Controls */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-28 rounded-md bg-slate-100 relative overflow-hidden">
                      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                    </div>
                    <div className="h-10 w-full rounded-xl bg-slate-50 relative overflow-hidden">
                      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {sIdx < sections - 1 && <hr className="border-slate-100 mt-10" />}
        </div>
      ))}
    </div>
  );
}
