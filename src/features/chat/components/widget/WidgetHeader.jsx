import React from "react";
import { Video } from "lucide-react";

export function WidgetHeader({ shop, onClose }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-white shadow-sm/40 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
          {shop?.logo_url ? (
            <img
              src={shop.logo_url}
              alt={`${shop.name} Logo`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <Video className="h-4.5 w-4.5 text-slate-500" />
          )}
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">
            {shop?.name || "Live Consultation"}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5" aria-live="polite">
            <span className={`h-1.5 w-1.5 rounded-full ${shop?.is_online ? "bg-green-500" : "bg-slate-500"}`} />
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
              {shop?.is_online ? "Online Now" : "Offline"}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Close widget window"
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/60 shadow-sm hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>
  );
}
