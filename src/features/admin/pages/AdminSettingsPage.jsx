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
  Layers
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

  // Settings State
  const [platformFee, setPlatformFee] = useState("5.0");
  const [minPayout, setMinPayout] = useState("1000");
  const [supportEmail, setSupportEmail] = useState("admin@bridgeone.com");
  const [terms, setTerms] = useState("");

  // Selected Plan for Editing
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPrice, setEditPrice] = useState("0");
  const [editCallLimit, setEditCallLimit] = useState("10");
  const [editUnlimitedCalls, setEditUnlimitedCalls] = useState(false);
  const [editCommission, setEditCommission] = useState("5.0");

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setPlatformFee(settings.platform_fee.toString());
      setMinPayout(settings.min_payout.toString());
      setSupportEmail(settings.support_email);
      setTerms(settings.terms);
    }
  }, [settings]);

  // Save platform settings
  async function handleSaveSettings(e) {
    e.preventDefault();
    if (!supportEmail.trim() || !supportEmail.includes("@")) {
      toast.error("Enter a valid support email address");
      return;
    }
    
    await updateSettings.mutateAsync({
      platform_fee: parseFloat(platformFee) || 0,
      min_payout: parseFloat(minPayout) || 0,
      support_email: supportEmail,
      terms: terms
    });
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
    <div className="space-y-8 text-white max-w-5xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Settings</h1>
        <p className="mt-1 text-xs text-slate-400">Configure dynamic SaaS subscription tiers, commission rates, and payouts.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: Platform configurations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 md:p-8 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-blue-500" />
              <span>General Configurations</span>
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                
                {/* Platform Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-2">
                    <Percent className="h-3.5 w-3.5 text-blue-400" />
                    <span>Default Commission Fee (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500">
                    Fallback commission fee charged on transactions if the merchant has no tier commission.
                  </p>
                </div>

                {/* Min Payout */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-2">
                    <Landmark className="h-3.5 w-3.5 text-blue-450" />
                    <span>Min Payout Limit (₹)</span>
                  </label>
                  <input
                    type="number"
                    value={minPayout}
                    onChange={(e) => setMinPayout(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500">
                    Wallet threshold required for merchants to request Cash Withdrawals.
                  </p>
                </div>

                {/* Support Email */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-blue-455" />
                    <span>Global Support Email</span>
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
                    Rules & Onboarding Terms
                  </label>
                  <textarea
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 resize-none transition-colors"
                  />
                </div>

              </div>

              <div className="border-t border-slate-900 pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettings.isPending}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  <span>Save General Config</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: SaaS plan subscriptions editor */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span>SaaS Subscriptions Editor</span>
            </h2>

            {/* List plans */}
            <div className="space-y-4">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className="rounded-xl border border-slate-900 bg-slate-950 p-4 space-y-3 hover:border-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase text-slate-300">{plan.display_name}</h3>
                      <p className="text-xs font-black text-white mt-1">₹{plan.price}/mo</p>
                    </div>
                    <button
                      onClick={() => handleStartEditPlan(plan)}
                      className="text-[9px] uppercase tracking-wider font-extrabold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/25 transition-all cursor-pointer"
                    >
                      Configure
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-450 border-t border-slate-900/80 pt-2.5">
                    <div>
                      Call Limit: <span className="text-slate-200 font-bold">{plan.call_limit === -1 ? "Unlimited" : `${plan.call_limit} / mo`}</span>
                    </div>
                    <div>
                      Commission: <span className="text-slate-200 font-bold">{plan.commission_rate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

            <form onSubmit={handleSavePlan} className="space-y-4">
              
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
                  className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Call Limit */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3 w-3 text-indigo-400" />
                  <span>Monthly Consultation Call Limit</span>
                </label>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
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
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
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
                  className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="border-t border-slate-900 pt-4 flex gap-3 justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setEditingPlanId(null)}
                  className="px-4 py-2 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
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
