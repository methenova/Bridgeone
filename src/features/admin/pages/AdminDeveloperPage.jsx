import { useState } from "react";
import { 
  Code, 
  Key, 
  Send, 
  Clock, 
  Terminal, 
  Cpu, 
  Eye, 
  Copy, 
  Check, 
  Plus, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function AdminDeveloperPage() {
  const [activeTab, setActiveTab] = useState("webhooks"); // "webhooks" | "api" | "env"
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhook form states
  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      url: "https://api.merchant.com/bridgeone-receiver",
      events: ["call.started", "call.ended"],
      status: "Active",
      secret: "whsec_NikeIndiaSecureWebhookSecretToken"
    }
  ]);
  const [newUrl, setNewUrl] = useState("");
  const [submittingWebhook, setSubmittingWebhook] = useState(false);

  // Mock Developer Integration logs (Webhook deliveries)
  const deliveryLogs = [
    { id: 1, event: "call.started", url: "https://api.merchant.com/bridgeone-receiver", status: 200, time: "Just now" },
    { id: 2, event: "call.ended", url: "https://api.merchant.com/bridgeone-receiver", status: 200, time: "4 mins ago" },
    { id: 3, event: "order.created", url: "https://test.shop.org/webhooks", status: 500, time: "12 mins ago" }
  ];

  // Mock API credentials
  const apiKeys = [
    { name: "Production Key", token: "b1_pk_live_4ea2ad293fbe4e6f907b362e3e14d2cd", created: "04-Jul-2026", status: "Active" },
    { name: "Development Sandbox", token: "b1_pk_test_907b362e3e14d2cd4ea2ad293fbe4e6f", created: "01-Jul-2026", status: "Active" }
  ];

  // Add webhook
  function handleAddWebhook(e) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setSubmittingWebhook(true);
    setTimeout(() => {
      const newWebhook = {
        id: Date.now(),
        url: newUrl,
        events: ["call.started", "order.created"],
        status: "Active",
        secret: "whsec_" + Math.random().toString(36).substring(2, 15)
      };
      setWebhooks([...webhooks, newWebhook]);
      setNewUrl("");
      setSubmittingWebhook(false);
      toast.success("Webhook endpoint registered successfully!");
    }, 800);
  }

  // Delete webhook
  function handleDeleteWebhook(id) {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.success("Webhook endpoint unregistered");
  }

  // Copy helper
  function handleCopyText(text) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 1500);
  }

  return (
    <div className="space-y-6 text-white max-w-6xl relative">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Developer Center</h1>
        <p className="mt-1 text-xs text-slate-400">Configure real-time event webhooks, rotate API integration tokens, and view client variables.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-200/80 rounded-2xl self-start max-w-sm">
        <Button
          onClick={() => setActiveTab("webhooks")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "webhooks" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-white"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          Webhooks
        </Button>
        
        <Button
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "api" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-white"
          }`}
        >
          <Key className="h-3.5 w-3.5" />
          API Keys
        </Button>

        <Button
          onClick={() => setActiveTab("env")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "env" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-white"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          Environment
        </Button>
      </div>

      {/* Tab content 1: Webhooks */}
      {activeTab === "webhooks" && (
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Webhook form and list */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Create form */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Register Webhook Endpoint</h3>
                <p className="text-xs text-slate-500">Subscribe your backend server to receive live JSON payloads.</p>
              </div>

              <form onSubmit={handleAddWebhook} className="flex gap-3 text-xs">
                <input
                  type="url"
                  placeholder="https://api.yourdomain.com/webhooks"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none text-white focus:border-blue-500 transition-colors"
                  required
                />
                <Button
                  type="submit"
                  disabled={submittingWebhook}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-550 text-white font-bold cursor-pointer transition-all disabled:opacity-50"
                >
                  Register
                </Button>
              </form>
            </div>

            {/* Webhook List */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Webhook Subscriptions</h3>
              
              <div className="space-y-4">
                {webhooks.map(wh => (
                  <div key={wh.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-slate-200 text-xs font-bold truncate max-w-md">{wh.url}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Secret: <span className="font-mono">{wh.secret}</span></p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                          {wh.status}
                        </span>
                        
                        <Button
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Unregister Webhook"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100">
                      {wh.events.map(ev => (
                        <span key={ev} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-200 text-[9px] font-mono font-bold text-slate-400">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Col: Webhook Delivery logs */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery History</h3>
              <p className="text-xs text-slate-500">Live webhook transmission payload audits</p>
            </div>

            <div className="space-y-3 text-xs">
              {deliveryLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-white leading-normal">
                  <div>
                    <p className="font-bold text-white text-xs">{log.event}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">{log.url}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      log.status === 200 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {log.status}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab content 2: API Keys */}
      {activeTab === "api" && (
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Developer Platform Keys</h3>
              <p className="text-xs text-slate-500">Manage client connection authentication tokens securely.</p>
            </div>
            <Button
              onClick={() => toast.success("New developer API key generated successfully!")}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Generate New Key</span>
            </Button>
          </div>

          <div className="divide-y divide-slate-900">
            {apiKeys.map(key => (
              <div key={key.name} className="flex justify-between items-center py-4 text-xs">
                <div>
                  <p className="font-bold text-white text-sm">{key.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded block">
                      {key.token}
                    </code>
                    <Button
                      onClick={() => handleCopyText(key.token)}
                      className="text-slate-500 hover:text-white transition-colors bg-slate-900 border border-slate-200 p-1.5 rounded-lg cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                    {key.status}
                  </span>
                  <p className="text-[10px] text-slate-550 mt-1.5 font-semibold">Created: {key.created}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab content 3: Environment Variables */}
      {activeTab === "env" && (
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Environment Information</h3>
            <p className="text-xs text-slate-500">Global system runtime specifications (read-only).</p>
          </div>

          <div className="space-y-3.5 font-mono text-[11px] text-slate-400">
            <div className="flex justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-900">
              <span className="text-slate-500 uppercase font-bold">Node Environment</span>
              <span className="text-indigo-400 font-bold">production</span>
            </div>
            
            <div className="flex justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-900">
              <span className="text-slate-500 uppercase font-bold">Database Port host</span>
              <span className="text-indigo-400 font-bold">xrsujalzbvvlyplehdrm.supabase.co</span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-900">
              <span className="text-slate-500 uppercase font-bold">WebRTC STUN / TURN Host</span>
              <span className="text-indigo-400 font-bold">stun.l.google.com:19302 (Default fallback)</span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-900">
              <span className="text-slate-500 uppercase font-bold">Signalling Socket Protocol</span>
              <span className="text-indigo-400 font-bold">wss://xrsujalzbvvlyplehdrm.supabase.co/realtime</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
