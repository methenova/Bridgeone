import React from "react";
import { Video } from "lucide-react";

export function WidgetLimitExceededScreen({ shop }) {
  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-100 overflow-hidden font-sans border border-slate-200 shadow-2xl relative select-none">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-white shadow-sm/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
            {shop?.logo_url ? (
              <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Video className="h-4.5 w-4.5 text-slate-500" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {shop?.name || "Live Consultation"}
            </h1>
          </div>
        </div>
        <button
          onClick={() => window.parent.postMessage("close-widget", "*")}
          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/60 shadow-sm hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>
      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5 bg-slate-50">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center animate-bounce">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-extrabold text-slate-900">Call Limit Reached</h2>
          <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed mx-auto">
            This merchant has reached their monthly video consultation call limit. Please contact store support for assistance.
          </p>
        </div>
        <button
          onClick={() => window.parent.postMessage("close-widget", "*")}
          className="rounded-xl border border-slate-200 hover:border-slate-200 bg-white/60 shadow-sm hover:bg-slate-100 text-xs font-semibold px-6 py-2.5 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Close Widget
        </button>
      </main>
    </div>
  );
}
