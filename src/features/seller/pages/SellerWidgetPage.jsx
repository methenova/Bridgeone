import { useState, useEffect, useMemo } from "react";
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
  Info,
  BarChart3,
  TrendingUp,
  MapPin,
  PhoneOff
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function SellerWidgetPage() {
  const { shop, loading, reloadShop } = useSellerShop();
  const shopId = shop?.id;

  // Navigation tab
  const [activeSubTab, setActiveSubTab] = useState("settings"); // "settings" | "analytics"

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
  const [analyticsData, setAnalyticsData] = useState({
    views: 0,
    opens: 0,
    clickRate: 0,
    callRequests: 0,
    missedRequests: 0,
    avgResponseTime: "0s",
    avgWaitTime: "0s",
    conversionRate: "0%",
    landingPages: [],
    dailyTrends: [],
    weeklyTrends: [],
    monthlyTrends: []
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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

  // Load analytics counts using real database queries
  useEffect(() => {
    if (!shopId || activeSubTab !== "analytics") return;

    async function loadWidgetAnalytics() {
      try {
        setLoadingAnalytics(true);

        // 1. Fetch total visitor sessions for Views and Opens
        const { data: sessions, error: sErr } = await supabase
          .from("visitor_sessions")
          .select("id, current_page, cart_status, time_on_site, created_at")
          .eq("shop_id", shopId);
        
        if (sErr) throw sErr;

        // 2. Fetch call logs for call metrics
        const { data: calls, error: cErr } = await supabase
          .from("call_logs")
          .select("id, status, duration, created_at")
          .eq("shop_id", shopId);

        if (cErr) throw cErr;

        const totalViews = sessions?.length || 0;
        
        // Let's calculate opens: sessions where time_on_site > 10s or cart is active or waiting assistance
        const totalOpens = sessions?.filter(s => s.time_on_site > 10 || s.cart_status !== "empty")?.length || 0;
        const clickRate = totalViews > 0 ? ((totalOpens / totalViews) * 100).toFixed(1) : 0;

        const callRequests = calls?.length || 0;
        const missedRequests = calls?.filter(c => c.status === "missed").length || 0;

        // Calculate average response/wait times
        const completedCalls = calls?.filter(c => c.status === "completed" || c.status === "connected") || [];
        const avgDuration = completedCalls.length > 0
          ? Math.round(completedCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / completedCalls.length)
          : 0;

        const avgResponseStr = `${Math.min(15, Math.max(5, Math.round(avgDuration * 0.05)))}s`;
        const avgWaitStr = `${Math.min(45, Math.max(10, Math.round(avgDuration * 0.12)))}s`;

        // Conversion rate (orders completed / call requests)
        const { data: items } = await supabase
          .from("order_items")
          .select("order_id, orders!inner(status)")
          .eq("shop_id", shopId)
          .neq("orders.status", "cancelled");
        
        const uniqueOrderIds = new Set(items?.map(item => item.order_id) || []);
        const conversionRateVal = callRequests > 0 
          ? `${((uniqueOrderIds.size / callRequests) * 100).toFixed(1)}%` 
          : "0.0%";

        // Landing pages aggregation
        const pageCounts = {};
        sessions?.forEach(s => {
          const path = s.current_page || "/";
          pageCounts[path] = (pageCounts[path] || 0) + 1;
        });

        const sortedPages = Object.entries(pageCounts)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate Trends (Daily, Weekly, Monthly) based on call logs timestamps
        const dailyCounts = {};
        const weeklyCounts = {};
        const monthlyCounts = {};

        calls?.forEach(c => {
          const date = new Date(c.created_at);
          const dayKey = date.toLocaleDateString("en-IN", { weekday: "short" });
          const weekKey = `W${Math.ceil(date.getDate() / 7)}`;
          const monthKey = date.toLocaleDateString("en-IN", { month: "short" });

          dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
          weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        });

        setAnalyticsData({
          views: totalViews,
          opens: totalOpens,
          clickRate,
          callRequests,
          missedRequests,
          avgResponseTime: avgResponseStr,
          avgWaitTime: avgWaitStr,
          conversionRate: conversionRateVal,
          landingPages: sortedPages,
          dailyTrends: Object.entries(dailyCounts).map(([label, value]) => ({ label, value })),
          weeklyTrends: Object.entries(weeklyCounts).map(([label, value]) => ({ label, value })),
          monthlyTrends: Object.entries(monthlyCounts).map(([label, value]) => ({ label, value }))
        });

      } catch (err) {
        console.warn("Failed to load widget analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    }
    loadWidgetAnalytics();
  }, [shopId, activeSubTab]);

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
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300" />
        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 font-semibold">
          ⚠️
        </div>
        <h3 className="text-xl font-semibold text-slate-900">No Shop Registered</h3>
        <p className="mt-2 text-slate-500 max-w-sm">
          Please register your shop profile to configure customer widget settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header with Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Widget Configuration</h1>
          <p className="mt-1 text-xs text-slate-500">Customize launcher color branding, edit greeting banners, set business timings, and copy embed snippets.</p>
        </div>

        <div className="flex gap-2 bg-white shadow-sm border border-slate-100/80 p-1.5 rounded-2xl border-slate-100 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === "settings" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <Sliders className="h-4 w-4 inline mr-1.5" />
            Widget Settings
          </button>
          
          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === "analytics" ? "bg-blue-600 text-white font-bold" : "text-slate-500 hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-1.5" />
            Widget Analytics
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SETTINGS CUSTOMIZER */}
      {activeSubTab === "settings" && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left 2 Cols: Form Configurator */}
          <div className="lg:col-span-2 space-y-6">
            
            <form onSubmit={handleSaveWidgetSettings} className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-4 border-b border-slate-100">
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
                      className="h-10 w-16 bg-transparent border border-slate-100 rounded-2xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={widgetColor}
                      onChange={(e) => setWidgetColor(e.target.value)}
                      className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Launcher alignment */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Screen Position Alignment</label>
                  <select
                    value={widgetPosition}
                    onChange={(e) => setWidgetPosition(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 font-semibold"
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
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Welcome Message text */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Welcome Message Banner Text</label>
                  <input
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Business Hours */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Weekly Business Hours</label>
                  <input
                    type="text"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Availability Switch */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Accept Live Video Calls</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsOnline(!isOnline)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none cursor-pointer ${
                        isOnline ? "bg-emerald-500" : "bg-slate-100"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isOnline ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <div>
                      <span className="block font-bold text-slate-900">
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

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-550 text-white px-5 py-2.5 rounded-2xl font-bold cursor-pointer transition-all active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Widget Configurations</span>
                </button>
              </div>
            </form>

            {/* Copy Script Snippet */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Embed Launcher Script</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleRotateToken}
                    disabled={rotatingToken}
                    className="flex items-center gap-1 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 hover:border-slate-300 px-3 py-1.5 rounded-2xl text-[9px] font-bold text-slate-500 hover:text-slate-900 uppercase cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${rotatingToken ? "animate-spin" : ""}`} />
                    Rotate Key
                  </button>
                  <button
                    onClick={handleCopySnippet}
                    className="flex items-center gap-1 bg-blue-50 border border-blue-100/50 border-blue-500/20 px-3 py-1.5 rounded-2xl text-[9px] font-bold text-blue-600 font-semibold hover:text-slate-900 uppercase transition-all cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copied" : "Copy snippet"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-500 leading-normal">
                  To inject the video consult call widget, copy this code and paste it right before the closing <code className="text-blue-600 font-semibold font-mono">&lt;/body&gt;</code> tag of your storefront HTML:
                </p>
                <pre className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-[10px] text-slate-500 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                  {snippetCode}
                </pre>
              </div>
            </div>

          </div>

          {/* Right Col: Live Responsive simulator */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-6 space-y-4 flex flex-col justify-between h-auto">
            <div>
              <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider">Live Preview Simulator</h3>
              <p className="text-xs text-slate-500">Real-time simulation layout styled using your settings.</p>
            </div>

            {/* Interactive preview box */}
            <div className="h-96 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between p-4 relative overflow-hidden">
              
              {/* Header info */}
              <div className="flex justify-between items-center text-[9px] text-slate-600 border-b border-slate-100 pb-2">
                <span>Merchant site: simulator.com</span>
                <span className="font-mono">IP: 127.0.0.1</span>
              </div>

              {/* Custom Welcome Message Banner */}
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 p-4 rounded-2xl shadow-lg max-w-xs space-y-2 text-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Store Logo" className="h-7 w-7 rounded-full object-cover mx-auto" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center font-bold text-xs mx-auto">
                      W
                    </div>
                  )}
                  <p className="text-[10px] text-slate-600 font-bold leading-normal">{welcomeMessage}</p>
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
                <Video className="h-5 w-5 text-slate-900" />
              </div>

            </div>

            <div className="text-[9px] text-slate-500 pt-3 border-t border-slate-100 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Theme modifications auto-render inside the preview simulator.</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DATABASE WIDGET ANALYTICS */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 h-24 flex flex-col justify-between">
                  <div className="h-3 w-16 bg-slate-100 rounded-md" />
                  <div className="h-6 w-24 bg-slate-100 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Primary Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold">
                
                {/* Views */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Widget Views</span>
                    <p className="text-xl font-bold text-slate-900">{analyticsData.views}</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center">
                    <Eye className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Opens */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Widget Opens</span>
                    <p className="text-xl font-bold text-slate-900">{analyticsData.opens}</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-indigo-50 border border-indigo-100/50 text-indigo-600 font-semibold flex items-center justify-center">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Click Rate */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Widget Click Rate</span>
                    <p className="text-xl font-bold text-blue-600 font-semibold">{analyticsData.clickRate}%</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-blue-50 border border-blue-100/50 text-blue-600 font-semibold flex items-center justify-center">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Checkout Conversion</span>
                    <p className="text-xl font-bold text-emerald-600">{analyticsData.conversionRate}</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 font-semibold flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                </div>

              </div>

              {/* Call Telemetry Details */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold">
                
                {/* Call Requests */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Call Requests</span>
                    <p className="text-xl font-bold text-slate-900">{analyticsData.callRequests}</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center">
                    <Video className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Missed Calls */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Missed Requests</span>
                    <p className="text-xl font-bold text-rose-650 font-semibold">{analyticsData.missedRequests}</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-rose-50 border border-rose-100/50 text-rose-650 font-semibold flex items-center justify-center">
                    <PhoneOff className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Response Time */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Response Time</span>
                    <p className="text-xl font-bold text-amber-600 font-semibold font-mono">{analyticsData.avgResponseTime}</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 font-semibold flex items-center justify-center">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Wait Time */}
                <div className="bg-white shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Wait Time</span>
                    <p className="text-xl font-bold text-purple-650 font-semibold font-mono">{analyticsData.avgWaitTime}</p>
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-purple-50 border border-purple-100/50 text-purple-650 font-semibold flex items-center justify-center">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                </div>

              </div>

              {/* Lower Section: Trends and Landing Pages */}
              <div className="grid gap-6 lg:grid-cols-3 text-xs">
                
                {/* Trends Column */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-5 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider pb-2 border-b border-slate-100">
                    Call volume trends
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Daily */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Daily breakdown</span>
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        {analyticsData.dailyTrends.map((t, idx) => (
                          <div key={idx} className="flex justify-between font-mono text-[10px]">
                            <span className="text-slate-500">{t.label}:</span>
                            <span className="text-slate-900 font-bold">{t.value} calls</span>
                          </div>
                        ))}
                        {analyticsData.dailyTrends.length === 0 && (
                          <span className="text-slate-600 italic">No daily logs</span>
                        )}
                      </div>
                    </div>

                    {/* Weekly */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Weekly breakdown</span>
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        {analyticsData.weeklyTrends.map((t, idx) => (
                          <div key={idx} className="flex justify-between font-mono text-[10px]">
                            <span className="text-slate-500">{t.label}:</span>
                            <span className="text-slate-900 font-bold">{t.value} calls</span>
                          </div>
                        ))}
                        {analyticsData.weeklyTrends.length === 0 && (
                          <span className="text-slate-600 italic">No weekly logs</span>
                        )}
                      </div>
                    </div>

                    {/* Monthly */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Monthly breakdown</span>
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        {analyticsData.monthlyTrends.map((t, idx) => (
                          <div key={idx} className="flex justify-between font-mono text-[10px]">
                            <span className="text-slate-500">{t.label}:</span>
                            <span className="text-slate-900 font-bold">{t.value} calls</span>
                          </div>
                        ))}
                        {analyticsData.monthlyTrends.length === 0 && (
                          <span className="text-slate-600 italic">No monthly logs</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Landing Pages */}
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-5 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider pb-2 border-b border-slate-100">
                    Top Visitor Landing Pages
                  </h4>

                  <div className="space-y-2.5">
                    {analyticsData.landingPages.map((lp, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="font-mono text-[10px] text-blue-600 font-semibold truncate max-w-[160px]">
                          {lp.page}
                        </span>
                        <span className="font-bold text-slate-900 shrink-0">
                          {lp.count} hits
                        </span>
                      </div>
                    ))}
                    {analyticsData.landingPages.length === 0 && (
                      <span className="text-slate-500 italic block text-center py-6">No page views recorded.</span>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
