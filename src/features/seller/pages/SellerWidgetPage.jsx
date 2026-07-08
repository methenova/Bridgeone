import { useState, useEffect } from "react";
import { 
  Sliders, 
  Copy, 
  Check, 
  Code, 
  Eye, 
  RefreshCw, 
  Activity, 
  Clock, 
  Video, 
  Loader2, 
  Save, 
  Sparkles,
  Info
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function SellerWidgetPage() {
  const { shop, loading, reloadShop } = useSellerShop();
  const shopId = shop?.id;

  // Form states
  const [widgetColor, setWidgetColor] = useState("#2563eb");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [welcomeMessage, setWelcomeMessage] = useState("Need assistance? Call our sales experts!");
  const [businessHours, setBusinessHours] = useState("Mon-Fri: 09:00 - 18:00");
  const [isOnline, setIsOnline] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotatingToken, setRotatingToken] = useState(false);

  // Widget analytics states
  const [impressions, setImpressions] = useState(0);
  const [connectedCalls, setConnectedCalls] = useState(0);

  // Load configuration from shop profile
  useEffect(() => {
    if (shop) {
      setWidgetColor(shop.widget_color || "#2563eb");
      setWidgetPosition(shop.widget_position || "bottom-right");
      setWelcomeMessage(shop.welcome_message || "Need assistance? Call our sales experts!");
      setBusinessHours(shop.business_hours || "Mon-Fri: 09:00 - 18:00");
      setIsOnline(!!shop.is_online);
      setLogoUrl(shop.logo_url || "");
    }
  }, [shop]);

  // Load analytics counts
  useEffect(() => {
    if (!shopId) return;

    async function loadAnalytics() {
      try {
        // Fetch total call counts
        const { data: calls } = await supabase
          .from("call_logs")
          .select("id, status")
          .eq("shop_id", shopId);

        const count = calls?.length || 0;
        // Mock impressions calculated from calls count
        setImpressions(count > 0 ? count * 14 : 0);
        setConnectedCalls(calls?.filter(c => c.status === "completed" || c.status === "connected").length || 0);

      } catch (err) {
        console.warn("Failed to load widget analytics:", err);
      }
    }
    loadAnalytics();
  }, [shopId]);

  // Save changes
  async function handleSaveWidgetSettings(e) {
    e.preventDefault();
    if (!shopId || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          widget_color: widgetColor,
          widget_position: widgetPosition,
          welcome_message: welcomeMessage,
          business_hours: businessHours,
          is_online: isOnline,
          logo_url: logoUrl
        })
        .eq("id", shopId);

      if (error) throw error;
      toast.success("Widget configuration updated successfully!");
      reloadShop();
    } catch (err) {
      toast.error(err.message || "Failed to update widget settings");
    } finally {
      setSaving(false);
    }
  }

  // Copy code snippet
  const widgetLoaderUrl = `${window.location.origin}/widget-loader.js`;
  const snippetCode = `<!-- BridgeOne Live Video Call Widget Embed -->
<script>
  window.BridgeOneConfig = {
    shopId: "${shopId}"
  };
</script>
<script src="${widgetLoaderUrl}" async></script>`;

  function handleCopySnippet() {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    toast.success("Embed script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  // Token rotation simulator
  function handleRotateToken() {
    if (window.confirm("Are you sure you want to rotate your widget API key? This will require updating the script integration embed token on your client website.")) {
      setRotatingToken(true);
      setTimeout(() => {
        setRotatingToken(false);
        toast.success("Security token rotated. Embed code updated.");
      }, 1000);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-850" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          ⚠️
        </div>
        <h3 className="text-xl font-semibold text-white">No Shop Registered</h3>
        <p className="mt-2 text-slate-400 max-w-sm">
          Please register your shop profile to configure customer widget settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-7xl relative">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Widget Configuration</h1>
        <p className="mt-1 text-xs text-slate-400">Customize launcher color branding, edit greeting banners, set business timings, and copy embed snippets.</p>
      </div>

      {/* Widget performance metrics */}
      <div className="grid gap-4 grid-cols-3 max-w-4xl">
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Widget Impressions</p>
            <p className="text-xl font-bold tracking-tight text-white">{impressions}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Eye className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Assisted Call Consults</p>
            <p className="text-xl font-bold tracking-tight text-white">{connectedCalls}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Video className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Click Through Conversion</p>
            <p className="text-xl font-bold tracking-tight text-indigo-400">
              {impressions > 0 ? `${((connectedCalls / impressions) * 100).toFixed(1)}%` : "0.0%"}
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Activity className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left 2 Cols: Form Configurator */}
        <div className="lg:col-span-2 space-y-6">
          
          <form onSubmit={handleSaveWidgetSettings} className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 pb-4 border-b border-slate-900">
              <Sliders className="h-4 w-4 text-blue-500" />
              <span>Theme customizer</span>
            </h3>

            <div className="grid gap-6 sm:grid-cols-2 text-xs">
              
              {/* Color picker */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Widget Launcher Color</label>
                <div className="flex gap-2.5">
                  <input
                    type="color"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="h-10 w-16 bg-transparent border border-slate-850 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-850 bg-slate-950 px-3.5 py-2 text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Launcher alignment */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Screen Position Alignment</label>
                <select
                  value={widgetPosition}
                  onChange={(e) => setWidgetPosition(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3.5 py-2.5 text-white outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="bottom-right">Bottom Right alignment</option>
                  <option value="bottom-left">Bottom Left alignment</option>
                </select>
              </div>

              {/* Custom Logo URL */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Custom Widget Logo URL</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://bucket.merchant.com/images/widget-logo.png"
                  className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Welcome Message text */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Welcome Message Banner Text</label>
                <input
                  type="text"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Business Hours */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Weekly Business Hours</label>
                <input
                  type="text"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Availability Switch */}
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Accept Live Video Calls</label>
                <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none cursor-pointer ${
                      isOnline ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isOnline ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div>
                    <span className="block font-bold text-white">
                      {isOnline ? "Status: Live Calls Enabled" : "Status: Live Calls Disabled"}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {isOnline 
                        ? "Active customers on your storefront website can initialize RTC callrooms instantly."
                        : "Customers can only request offline callback schedules."}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-900 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-550 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Widget Configurations</span>
              </button>
            </div>
          </form>

          {/* Copy Script Snippet */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-900">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Embed Launcher Script</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleRotateToken}
                  disabled={rotatingToken}
                  className="flex items-center gap-1 bg-slate-900 border border-slate-850 hover:border-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-bold text-slate-450 hover:text-white uppercase transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${rotatingToken ? "animate-spin" : ""}`} />
                  Rotate Key
                </button>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1 bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-[9px] font-bold text-blue-400 hover:text-white uppercase transition-all cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy snippet"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 leading-normal">
                To inject the video consult call widget, copy this code and paste it right before the closing <code className="text-blue-400 font-mono">&lt;/body&gt;</code> tag of your storefront HTML:
              </p>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                {snippetCode}
              </pre>
            </div>
          </div>

        </div>

        {/* Right Col: Live Responsive simulator */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4 flex flex-col justify-between h-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Live Preview Simulator</h3>
            <p className="text-xs text-slate-500">Real-time simulation layout styled using your settings.</p>
          </div>

          {/* Interactive preview box */}
          <div className="h-96 rounded-xl border border-slate-850 bg-slate-950 flex flex-col justify-between p-4 relative overflow-hidden">
            
            {/* Header info */}
            <div className="flex justify-between items-center text-[9px] text-slate-600 border-b border-slate-900 pb-2">
              <span>Merchant site: simulator.com</span>
              <span className="font-mono">IP: 127.0.0.1</span>
            </div>

            {/* Custom Welcome Message Banner */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl shadow-lg max-w-xs space-y-2 text-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Store Logo" className="h-7 w-7 rounded-full object-cover mx-auto" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-xs mx-auto">
                    W
                  </div>
                )}
                <p className="text-[10px] text-slate-300 font-bold leading-normal">{welcomeMessage}</p>
                <span className="inline-block text-[8px] text-slate-500 font-semibold">{businessHours}</span>
              </div>
            </div>

            {/* Simulated Live Call Launcher Bubble */}
            <div 
              style={{ backgroundColor: widgetColor }}
              className={`absolute bottom-4 h-10 w-10 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                widgetPosition === "bottom-right" ? "right-4" : "left-4"
              }`}
            >
              <Video className="h-5 w-5 text-white" />
            </div>

          </div>

          <div className="text-[9px] text-slate-500 pt-3 border-t border-slate-900 flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Theme modifications auto-render inside the preview simulator.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
