import { useState } from "react";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Pencil, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  MousePointer, 
  Scroll, 
  Globe, 
  Target, 
  Check, 
  X, 
  Eye, 
  TrendingUp, 
  HelpCircle,
  Zap,
  PhoneCall,
  MessageSquare,
  ExternalLink,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import useSellerShop from "../hooks/useSellerShop";
import { 
  usePopins, 
  useCreatePopin, 
  useUpdatePopin, 
  useDeletePopin, 
  useTogglePopinStatus 
} from "../hooks/usePopins";
import { POPIN_TEMPLATES } from "../services/popin.service";
import { TableSkeleton } from "@/components/skeletons";
import { Modal } from "@/components/common/Modal";

const THEME_COLORS = [
  "#2563eb", // Blue
  "#e11d48", // Rose/Red
  "#7c3aed", // Purple
  "#059669", // Emerald
  "#d97706", // Amber
  "#0891b2", // Cyan
  "#09090b", // Dark Slate
];

const DEFAULT_POPIN_FORM = {
  title: "",
  message: "",
  trigger_type: "delay",
  trigger_delay_seconds: 5,
  trigger_scroll_percent: 50,
  page_target_type: "all",
  page_target_urls: [],
  frequency_limit: "once_per_session",
  cta_text: "Talk to Expert Live",
  cta_action: "start_call",
  cta_url: "",
  theme_color: "#2563eb",
  template_type: "custom",
  is_active: true,
};

export default function SellerPopinsPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

  const { data: popins = [], isLoading: popinsLoading } = usePopins(shopId);
  const createPopinMutation = useCreatePopin(shopId);
  const updatePopinMutation = useUpdatePopin(shopId);
  const deletePopinMutation = useDeletePopin(shopId);
  const toggleStatusMutation = useTogglePopinStatus(shopId);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPopin, setEditingPopin] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_POPIN_FORM);
  const [urlInput, setUrlInput] = useState("");

  // Aggregate Metrics
  const totalPopins = popins.length;
  const activePopins = popins.filter((p) => p.is_active).length;
  const totalImpressions = popins.reduce((sum, p) => sum + (p.impressions_count || 0), 0);
  const totalConversions = popins.reduce((sum, p) => sum + (p.conversions_count || 0), 0);
  const conversionRate = totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(1) : "0.0";

  // Open Create Modal (Empty or Template)
  function handleOpenCreate(template = null) {
    setEditingPopin(null);
    if (template) {
      setFormData({
        ...DEFAULT_POPIN_FORM,
        title: template.title,
        message: template.message,
        trigger_type: template.trigger_type,
        trigger_delay_seconds: template.trigger_delay_seconds,
        trigger_scroll_percent: template.trigger_scroll_percent,
        page_target_type: template.page_target_type,
        page_target_urls: template.page_target_urls || [],
        frequency_limit: template.frequency_limit,
        cta_text: template.cta_text,
        cta_action: template.cta_action,
        cta_url: template.cta_url || "",
        theme_color: template.theme_color,
        template_type: template.template_type,
      });
    } else {
      setFormData(DEFAULT_POPIN_FORM);
    }
    setModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEdit(popin) {
    setEditingPopin(popin);
    setFormData({
      title: popin.title || "",
      message: popin.message || "",
      trigger_type: popin.trigger_type || "delay",
      trigger_delay_seconds: popin.trigger_delay_seconds || 5,
      trigger_scroll_percent: popin.trigger_scroll_percent || 50,
      page_target_type: popin.page_target_type || "all",
      page_target_urls: Array.isArray(popin.page_target_urls) ? popin.page_target_urls : [],
      frequency_limit: popin.frequency_limit || "once_per_session",
      cta_text: popin.cta_text || "Talk to Expert",
      cta_action: popin.cta_action || "start_call",
      cta_url: popin.cta_url || "",
      theme_color: popin.theme_color || "#2563eb",
      template_type: popin.template_type || "custom",
      is_active: popin.is_active ?? true,
    });
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingPopin(null);
    setUrlInput("");
  }

  // Add/Remove Target URLs
  function handleAddUrl() {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;
    if (formData.page_target_urls.includes(cleanUrl)) {
      toast.error("URL pattern is already added.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      page_target_urls: [...prev.page_target_urls, cleanUrl],
    }));
    setUrlInput("");
  }

  function handleRemoveUrl(index) {
    setFormData((prev) => {
      const updated = [...prev.page_target_urls];
      updated.splice(index, 1);
      return { ...prev, page_target_urls: updated };
    });
  }

  // Submit Form
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please enter a title and message for your popin.");
      return;
    }

    if (editingPopin) {
      await updatePopinMutation.mutateAsync({
        popinId: editingPopin.id,
        data: formData,
      });
    } else {
      await createPopinMutation.mutateAsync(formData);
    }

    handleCloseModal();
  }

  // Delete
  async function handleDelete(popin) {
    if (!window.confirm(`Delete popin rule "${popin.title}"? This cannot be undone.`)) return;
    await deletePopinMutation.mutateAsync(popin.id);
  }

  // Toggle Active
  async function handleToggleStatus(popin) {
    await toggleStatusMutation.mutateAsync({
      popinId: popin.id,
      is_active: !popin.is_active,
    });
  }

  const isSaving = createPopinMutation.isPending || updatePopinMutation.isPending;

  if (shopLoading || popinsLoading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-8 max-w-7xl">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-blue-600" /> Proactive Popins
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            Trigger automated engagement banners with delay timers, exit-intent detection, and page targeting.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreate()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create New Popin
        </button>
      </div>

      {/* Analytics Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Popins</span>
          <p className="text-2xl font-extrabold text-slate-900">{totalPopins}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Rules</span>
          <p className="text-2xl font-extrabold text-emerald-600">{activePopins}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Impressions</span>
          <p className="text-2xl font-extrabold text-blue-600">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Conversion</span>
          <p className="text-2xl font-extrabold text-purple-600">{conversionRate}%</p>
        </div>
      </div>

      {/* Quick-Start Templates Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pre-Built Popin Templates</h3>
            <p className="text-xs text-slate-500">Click a template to launch a high-converting proactive trigger in seconds.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POPIN_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleOpenCreate(tmpl)}
              className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tmpl.theme_color }}
                />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {tmpl.trigger_type}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                {tmpl.title}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {tmpl.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Popins Table / Roster */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Active Popin Rules</h3>
          <span className="text-xs font-semibold text-slate-500">
            {popins.length} Rule{popins.length !== 1 ? "s" : ""} Configured
          </span>
        </div>

        {popins.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No Popin Rules Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first proactive popin or select a template above to start engaging shoppers dynamically!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Popin Rule</th>
                  <th className="px-6 py-4">Trigger & Frequency</th>
                  <th className="px-6 py-4">Page Target</th>
                  <th className="px-6 py-4">CTA & Action</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {popins.map((popin) => (
                  <tr key={popin.id} className="hover:bg-slate-50/50">
                    {/* Title & Message */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: popin.theme_color || "#2563eb" }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{popin.title}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{popin.message}</p>
                        </div>
                      </div>
                    </td>

                    {/* Trigger & Frequency */}
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {popin.trigger_type === "delay" && <Clock className="w-3.5 h-3.5 text-blue-600" />}
                        {popin.trigger_type === "exit_intent" && <MousePointer className="w-3.5 h-3.5 text-rose-600" />}
                        {popin.trigger_type === "scroll" && <Scroll className="w-3.5 h-3.5 text-purple-600" />}
                        <span className="capitalize">
                          {popin.trigger_type === "delay"
                            ? `Delay: ${popin.trigger_delay_seconds || 5}s`
                            : popin.trigger_type === "scroll"
                            ? `Scroll: ${popin.trigger_scroll_percent || 50}%`
                            : "Exit-Intent"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        {popin.frequency_limit?.replace(/_/g, " ")}
                      </p>
                    </td>

                    {/* Target */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {popin.page_target_type === "all" ? (
                          <>
                            <Globe className="w-3 h-3 text-slate-500" /> All Pages
                          </>
                        ) : (
                          <>
                            <Target className="w-3 h-3 text-blue-600" /> {popin.page_target_type} ({popin.page_target_urls?.length || 0})
                          </>
                        )}
                      </span>
                    </td>

                    {/* CTA */}
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-bold text-slate-900">{popin.cta_text}</p>
                      <p className="text-[10px] text-blue-600 font-mono font-semibold uppercase">
                        {popin.cta_action}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(popin)}
                        className="inline-flex items-center gap-1 cursor-pointer"
                      >
                        {popin.is_active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(popin)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Edit Popin"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(popin)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Popin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popin Configuration Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingPopin ? "Edit Proactive Popin Rule" : "Create Proactive Popin Rule"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Form Fields */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Title & Message */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Popin Header & Message</label>
                <input
                  type="text"
                  placeholder="Popin Title (e.g. Special Discount Offer)"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                />
                <textarea
                  rows={3}
                  placeholder="Popin Body Message (e.g. Talk to our live advisor for a 15% discount)..."
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Theme Color Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Theme Accent Color</label>
                <div className="flex items-center gap-2">
                  {THEME_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, theme_color: col }))}
                      className={`h-7 w-7 rounded-full transition-transform cursor-pointer border-2 ${
                        formData.theme_color === col ? "scale-110 border-slate-900 shadow-md" : "border-transparent"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, theme_color: e.target.value }))}
                    className="h-7 w-7 rounded-full border-none cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              {/* Trigger Type & Delay */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trigger Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "delay", label: "Delay Timer", icon: Clock },
                    { id: "exit_intent", label: "Exit Intent", icon: MousePointer },
                    { id: "scroll", label: "Scroll Depth", icon: Scroll },
                  ].map((trig) => {
                    const IconComp = trig.icon;
                    return (
                      <button
                        key={trig.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, trigger_type: trig.id }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          formData.trigger_type === trig.id
                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        {trig.label}
                      </button>
                    );
                  })}
                </div>

                {formData.trigger_type === "delay" && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Delay Seconds</span>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={formData.trigger_delay_seconds}
                      onChange={(e) => setFormData((prev) => ({ ...prev, trigger_delay_seconds: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {formData.trigger_type === "scroll" && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Scroll Depth Percentage (%)</span>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={formData.trigger_scroll_percent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, trigger_scroll_percent: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Page Targeting & Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Page Target</label>
                  <select
                    value={formData.page_target_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, page_target_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="all">All Pages</option>
                    <option value="contains">URL Contains</option>
                    <option value="exact">Exact URL</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Frequency Limit</label>
                  <select
                    value={formData.frequency_limit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, frequency_limit: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="once_per_session">Once Per Session</option>
                    <option value="once_per_day">Once Per Day</option>
                    <option value="always">Always Show</option>
                  </select>
                </div>
              </div>

              {formData.page_target_type !== "all" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add URL pattern (e.g. /checkout, /products)..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 hover:bg-slate-200 shrink-0 cursor-pointer"
                    >
                      Add Pattern
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.page_target_urls.map((urlPattern, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                        {urlPattern}
                        <button type="button" onClick={() => handleRemoveUrl(idx)} className="hover:text-rose-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Action & Label */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CTA Action</label>
                  <select
                    value={formData.cta_action}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cta_action: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="start_call">Start Live Video Call</option>
                    <option value="open_chat">Open Chat Widget</option>
                    <option value="redirect">Redirect Custom URL</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CTA Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Talk to Expert"
                    value={formData.cta_text}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cta_text: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Live Interactive Card Preview */}
            <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Live Popin Storefront Preview</span>
                
                {/* Simulated Storefront Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: formData.theme_color }}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Proactive Offer
                    </span>
                    <button type="button" className="text-slate-400 hover:text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900">
                    {formData.title || "Popin Title"}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {formData.message || "Popin message text preview goes here..."}
                  </p>

                  <button
                    type="button"
                    style={{ backgroundColor: formData.theme_color }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {formData.cta_action === "start_call" && <PhoneCall className="w-3.5 h-3.5" />}
                    {formData.cta_action === "open_chat" && <MessageSquare className="w-3.5 h-3.5" />}
                    {formData.cta_action === "redirect" && <ExternalLink className="w-3.5 h-3.5" />}
                    {formData.cta_text || "Action"}
                  </button>
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">⚡ Storefront Trigger Settings:</p>
                <p>• Trigger: {formData.trigger_type} ({formData.trigger_type === "delay" ? `${formData.trigger_delay_seconds}s` : `${formData.trigger_scroll_percent}%`})</p>
                <p>• Target: {formData.page_target_type}</p>
                <p>• Limit: {formData.frequency_limit?.replace(/_/g, " ")}</p>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-60"
            >
              {editingPopin ? "Save Popin Rule" : "Create Popin Rule"}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
