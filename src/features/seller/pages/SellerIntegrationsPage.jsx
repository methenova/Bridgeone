import { useState, useEffect } from "react";
import { 
  Layers, 
  Store, 
  Send, 
  MessageSquare, 
  Key, 
  Globe, 
  ShieldAlert,
  Loader2,
  Save,
  Check,
  Copy,
  RefreshCw,
  Activity,
  Code
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function SellerIntegrationsPage() {
  const { shop, loading, reloadShop } = useSellerShop();
  const shopId = shop?.id;

  // Active Tab state
  const [activeTab, setActiveTab] = useState("apps"); // "apps" | "dev" | "pixels"

  // Form states
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [woocommerceUrl, setWoocommerceUrl] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Load settings
  useEffect(() => {
    if (shop) {
      setWebhookUrl(shop.webhook_url || "");
      setApiKey(shop.api_key || "");
      setGoogleAnalyticsId(shop.google_analytics_id || "");
      setMetaPixelId(shop.meta_pixel_id || "");
      setShopifyDomain(shop.shopify_domain || "");
      setWoocommerceUrl(shop.woocommerce_url || "");
    }
  }, [shop]);

  // General integrations save function
  async function handleSaveSettings(e) {
    if (e) e.preventDefault();
    if (!shopId || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          webhook_url: webhookUrl,
          api_key: apiKey,
          google_analytics_id: googleAnalyticsId,
          meta_pixel_id: metaPixelId,
          shopify_domain: shopifyDomain,
          woocommerce_url: woocommerceUrl
        })
        .eq("id", shopId);

      if (error) throw error;
      toast.success("Integrations configurations saved successfully!");
      reloadShop();
    } catch (err) {
      toast.error(err.message || "Failed to save integrations settings");
    } finally {
      setSaving(false);
    }
  }

  // Generate / Rotate API Key
  async function handleGenerateKey() {
    setGeneratingKey(true);
    const mockKey = "bo_live_" + Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join("");
    try {
      const { error } = await supabase
        .from("shops")
        .update({ api_key: mockKey })
        .eq("id", shopId);

      if (error) throw error;
      setApiKey(mockKey);
      toast.success("Developer API Key generated successfully!");
      reloadShop();
    } catch (err) {
      toast.error("Failed to generate API Key");
    } finally {
      setGeneratingKey(false);
    }
  }

  // Copy API key to clipboard
  function handleCopyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  // Test webhook endpoint
  async function handleTestWebhook() {
    if (!webhookUrl) {
      toast.error("Please enter a Webhook URL first!");
      return;
    }
    setTestingWebhook(true);
    try {
      // Send a test ping event
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "webhook.test", shopId, timestamp: new Date().toISOString() })
      });
      if (res.ok) {
        toast.success("Webhook test ping successful (200 OK)!");
      } else {
        toast.error(`Webhook endpoint returned status: ${res.status}`);
      }
    } catch (err) {
      toast.warn("Sent webhook test payload. Connection state logged.");
    } finally {
      setTestingWebhook(false);
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
          Please register your shop profile to integrate custom scripts and checkout APIs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">App Integrations</h1>
        <p className="mt-1 text-xs text-slate-500">Connect analytics trackers, e-commerce storefront webhooks, and generate developer API tokens.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 rounded-2xl self-start text-[10px] font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("apps")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "apps" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          }`}
        >
          E-Commerce & CRM Connectors
        </button>
        <button
          onClick={() => setActiveTab("dev")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "dev" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          }`}
        >
          API Keys & Webhooks
        </button>
        <button
          onClick={() => setActiveTab("pixels")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "pixels" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          }`}
        >
          Analytics & Pixels
        </button>
      </div>

      {/* Tab CONTENT 1: Platforms Ecommerce & CRM Connectors */}
      {activeTab === "apps" && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Left 2 Cols: Connectors list */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Shopify */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Storefront Sync</span>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-blue-500" />
                    <span>Shopify Integration</span>
                  </h4>
                </div>
                {shopifyDomain && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-bold uppercase">
                    Connected
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-500 leading-normal">
                Sync your Shopify inventory catalog directly inside calling consultation panels to display product cards to shoppers.
              </p>

              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 uppercase font-bold">Shopify Domain base URL</label>
                  <input
                    type="text"
                    value={shopifyDomain}
                    onChange={(e) => setShopifyDomain(e.target.value)}
                    placeholder="e.g. brand-name.myshopify.com"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-550 rounded-2xl text-white font-bold transition-all text-[10px] uppercase cursor-pointer"
                >
                  Save Connection
                </button>
              </div>
            </div>

            {/* WooCommerce */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">WordPress Sync</span>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span>WooCommerce Connector</span>
                  </h4>
                </div>
                {woocommerceUrl && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-bold uppercase">
                    Connected
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-500 leading-normal">
                Sync product links from your WordPress WooCommerce dashboard using WC Rest API.
              </p>

              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 uppercase font-bold">WooCommerce Site API URL</label>
                  <input
                    type="text"
                    value={woocommerceUrl}
                    onChange={(e) => setWoocommerceUrl(e.target.value)}
                    placeholder="https://merchant-store.com/wp-json/wc/v3/"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-550 rounded-2xl text-white font-bold transition-all text-[10px] uppercase cursor-pointer"
                >
                  Save WooCommerce
                </button>
              </div>
            </div>

          </div>

          {/* Right Col: Connection Status Health Monitors */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-5 space-y-5 text-xs">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Status Monitoring</span>
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                <span className="text-slate-500">Shopify Sync Connector</span>
                <span className={`h-2.5 w-2.5 rounded-full ${shopifyDomain ? "bg-emerald-500" : "bg-slate-300"}`} />
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                <span className="text-slate-500">WooCommerce WC API</span>
                <span className={`h-2.5 w-2.5 rounded-full ${woocommerceUrl ? "bg-emerald-500" : "bg-slate-300"}`} />
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                <span className="text-slate-500">Google Tag script</span>
                <span className={`h-2.5 w-2.5 rounded-full ${googleAnalyticsId ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                <span className="text-slate-500">Developer Webhooks endpoint</span>
                <span className={`h-2.5 w-2.5 rounded-full ${webhookUrl ? "bg-emerald-500" : "bg-slate-300"}`} />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab CONTENT 2: Developer Keys & Webhooks config */}
      {activeTab === "dev" && (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* API Keys */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-5 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Key className="h-4 w-4 text-blue-500" />
              <span>Developer API Credentials</span>
            </h4>
            <p className="text-slate-500 leading-normal">
              Generate keys to access the consultation rooms feeds and fetch orders metadata from external integrations.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey ? `**********************${apiKey.slice(-5)}` : "No credential generated"}
                  className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none font-mono"
                />
                
                {apiKey && (
                  <button
                    onClick={handleCopyKey}
                    className="px-3 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 hover:border-slate-300 rounded-2xl text-slate-500 hover:text-slate-900"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              <button
                onClick={handleGenerateKey}
                disabled={generatingKey}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-550 px-4 py-2 rounded-2xl font-bold text-white tracking-wide transition-all cursor-pointer text-[10px] uppercase"
              >
                {generatingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span>{apiKey ? "Regenerate API Key" : "Generate Key"}</span>
              </button>
            </div>
          </div>

          {/* Webhooks config */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-5 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Code className="h-4 w-4 text-blue-500" />
              <span>Events Webhooks</span>
            </h4>
            <p className="text-slate-500 leading-normal">
              Enter an external endpoint URL to receive POST alerts whenever customer consultations end or callbacks are triggered.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase font-bold">Webhook URL</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.your-backend.com/webhooks/bridgeone"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-550 rounded-2xl text-white font-bold transition-all text-[10px] uppercase cursor-pointer"
                >
                  Save Webhook URL
                </button>
                
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="px-4 py-2 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-slate-100 hover:border-slate-300 rounded-2xl text-slate-500 hover:text-slate-900 font-bold text-[10px] uppercase"
                >
                  {testingWebhook && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
                  Send Test Ping
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab CONTENT 3: Analytics script tracking pixels */}
      {activeTab === "pixels" && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm border-slate-100/80 hover:shadow-md transition-all duration-300 p-6 space-y-6 text-xs max-w-2xl">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
            <Globe className="h-4 w-4 text-blue-500" />
            <span>Third-Party Tracking scripts</span>
          </h4>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Google Analytics */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Google Analytics tracking Tag (Measurement ID)</label>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="e.g. G-XXXXXX"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Meta pixel */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Meta pixel ID (Facebook Ads Tag)</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="e.g. 104239857102"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-550 text-white px-5 py-2.5 rounded-2xl font-bold cursor-pointer transition-all"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Pixels Timings</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
