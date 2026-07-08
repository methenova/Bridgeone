import { Bell, ShieldCheck, Mail, Smartphone, Info } from "lucide-react";

export default function SellerNotificationsPage() {
  return (
    <div className="space-y-6 text-white max-w-4xl relative">
      <div className="absolute top-2 right-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
        NOT FUNCTIONAL · USING MOCK DATA · BACKEND NOT IMPLEMENTED
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Notification Channels</h1>
        <p className="mt-1 text-xs text-slate-400">Configure real-time calling alert channels (SMS, Email, Mobile App Alerts).</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        
        {/* Toggle Panel 1 */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-blue-500" />
            <span>Email Consultation warnings</span>
          </h3>
          <p className="text-xs text-slate-500 leading-normal">Send transactional email digests to owners/managers whenever a call is missed or callback requested.</p>

          <label className="flex items-center gap-2.5 text-xs text-slate-350 cursor-not-allowed opacity-50">
            <input type="checkbox" checked disabled className="rounded border-slate-850 bg-slate-950 text-blue-600 h-4 w-4" />
            <span>Enable email warnings</span>
          </label>
        </div>

        {/* Toggle Panel 2 */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-blue-500" />
            <span>Mobile Push Alerts</span>
          </h3>
          <p className="text-xs text-slate-500 leading-normal">Receive immediate push alerts directly on your browser or mobile application for incoming RTC signalling sessions.</p>

          <label className="flex items-center gap-2.5 text-xs text-slate-350 cursor-not-allowed opacity-50">
            <input type="checkbox" checked disabled className="rounded border-slate-850 bg-slate-950 text-blue-600 h-4 w-4" />
            <span>Enable browser push alerts</span>
          </label>
        </div>

      </div>

    </div>
  );
}
