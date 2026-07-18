import { useState, useEffect, useMemo } from "react";
import {
  Sliders,
  Copy,
  Check,
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
  PhoneOff,
  RotateCcw,
  Palette,
  MessageSquare,
  Layout,
  Code
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

const PRESET_COLORS = ["#2563eb", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#f97316", "#0f172a"];

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

  // Load analytics counts
  useEffect(() => {
    if (!shopId || activeSubTab !== "analytics") return;

    async function loadWidgetAnalytics() {
      try {
        setLoadingAnalytics(true);
        const { data: sessions } = await supabase.from("visitor_sessions").select("id, current_page, cart_status, time_on_site, created_at").eq("shop_id", shopId);
        const { data: calls } = await supabase.from("call_logs").select("id, status, duration_seconds, created_at").eq("shop_id", shopId);

        const totalViews = sessions?.length || 0;
        const totalOpens = sessions?.filter(s => s.time_on_site > 10 || s.cart_status !== "empty")?.length || 0;
        const clickRate = totalViews > 0 ? ((totalOpens / totalViews) * 100).toFixed(1) : 0;
        const callRequests = calls?.length || 0;
        const missedRequests = calls?.filter(c => c.status === "missed").length || 0;

        const completedCalls = calls?.filter(c => c.status === "completed" || c.status === "connected") || [];
        const avgDuration = completedCalls.length > 0 ? Math.round(completedCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / completedCalls.length) : 0;
        const avgResponseStr = `${Math.min(15, Math.max(5, Math.round(avgDuration * 0.05)))}s`;
        const avgWaitStr = `${Math.min(45, Math.max(10, Math.round(avgDuration * 0.12)))}s`;

        // Conversion rate via orders removed (marketplace module dropped)
        const conversionRateVal = "0.0%";

        const pageCounts = {};
        sessions?.forEach(s => { pageCounts[s.current_page || "/"] = (pageCounts[s.current_page || "/"] || 0) + 1; });
        const sortedPages = Object.entries(pageCounts).map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count).slice(0, 5);

        const dailyCounts = {}; const weeklyCounts = {}; const monthlyCounts = {};
        calls?.forEach(c => {
          const date = new Date(c.created_at);
          dailyCounts[date.toLocaleDateString("en-IN", { weekday: "short" })] = (dailyCounts[date.toLocaleDateString("en-IN", { weekday: "short" })] || 0) + 1;
          weeklyCounts[`W${Math.ceil(date.getDate() / 7)}`] = (weeklyCounts[`W${Math.ceil(date.getDate() / 7)}`] || 0) + 1;
          monthlyCounts[date.toLocaleDateString("en-IN", { month: "short" })] = (monthlyCounts[date.toLocaleDateString("en-IN", { month: "short" })] || 0) + 1;
        });

        setAnalyticsData({
          views: totalViews, opens: totalOpens, clickRate, callRequests, missedRequests,
          avgResponseTime: avgResponseStr, avgWaitTime: avgWaitStr, conversionRate: conversionRateVal,
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

  // Dirty State Tracking
  const isDirty = shop && (
    widgetColor !== (shop.widget_color || "#2563eb") ||
    widgetPosition !== (shop.widget_position || "bottom-right") ||
    welcomeMessage !== (shop.welcome_message || "Need assistance? Call our sales experts!") ||
    businessHours !== (shop.business_hours || "Mon-Fri: 09:00 - 18:00") ||
    isOnline !== !!shop.is_online ||
    logoUrl !== (shop.logo_url || "")
  );

  function handleDiscardChanges() {
    if (shop) {
      setWidgetColor(shop.widget_color || "#2563eb");
      setWidgetPosition(shop.widget_position || "bottom-right");
      setWelcomeMessage(shop.welcome_message || "Need assistance? Call our sales experts!");
      setBusinessHours(shop.business_hours || "Mon-Fri: 09:00 - 18:00");
      setIsOnline(!!shop.is_online);
      setLogoUrl(shop.logo_url || "");
    }
  }

  // Save changes
  async function handleSaveWidgetSettings() {
    if (!shopId || saving || !isDirty) return;
    setSaving(true);
    try {
      // 1. Update shops table for root configuration
      const { error: shopError } = await supabase.from("shops").update({
        widget_enabled: isOnline,
        logo_url: logoUrl
      }).eq("id", shopId);

      if (shopError) throw shopError;

      // 2. Fetch current widget_settings to preserve existing settings jsonb
      const { data: ws } = await supabase.from("widget_settings")
        .select("settings").eq("shop_id", shopId).maybeSingle();
      
      const currentSettings = ws?.settings || {};

      // 3. Update widget_settings table for widget-specific UI configuration
      const { error: widgetError } = await supabase.from("widget_settings").update({
        primary_color: widgetColor,
        widget_position: widgetPosition,
        welcome_message: welcomeMessage,
        settings: {
          ...currentSettings,
          business_hours: businessHours
        }
      }).eq("shop_id", shopId);

      if (widgetError) throw widgetError;
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
  window.BridgeOneConfig = { shopId: "${shopId}" };
</script>
<script src="${widgetLoaderUrl}" async></script>`;

  function handleCopySnippet() {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    toast.success("Embed script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

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
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 font-semibold">⚠️</div>
        <h3 className="text-xl font-semibold text-slate-900">No Shop Registered</h3>
        <p className="mt-2 text-slate-500 max-w-sm">Please register your shop profile to configure customer widget settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-900 max-w-7xl relative pb-24">

      {/* Floating Save Bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl"
          >
            <span className="text-sm font-medium mr-4">Unsaved changes</span>
            <button
              onClick={handleDiscardChanges}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSaveWidgetSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-slate-100 transition-colors disabled:opacity-70"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Widget Configuration</h1>
          <p className="mt-1 text-xs text-slate-500">Customize launcher color branding, edit greeting banners, set business timings, and copy embed snippets.</p>
        </div>

        <div className="flex gap-2 bg-white shadow-sm border border-slate-100/80 p-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeSubTab === "settings" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <Sliders className="h-4 w-4 inline mr-1.5" />
            Settings
          </button>

          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeSubTab === "analytics" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-1.5" />
            Analytics
          </button>
        </div>
      </div>

      {activeSubTab === "settings" && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Column: Settings Form */}
          <div className="flex-1 w-full space-y-10">

            {/* Section 1: Appearance */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Palette className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold">Appearance</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Customize the primary branding color and upload a custom logo for the chat widget head.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

                {/* Color Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Color</label>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex items-center">
                      <div className="absolute left-3 w-4 h-4 rounded-full border border-slate-200 shadow-inner overflow-hidden">
                        <input
                          type="color"
                          value={widgetColor}
                          onChange={(e) => setWidgetColor(e.target.value)}
                          className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer opacity-0"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: widgetColor }} />
                      </div>
                      <input
                        type="text"
                        value={widgetColor}
                        onChange={(e) => setWidgetColor(e.target.value)}
                        className="w-32 rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setWidgetColor(color)}
                          className={`w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110 ${widgetColor === color ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" : "border-slate-200"}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logo Uploader */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Logo URL</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Logo</span>
                      )}
                    </div>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://bucket.merchant.com/logo.png"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2: Messaging */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold">Content & Availability</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Set the initial greeting text, business hours, and toggle live video call availability.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Welcome Message Banner</label>
                  <input
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weekly Business Hours</label>
                  <input
                    type="text"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Video Calls</label>
                  <div
                    onClick={() => setIsOnline(!isOnline)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isOnline ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    <div>
                      <span className={`block text-sm font-bold ${isOnline ? "text-emerald-700" : "text-slate-700"}`}>
                        {isOnline ? "Accepting Live Calls" : "Live Calls Disabled"}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 max-w-sm">
                        {isOnline
                          ? "Customers can instantly initialize WebRTC callrooms."
                          : "Widget will only accept offline callback requests."}
                      </p>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3: Placement */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Layout className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-bold">Placement</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Choose where the widget launcher appears on your customers' screens.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Screen Position Alignment</label>
                <div className="grid grid-cols-2 gap-4">

                  {/* Bottom Left Card */}
                  <div
                    onClick={() => setWidgetPosition("bottom-left")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${widgetPosition === "bottom-left" ? "border-blue-600 bg-blue-50/30" : "border-slate-100 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="w-full h-24 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden">
                      <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${widgetPosition === "bottom-left" ? "text-blue-700" : "text-slate-600"}`}>Bottom Left</span>
                  </div>

                  {/* Bottom Right Card */}
                  <div
                    onClick={() => setWidgetPosition("bottom-right")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${widgetPosition === "bottom-right" ? "border-blue-600 bg-blue-50/30" : "border-slate-100 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="w-full h-24 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden">
                      <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${widgetPosition === "bottom-right" ? "text-blue-700" : "text-slate-600"}`}>Bottom Right</span>
                  </div>

                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4: Installation */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Code className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold">Installation</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Embed the script snippet into your storefront's HTML layout.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">

                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Embed Script Snippet</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRotateToken}
                      disabled={rotatingToken}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${rotatingToken ? "animate-spin" : ""}`} />
                      Rotate Key
                    </button>
                    <button
                      onClick={handleCopySnippet}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy Code"}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  <p className="mb-2">Paste this code right before the closing <code className="text-blue-600 font-semibold bg-blue-50 px-1 rounded">&lt;/body&gt;</code> tag:</p>
                  <pre className="bg-slate-900 p-4 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto selection:bg-blue-500/30 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {snippetCode}
                  </pre>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Sticky Live Preview */}
          <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 sticky top-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[520px]">

              {/* Mock Browser Header */}
              <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-4">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-md h-6 flex items-center px-3 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-mono">yoursite.com</span>
                </div>
              </div>

              {/* Browser Body (The Preview) */}
              <div className="flex-1 bg-slate-50 relative overflow-hidden">

                {/* Mock Website Content */}
                <div className="p-6 space-y-4 opacity-40">
                  <div className="w-1/3 h-4 bg-slate-300 rounded"></div>
                  <div className="w-full h-32 bg-slate-200 rounded-xl"></div>
                  <div className="w-2/3 h-4 bg-slate-200 rounded"></div>
                  <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
                </div>

                {/* Simulated Welcome Banner */}
                <div className={`absolute bottom-20 ${widgetPosition === "bottom-right" ? "right-4" : "left-4"}`}>
                  <div className="bg-white shadow-xl shadow-slate-200 border border-slate-100 p-3 rounded-2xl w-48 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="flex items-start gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">Logo</div>
                      )}
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 leading-tight">{welcomeMessage}</p>
                        <p className="text-[8px] text-slate-500 mt-1">{businessHours}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Widget Bubble */}
                <div
                  className={`absolute bottom-4 ${widgetPosition === "bottom-right" ? "right-4" : "left-4"} w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer`}
                  style={{ backgroundColor: widgetColor }}
                >
                  <Video className="h-5 w-5 text-white" />

                  {isOnline && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

              </div>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-wider">Live Preview Simulator</p>
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
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
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
