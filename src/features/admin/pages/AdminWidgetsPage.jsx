import { useState, useMemo } from "react";
import { 
  Sliders, 
  Store, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  Copy, 
  Check, 
  Code, 
  Video, 
  Building,
  Eye,
  RefreshCw,
  Activity,
  Layers,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useAdminShops } from "../hooks/useAdmin";
import { supabase } from "@/config/supabase";
import { TableSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";

export default function AdminWidgetsPage() {
  const { data: shops = [], isLoading, refetch } = useAdminShops();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Snippet Modal state
  const [selectedShop, setSelectedShop] = useState(null);
  const [copied, setCopied] = useState(false);

  // Widget preview details modal state
  const [previewShop, setPreviewShop] = useState(null);
  const [widgetClicks, setWidgetClicks] = useState(0);

  // Toggle active widget status
  async function handleToggleWidget(shop) {
    const nextStatus = !shop.widget_enabled;
    try {
      const { error } = await supabase
        .from("shops")
        .update({ widget_enabled: nextStatus })
        .eq("id", shop.id);

      if (error) throw error;
      toast.success(`Widget for "${shop.shop_name}" is now ${nextStatus ? "Online" : "Offline"}`);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update widget status");
    }
  }

  // Copy Code snippet to clipboard
  function handleCopySnippet(shopId) {
    const hostUrl = window.location.origin;
    const snippet = `<!-- BridgeOne Live Video Widget Embed -->
<script>
  window.BridgeOneConfig = {
    shopId: "${shopId}"
  };
</script>
<script src="${hostUrl}/widget-loader.js" async></script>`;

    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Widget installation script copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  // Simulate API key regeneration
  function handleRegenerateKey(shopName) {
    if (window.confirm(`Are you sure you want to regenerate the API key token for "${shopName}"? This will invalidate the existing embedded script on the client store.`)) {
      toast.success("Security token rotated. Please update the embed code on the client store.");
    }
  }

  // Filter widgets
  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesSearch = 
        (shop.shop_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "online" && shop.widget_enabled) ||
        (statusFilter === "offline" && !shop.widget_enabled);

      return matchesSearch && matchesStatus;
    });
  }, [shops, searchQuery, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = shops.length;
    const online = shops.filter(s => s.widget_enabled).length;
    const offline = total - online;
    return { total, online, offline };
  }, [shops]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Widget Management</h1>
        <p className="mt-1 text-xs text-slate-500">View script integrations status, copy launcher embed codes, and rotate API security tokens.</p>
      </div>

      {/* Aggregate metrics */}
      <div className="grid gap-4 grid-cols-3 max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Integrations</p>
            <p className="text-xl font-bold tracking-tight text-slate-900">{stats.total}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Sliders className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Widgets Online</p>
            <p className="text-xl font-bold tracking-tight text-emerald-400">{stats.online}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Video className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Widgets Offline</p>
            <p className="text-xl font-bold tracking-tight text-slate-500">{stats.offline}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Sliders className="h-4.5 w-4.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Filter utility */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by store name or API Key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Widgets Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-5 align-middle">Widget Name</th>
                <th className="px-6 py-5 align-middle">Organization</th>
                <th className="px-6 py-5 align-middle">API Key (Shop ID)</th>
                <th className="px-6 py-5 align-middle">Status</th>
                <th className="px-6 py-5 align-middle text-right">Integrate Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
              {filteredShops.map((s, idx) => {
                const joinDate = s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN") : "—";
                
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={s.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Widget name */}
                    <td className="px-6 py-5 align-middle font-bold text-slate-900 flex items-center gap-2">
                      <Code className="h-4 w-4 text-indigo-400" />
                      <span>{s.shop_name} Call Widget</span>
                    </td>

                    {/* Org Name */}
                    <td className="px-6 py-5 align-middle font-semibold text-slate-700">{s.shop_name}</td>

                    {/* Api Key */}
                    <td className="px-6 py-5 align-middle">
                      <code className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded select-all font-bold">
                        {s.id}
                      </code>
                    </td>

                    {/* Status online/offline */}
                    <td className="px-6 py-5 align-middle">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        s.widget_enabled
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {s.widget_enabled ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-5 align-middle text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        
                        {/* Toggle active status */}
                        <button
                          type="button"
                          onClick={() => handleToggleWidget(s)}
                          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 ${
                            s.widget_enabled ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {s.widget_enabled ? (
                            <><Power className="h-4 w-4" /> Disable</>
                          ) : (
                            <><Power className="h-4 w-4" /> Enable</>
                          )}
                        </button>

                        {/* View Embed Code */}
                        <button
                          type="button"
                          onClick={() => setSelectedShop(s)}
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-blue-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 cursor-pointer"
                          title="View Embed Code"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {/* Rotate Security API Key */}
                        <button
                          type="button"
                          onClick={() => handleRegenerateKey(s.shop_name)}
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-amber-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 cursor-pointer"
                          title="Rotate API Key Token"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredShops.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Sliders className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No Integrations Found</p>
            </div>
          )}
        </div>
      </div>

      {/* SNIPPET MODAL */}
      <AnimatePresence>
        {selectedShop && (
          <div className="fixed inset-0 bg-white shadow-sm/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Embed Code Installation</h2>
                </div>
                <Button 
                  onClick={() => setSelectedShop(null)}
                  className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-500 leading-normal">
                  Copy and paste the HTML snippet below right before the closing <code className="text-indigo-400">&lt;/body&gt;</code> tag of your store's theme template code:
                </p>

                <div className="relative">
                  <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                    {`<!-- BridgeOne Live Video Widget Embed -->
<script>
  window.BridgeOneConfig = {
    shopId: "${selectedShop.id}"
  };
</script>
<script src="${window.location.origin}/widget-loader.js" async></script>`}
                  </pre>
                  
                  <Button
                    onClick={() => handleCopySnippet(selectedShop.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-slate-50 p-1.5 rounded-lg border border-slate-200"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end text-xs">
                <Button
                  onClick={() => setSelectedShop(null)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold cursor-pointer transition-all active:scale-[0.98]"
                >
                  Finished
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
