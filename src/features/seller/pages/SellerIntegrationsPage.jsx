import { Layers, Store, Send, MessageCircle, MessageSquare } from "lucide-react";

export default function SellerIntegrationsPage() {
  const integrationList = [
    { name: "Shopify Storefront Connector", desc: "Sync catalog lists and checkouts directly inside consultation call panels.", icon: Store, connected: true },
    { name: "Slack Signal Channels", desc: "Notify team channels instantly about calling alerts and callback updates.", icon: MessageCircle, connected: false },
    { name: "Hubspot CRM Connector", desc: "Push customer notes, calls durations, and ratings directly to customer contact timelines.", icon: MessageSquare, connected: false }
  ];

  return (
    <div className="space-y-6 text-white max-w-5xl relative">
      <div className="absolute top-2 right-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
        NOT FUNCTIONAL · USING MOCK DATA · BACKEND NOT IMPLEMENTED
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">App Integrations</h1>
        <p className="mt-1 text-xs text-slate-400">Connect CRM systems, Shopify catalogs, and Slack notification channels.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrationList.map(int => {
          const Icon = int.icon;
          return (
            <div key={int.name} className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-sm font-bold text-white leading-normal">{int.name}</h4>
                <p className="text-[10px] text-slate-500 leading-normal">{int.desc}</p>
              </div>

              <button className={`w-full text-center py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-not-allowed ${
                int.connected 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-slate-900 border border-slate-850 text-slate-450 hover:text-white"
              }`} disabled>
                {int.connected ? "Active" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
