export default function LivePreview() {
  return (
    <div className="relative">

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />

            <span className="font-semibold text-red-400">
              LIVE NOW
            </span>

          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
            248 Watching
          </span>

        </div>

        <div className="flex h-80 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">

          <div className="text-center">

            <div className="mb-4 text-7xl">
              📹
            </div>

            <h3 className="text-3xl font-bold text-white">
              Live Product Demo
            </h3>

            <p className="mt-3 text-blue-100">
              Experience real-time shopping.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}