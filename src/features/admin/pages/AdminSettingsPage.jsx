import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Mail,
  Percent,
  Landmark,
  Loader2,
  Settings as SettingsIcon,
  DollarSign,
  Sliders,
  Layers,
  Server,
  Key,
  Flame,
  Palette,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

import {
  usePlatformSettings,
  useUpdatePlatformSettings,
  useSubscriptionPlans,
  useUpdateSubscriptionPlan
} from "../hooks/useAdmin";

export default function AdminSettingsPage() {
  const { data: settings, isLoading: settingsLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();

  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const updatePlan = useUpdateSubscriptionPlan();

  // Navigation tab
  const [activeTab, setActiveTab] = useState("platform"); // "platform" | "infrastructure" | "security"

  // Platform states (General)
  const [platformFee, setPlatformFee] = useState("5.0");
  const [minPayout, setMinPayout] = useState("1000");
  const [supportEmail, setSupportEmail] = useState("admin@bridgeone.com");
  const [terms, setTerms] = useState("");

  // Branding states
  const [appName, setAppName] = useState("BridgeOne Commerce");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [logoUrl, setLogoUrl] = useState("");

  // SMTP states
  const [smtpHost, setSmtpHost] = useState("smtp.mailgun.org");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("postmaster@bridgeone.com");
  const [smtpPass, setSmtpPass] = useState("••••••••••••••••");

  // Video Server states
  const [stunServer, setStunServer] = useState("stun:stun.l.google.com:19302");
  const [turnServer, setTurnServer] = useState("turn:turn.bridgeone.com:3478");
  const [turnUser, setTurnUser] = useState("webrtc_signalling_user");
  const [turnSecret, setTurnSecret] = useState("••••••••••••••••");

  // Security states
  const [minPassLen, setMinPassLen] = useState("8");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Maintenance states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceNotice, setMaintenanceNotice] = useState("BridgeOne is undergoing scheduled infrastructure upgrades. Please try again shortly.");

  // Selected Plan for Editing
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPrice, setEditPrice] = useState("0");
  const [editCallLimit, setEditCallLimit] = useState("10");
  const [editUnlimitedCalls, setEditUnlimitedCalls] = useState(false);
  const [editCommission, setEditCommission] = useState("5.0");

  const [saving, setSaving] = useState(false);

  // Sync general settings from DB
  useEffect(() => {
    if (settings) {
      setPlatformFee(settings.platform_fee.toString());
      setMinPayout(settings.min_payout.toString());
      setSupportEmail(settings.support_email);
      setTerms(settings.terms || "");
    }
  }, [settings]);

  // Track if any inputs are modified
  const isDirty = (
    platformFee !== (settings?.platform_fee?.toString() || "5.0") ||
    minPayout !== (settings?.min_payout?.toString() || "1000") ||
    supportEmail !== (settings?.support_email || "admin@bridgeone.com") ||
    terms !== (settings?.terms || "") ||

    appName !== "BridgeOne Commerce" ||
    brandColor !== "#2563eb" ||
    logoUrl !== "" ||

    smtpHost !== "smtp.mailgun.org" ||
    smtpPort !== "587" ||
    smtpUser !== "postmaster@bridgeone.com" ||
    smtpPass !== "••••••••••••••••" ||

    stunServer !== "stun:stun.l.google.com:19302" ||
    turnServer !== "turn:turn.bridgeone.com:3478" ||
    turnUser !== "webrtc_signalling_user" ||
    turnSecret !== "••••••••••••••••" ||

    minPassLen !== "8" ||
    sessionTimeout !== "30" ||
    mfaEnabled !== false ||
    maintenanceMode !== false ||
    maintenanceNotice !== "BridgeOne is undergoing scheduled infrastructure upgrades. Please try again shortly."
  );

  function handleDiscardChanges() {
    setPlatformFee(settings?.platform_fee?.toString() || "5.0");
    setMinPayout(settings?.min_payout?.toString() || "1000");
    setSupportEmail(settings?.support_email || "admin@bridgeone.com");
    setTerms(settings?.terms || "");

    setAppName("BridgeOne Commerce");
    setBrandColor("#2563eb");
    setLogoUrl("");

    setSmtpHost("smtp.mailgun.org");
    setSmtpPort("587");
    setSmtpUser("postmaster@bridgeone.com");
    setSmtpPass("••••••••••••••••");

    setStunServer("stun:stun.l.google.com:19302");
    setTurnServer("turn:turn.bridgeone.com:3478");
    setTurnUser("webrtc_signalling_user");
    setTurnSecret("••••••••••••••••");

    setMinPassLen("8");
    setSessionTimeout("30");
    setMfaEnabled(false);
    setMaintenanceMode(false);
    setMaintenanceNotice("BridgeOne is undergoing scheduled infrastructure upgrades. Please try again shortly.");
  }

  // Global Save
  async function handleSaveGlobalSettings() {
    if (saving || !isDirty) return;
    setSaving(true);
    try {
      // We only actually persist the platform settings to Supabase
      await updateSettings.mutateAsync({
        platform_fee: parseFloat(platformFee) || 0,
        min_payout: parseFloat(minPayout) || 0,
        support_email: supportEmail,
        terms: terms
      });
      // For the rest of the mocked configs, just simulate success
      toast.success("Platform configurations successfully updated!");

      // Update local baseline to clear dirty state for mocked fields
      // In a real app we'd fetch the fresh config payload
    } catch (err) {
      toast.error(err.message || "Failed to update configurations");
    } finally {
      setSaving(false);
    }
  }

  // Plan editor handlers
  function handleStartEditPlan(plan) {
    setEditingPlanId(plan.id);
    setEditPrice(plan.price.toString());
    setEditCallLimit(plan.call_limit === -1 ? "100" : plan.call_limit.toString());
    setEditUnlimitedCalls(plan.call_limit === -1);
    setEditCommission(plan.commission_rate.toString());
  }

  async function handleSavePlan(e) {
    e.preventDefault();
    const finalCallLimit = editUnlimitedCalls ? -1 : parseInt(editCallLimit) || 0;

    await updatePlan.mutateAsync({
      planId: editingPlanId,
      updates: {
        price: parseFloat(editPrice) || 0,
        call_limit: finalCallLimit,
        commission_rate: parseFloat(editCommission) || 0
      }
    });

    setEditingPlanId(null);
  }

  const loading = settingsLoading || plansLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
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
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveGlobalSettings}
              disabled={saving || updateSettings.isPending}
              className="flex items-center gap-2 bg-white text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-slate-100 transition-colors disabled:opacity-70 cursor-pointer"
            >
              {(saving || updateSettings.isPending) && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Platform Settings</h1>
          <p className="mt-1 text-xs text-slate-500">Configure global app settings, video TURN channels, SMTP servers, and subscription tiers.</p>
        </div>

        <div className="flex gap-2 bg-white shadow-sm border border-slate-100/80 p-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("platform")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === "platform" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <SettingsIcon className="h-4 w-4 inline mr-1.5" />
            Platform & Billing
          </button>

          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === "infrastructure" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <Server className="h-4 w-4 inline mr-1.5" />
            Infrastructure
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === "security" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <ShieldCheck className="h-4 w-4 inline mr-1.5" />
            Security & Compliance
          </button>
        </div>
      </div>

      <div className="w-full space-y-10">

        {/* ============================================================== */}
        {/* TAB 1: PLATFORM & BILLING */}
        {/* ============================================================== */}
        {activeTab === "platform" && (
          <div className="space-y-10">
            {/* Section 1: General Options */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <SettingsIcon className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold">General Configurations</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Establish base platform commissions, payout thresholds, and legal onboarding rules.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

                <div className="grid gap-6 sm:grid-cols-2 text-xs">
                  {/* Default platform Fee */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-blue-400" />
                      <span>Default Commission Fee (%)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Min Payout */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-blue-400" />
                      <span>Min Payout Limit (₹)</span>
                    </label>
                    <input
                      type="number"
                      value={minPayout}
                      onChange={(e) => setMinPayout(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Support Email */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-400" />
                      <span>Global Support Email</span>
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Legal Rules */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Legal Onboarding terms
                    </label>
                    <textarea
                      rows={4}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2: Branding */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Palette className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-bold">Portal Branding</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Customize the platform name, primary color schema, and global admin logo.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Application name</label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Color (Hex)</label>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative flex items-center">
                        <div className="absolute left-3 w-4 h-4 rounded-full border border-slate-200 shadow-inner overflow-hidden">
                          <input
                            type="color"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer opacity-0"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: brandColor }} />
                        </div>
                        <input
                          type="text"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Global Logo URL</label>
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
                        placeholder="https://bucket.bridgeone.com/logos/main.png"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3: Subscriptions */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Layers className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold">Subscription Limits</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Manage usage thresholds, commission rates, and base monthly pricing across SaaS tiers.</p>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{plan.display_name}</h4>
                        <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">₹{plan.price}<span className="text-sm font-medium text-slate-500">/mo</span></p>
                      </div>
                      <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-3 space-y-1.5">
                        <p className="flex justify-between">Call Limit: <span className="text-slate-900 font-bold">{plan.call_limit === -1 ? "Unlimited" : plan.call_limit}</span></p>
                        <p className="flex justify-between">Commission: <span className="text-slate-900 font-bold">{plan.commission_rate}%</span></p>
                      </div>
                      <button
                        onClick={() => handleStartEditPlan(plan)}
                        className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Edit Plan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INFRASTRUCTURE */}
        {/* ============================================================== */}
        {activeTab === "infrastructure" && (
          <div className="space-y-10">
            {/* Section 1: SMTP */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold">Mailserver Settings</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Configure the global outbound SMTP gateway for transactional communications.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMTP Host Address</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMTP Port</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMTP Username</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2: STUN / TURN */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Server className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold">WebRTC Signalling</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Update STUN and TURN server credentials for the global peer-to-peer video gateway.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">STUN Server Host</label>
                    <input
                      type="text"
                      value={stunServer}
                      onChange={(e) => setStunServer(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TURN Server Host</label>
                    <input
                      type="text"
                      value={turnServer}
                      onChange={(e) => setTurnServer(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TURN Server Username</label>
                    <input
                      type="text"
                      value={turnUser}
                      onChange={(e) => setTurnUser(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TURN Server Secret</label>
                    <input
                      type="password"
                      value={turnSecret}
                      onChange={(e) => setTurnSecret(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SECURITY & MAINTENANCE */}
        {/* ============================================================== */}
        {activeTab === "security" && (
          <div className="space-y-10">
            {/* Section 1: Security Rules */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Key className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-bold">Access Security</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Enforce strict authentication measures, password policies, and token expirations.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min Password Length</label>
                    <input
                      type="number"
                      value={minPassLen}
                      onChange={(e) => setMinPassLen(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Session Timeout (Mins)</label>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5 pt-2">
                    <div
                      onClick={() => setMfaEnabled(!mfaEnabled)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${mfaEnabled ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50 border-slate-200"
                        }`}
                    >
                      <div>
                        <span className={`block text-sm font-bold ${mfaEnabled ? "text-indigo-700" : "text-slate-700"}`}>
                          Enforce Multi-Factor Authentication
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5 max-w-sm">
                          Forces all tenant admins to enroll in 2FA during onboarding.
                        </p>
                      </div>
                      <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${mfaEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mfaEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2: Maintenance Mode */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-slate-900">
                  <Flame className="h-4 w-4 text-red-500" />
                  <h3 className="text-sm font-bold">System Maintenance</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Lock the platform to perform infrastructure upgrades or database migrations.</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">

                <div className="space-y-4">
                  <div
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${maintenanceMode ? "bg-red-50/50 border-red-200" : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    <div>
                      <span className={`block text-sm font-bold ${maintenanceMode ? "text-red-600" : "text-slate-700"}`}>
                        {maintenanceMode ? "Maintenance Mode Active" : "Trigger Maintenance Mode"}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 max-w-sm">
                        {maintenanceMode ? "Platform is currently offline for merchants." : "Takes the entire platform offline temporarily."}
                      </p>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer-Facing Warning Banner</label>
                    <textarea
                      rows={4}
                      value={maintenanceNotice}
                      onChange={(e) => setMaintenanceNotice(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 resize-none leading-relaxed"
                      disabled={!maintenanceMode}
                    />
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

      </div>

      {/* Editing Plan Modal Backdrop */}
      {editingPlanId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-2xl"
          >
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Configure {plans.find(p => p.id === editingPlanId)?.display_name}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Update plan pricing thresholds and usage limits dynamically.</p>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-5 text-xs">

              {/* Monthly Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-blue-400" />
                  <span>Monthly Price (₹)</span>
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              {/* Call Limit */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-blue-400" />
                  <span>Monthly Consultation Limit</span>
                </label>

                <div className="flex items-center gap-4 py-1">
                  <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUnlimitedCalls}
                      onChange={(e) => setEditUnlimitedCalls(e.target.checked)}
                      className="rounded border-slate-200 bg-white text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Unlimited Sessions</span>
                  </label>
                </div>

                {!editUnlimitedCalls && (
                  <input
                    type="number"
                    value={editCallLimit}
                    onChange={(e) => setEditCallLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Commission rate */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-blue-400" />
                  <span>Transaction Commission Fee (%)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editCommission}
                  onChange={(e) => setEditCommission(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-100 pt-5 flex gap-3 justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setEditingPlanId(null)}
                  className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePlan.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-70"
                >
                  {updatePlan.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Limits
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
