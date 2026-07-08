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
import { motion } from "framer-motion";
import toast from "react-hot-toast";

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

  const [activeTab, setActiveTab] = useState("general"); // "general" | "smtp" | "branding" | "video" | "security" | "maintenance"

  // Platform states (General)
  const [platformFee, setPlatformFee] = useState("5.0");
  const [minPayout, setMinPayout] = useState("1000");
  const [supportEmail, setSupportEmail] = useState("admin@bridgeone.com");
  const [terms, setTerms] = useState("");

  // SMTP states
  const [smtpHost, setSmtpHost] = useState("smtp.mailgun.org");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("postmaster@bridgeone.com");
  const [smtpPass, setSmtpPass] = useState("••••••••••••••••");

  // Branding states
  const [appName, setAppName] = useState("BridgeOne Commerce");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [logoUrl, setLogoUrl] = useState("");

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

  // Sync settings
  useEffect(() => {
    if (settings) {
      setPlatformFee(settings.platform_fee.toString());
      setMinPayout(settings.min_payout.toString());
      setSupportEmail(settings.support_email);
      setTerms(settings.terms);
    }
  }, [settings]);

  // Save general settings
  async function handleSaveSettings(e) {
    e.preventDefault();
    await updateSettings.mutateAsync({
      platform_fee: parseFloat(platformFee) || 0,
      min_payout: parseFloat(minPayout) || 0,
      support_email: supportEmail,
      terms: terms
    });
  }

  // Generic Save for config tabs
  function handleGenericSave(e, sectionName) {
    e.preventDefault();
    toast.success(`${sectionName} configurations saved locally!`);
  }

  // Open plan editor
  function handleStartEditPlan(plan) {
    setEditingPlanId(plan.id);
    setEditPrice(plan.price.toString());
    setEditCallLimit(plan.call_limit === -1 ? "100" : plan.call_limit.toString());
    setEditUnlimitedCalls(plan.call_limit === -1);
    setEditCommission(plan.commission_rate.toString());
  }

  // Save edited plan
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
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-850" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white max-w-6xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Configurations</h1>
        <p className="mt-1 text-xs text-slate-400">Configure global app settings, video TURN channels, SMTP servers, and subscription tiers.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        
        {/* Left Column: Tab Selectors */}
        <div className="space-y-2 flex flex-col p-2 bg-slate-900/50 border border-slate-900 rounded-2xl self-start h-auto">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "general" ? "bg-blue-600 text-white" : "text-slate-450 hover:text-white"
            }`}
          >
            General & Subscriptions
          </button>
          
          <button
            onClick={() => setActiveTab("smtp")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "smtp" ? "bg-blue-600 text-white" : "text-slate-450 hover:text-white"
            }`}
          >
            SMTP / Email Settings
          </button>

          <button
            onClick={() => setActiveTab("branding")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "branding" ? "bg-blue-600 text-white" : "text-slate-450 hover:text-white"
            }`}
          >
            Branding & Logos
          </button>

          <button
            onClick={() => setActiveTab("video")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "video" ? "bg-blue-600 text-white" : "text-slate-455 hover:text-white"
            }`}
          >
            STUN / TURN Server
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "security" ? "bg-blue-600 text-white" : "text-slate-455 hover:text-white"
            }`}
          >
            Security & RBAC
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "maintenance" ? "bg-blue-600 text-white" : "text-slate-455 hover:text-white"
            }`}
          >
            Maintenance Mode
          </button>
        </div>

        {/* Right 3 Cols: Form Telemetries */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: GENERAL & PLAN SUBSCRIPTIONS */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 md:p-8 space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-blue-500" />
                  <span>General Configurations</span>
                </h2>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2 text-xs">
                    
                    {/* Default platform Fee */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-blue-400" />
                        <span>Default Commission Fee (%)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={platformFee}
                        onChange={(e) => setPlatformFee(e.target.value)}
                        className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Min Payout */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5 text-blue-400" />
                        <span>Min Payout Limit (₹)</span>
                      </label>
                      <input
                        type="number"
                        value={minPayout}
                        onChange={(e) => setMinPayout(e.target.value)}
                        className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Support Email */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-blue-400" />
                        <span>Global Support Email</span>
                      </label>
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Legal Rules */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Legal Onboarding terms
                      </label>
                      <textarea
                        rows={4}
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500 resize-none leading-relaxed"
                      />
                    </div>

                  </div>

                  <div className="border-t border-slate-900 pt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={updateSettings.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10"
                    >
                      {updateSettings.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Save General Configurations</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Plans Editor cards */}
              <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SaaS Subscription Limit Editor</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="rounded-xl border border-slate-900 bg-slate-950 p-4 space-y-3">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase">{plan.display_name}</h4>
                        <p className="text-sm font-black text-white mt-0.5">₹{plan.price}/mo</p>
                      </div>
                      <div className="text-[10px] text-slate-450 border-t border-slate-900 pt-2 space-y-1">
                        <p>Call Limit: <span className="text-white font-bold">{plan.call_limit === -1 ? "Unlimited" : plan.call_limit}</span></p>
                        <p>Commission: <span className="text-white font-bold">{plan.commission_rate}%</span></p>
                      </div>
                      <button
                        onClick={() => handleStartEditPlan(plan)}
                        className="w-full text-center py-1.5 bg-blue-500/10 text-blue-400 hover:text-white border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                      >
                        Configure Limits
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMTP / EMAIL SETTINGS */}
          {activeTab === "smtp" && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 md:p-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span>SMTP Mailserver Settings</span>
              </h2>

              <form onSubmit={(e) => handleGenericSave(e, "SMTP")} className="space-y-6 text-xs">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Host Address</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Port</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Username</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-550 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Save Mail Configurations</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: BRANDING & LOGOS */}
          {activeTab === "branding" && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 md:p-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-500" />
                <span>Custom Portal Branding</span>
              </h2>

              <form onSubmit={(e) => handleGenericSave(e, "Branding")} className="space-y-6 text-xs">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Application name</label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Color (Hex)</label>
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-850 bg-slate-950 p-1 cursor-pointer outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Global Logo URL</label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://bucket.bridgeone.com/logos/main.png"
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-550 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Save Branding Configurations</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: STUN / TURN SERVER */}
          {activeTab === "video" && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 md:p-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span>WebRTC Video signalling parameters</span>
              </h2>

              <form onSubmit={(e) => handleGenericSave(e, "Video")} className="space-y-6 text-xs">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">STUN Server Host</label>
                    <input
                      type="text"
                      value={stunServer}
                      onChange={(e) => setStunServer(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">TURN Server Host</label>
                    <input
                      type="text"
                      value={turnServer}
                      onChange={(e) => setTurnServer(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">TURN Server Username</label>
                    <input
                      type="text"
                      value={turnUser}
                      onChange={(e) => setTurnUser(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">TURN Server Secret Credentials</label>
                    <input
                      type="password"
                      value={turnSecret}
                      onChange={(e) => setTurnSecret(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-550 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Save Signal Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: SECURITY & RBAC */}
          {activeTab === "security" && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 md:p-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-500" />
                <span>Access Security Rules</span>
              </h2>

              <form onSubmit={(e) => handleGenericSave(e, "Security")} className="space-y-6 text-xs">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Min Password Characters Length</label>
                    <input
                      type="number"
                      value={minPassLen}
                      onChange={(e) => setMinPassLen(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Session Token Expiry Timeout (Minutes)</label>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="flex items-center gap-2 text-slate-350 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={mfaEnabled}
                        onChange={(e) => setMfaEnabled(e.target.checked)}
                        className="rounded border-slate-850 bg-slate-950 text-blue-600 h-4 w-4 focus:ring-blue-550"
                      />
                      <span>Enforce Two-Factor Authentication (MFA Ready)</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-550 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Save Security Rules</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: MAINTENANCE MODE */}
          {activeTab === "maintenance" && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 md:p-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
                <Flame className="h-4 w-4 text-blue-500" />
                <span>System Maintenance Modes</span>
              </h2>

              <form onSubmit={(e) => handleGenericSave(e, "Maintenance")} className="space-y-6 text-xs">
                <div className="space-y-4">
                  <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="rounded border-slate-850 bg-slate-950 text-blue-600 h-4.5 w-4.5 focus:ring-blue-550"
                    />
                    <span className="text-red-400">Trigger Maintenance Mode (Go offline)</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Customer-Facing Warning Banner Notice</label>
                    <textarea
                      rows={4}
                      value={maintenanceNotice}
                      onChange={(e) => setMaintenanceNotice(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-955 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-blue-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-555 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Apply Maintenance mode</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Editing Plan Modal Backdrop */}
      {editingPlanId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-6 shadow-2xl"
          >
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Configure {plans.find(p => p.id === editingPlanId)?.display_name}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">Update plan pricing thresholds and usage limits dynamically.</p>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              
              {/* Monthly Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-indigo-400" />
                  <span>Monthly Price (₹)</span>
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Call Limit */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3 w-3 text-indigo-400" />
                  <span>Monthly Consultation Call Limit</span>
                </label>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUnlimitedCalls}
                      onChange={(e) => setEditUnlimitedCalls(e.target.checked)}
                      className="rounded border-slate-850 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Unlimited Sessions</span>
                  </label>
                </div>

                {!editUnlimitedCalls && (
                  <input
                    type="number"
                    value={editCallLimit}
                    onChange={(e) => setEditCallLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Commission rate */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="h-3 w-3 text-indigo-400" />
                  <span>Transaction Commission Fee (%)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editCommission}
                  onChange={(e) => setEditCommission(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-900 pt-4 flex gap-3 justify-end text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditingPlanId(null)}
                  className="px-4 py-2 border border-slate-850 rounded-xl text-slate-450 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePlan.isPending}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-505 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/10"
                >
                  {updatePlan.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Configurations
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
