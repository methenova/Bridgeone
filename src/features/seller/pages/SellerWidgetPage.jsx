import { useState } from "react";
import { Sliders, Copy, Code, Eye, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function SellerWidgetPage() {
  const [copied, setCopied] = useState(false);

  function handleCopySnippet() {
    const snippet = `<!-- BridgeOne Live Video Widget Embed -->
<script>
  window.BridgeOneConfig = {
    shopId: "YOUR_SHOP_ID_HERE"
  };
</script>
<script src="${window.location.origin}/widget-loader.js" async></script>`;

    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Embed script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 text-white max-w-5xl relative">
      <div className="absolute top-2 right-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
        NOT FUNCTIONAL · USING MOCK DATA · BACKEND NOT IMPLEMENTED
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Widget Integrations</h1>
        <p className="mt-1 text-xs text-slate-400">Copy integration scripts, customize theme parameters, and rotate API security tokens.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Visual Settings Columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Embed Launcher Script</h3>
            <p className="text-xs text-slate-500">Insert this HTML script right before the closing &lt;/body&gt; tag of your shop theme code:</p>
            
            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300 overflow-x-auto select-all whitespace-pre-wrap leading-relaxed">
{`<!-- BridgeOne Live Video Widget Embed -->
<script>
  window.BridgeOneConfig = {
    shopId: "YOUR_SHOP_ID_HERE"
  };
</script>
<script src="${window.location.origin}/widget-loader.js" async></script>`}
              </pre>

              <button
                onClick={handleCopySnippet}
                className="absolute top-3 right-3 text-slate-450 hover:text-white transition-colors cursor-pointer bg-slate-950 p-1.5 rounded-lg border border-slate-850"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Theme Configurations</h3>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Welcome Message Banner</label>
                <input
                  type="text"
                  placeholder="Need assistance? Call our sales experts!"
                  className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3.5 py-2.5 outline-none focus:border-blue-500 transition-all cursor-not-allowed opacity-50"
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Widget Launcher Icon</label>
                <input
                  type="file"
                  className="w-full text-slate-500 text-xs cursor-not-allowed opacity-50"
                  disabled
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right preview column */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Live Widget Preview</h3>
            <p className="text-xs text-slate-500">Visual mock simulator representing the client storefront</p>
          </div>

          <div className="h-64 rounded-xl border border-slate-850 bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <span className="text-slate-550 text-[10px] uppercase font-bold tracking-wider">Site Simulator</span>
            
            {/* Mock Floating Widget */}
            <div className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg animate-bounce">
              <Eye className="h-4.5 w-4.5 text-white" />
            </div>
          </div>

          <div className="text-[9px] text-slate-500 pt-3 border-t border-slate-900">
            Preview is mock representation of customized stylesheet classes.
          </div>
        </div>

      </div>

    </div>
  );
}
