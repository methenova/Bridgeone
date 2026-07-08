import { useState } from "react";
import { ShieldCheck, Mail, Percent, Landmark, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [platformFee, setPlatformFee] = useState("5.0");
  const [minPayout, setMinPayout] = useState("1000");
  const [supportEmail, setSupportEmail] = useState("admin@bridgeone.com");
  const [terms, setTerms] = useState("Standard marketplace platform rules apply.");
  const [saving, setSaving] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    if (!supportEmail.trim() || !supportEmail.includes("@")) {
      toast.error("Enter a valid support email address");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings updated successfully!");
    }, 800);
  }

  return (
    <div className="space-y-6 text-white max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Settings</h1>
        <p className="mt-1 text-xs text-slate-400">Configure global commissions, payouts, contact channels, and legal rules.</p>
      </div>

      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-8">
          
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Platform Fee */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-450" />
                <span>Platform Commission Fee (%)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                placeholder="5.0"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Fee percentage collected automatically on every order transaction.
              </p>
            </div>

            {/* Min Payout */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-4 w-4 text-blue-455" />
                <span>Min Payout Limit (₹)</span>
              </label>
              <input
                type="number"
                value={minPayout}
                onChange={(e) => setMinPayout(e.target.value)}
                placeholder="1000"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Minimum wallet threshold required for merchants to request cash withdrawals.
              </p>
            </div>

            {/* Support Email */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-455" />
                <span>Global Support Email Address</span>
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@bridgeone.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Platform-wide contact email displayed in help widgets and payout requests.
              </p>
            </div>

            {/* Terms & Conditions */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider">
                Platform Rules & Conditions Agreement
              </label>
              <textarea
                rows={5}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Describe platform rules..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 resize-none transition-colors"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Legal terms of service presented to merchants during onboarding.
              </p>
            </div>

          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-900 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-blue-500/10"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              <span>Save Configurations</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
