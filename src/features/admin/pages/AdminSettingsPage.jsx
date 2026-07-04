import { useState } from "react";
import { ShieldCheck, Mail, Percent, Landmark } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [platformFee, setPlatformFee] = useState("5.0");
  const [minPayout, setMinPayout] = useState("1000");
  const [supportEmail, setSupportEmail] = useState("admin@bridgeone.com");
  const [terms, setTerms] = useState("Standard marketplace platform rules apply.");

  function handleSave(e) {
    e.preventDefault();
    if (!supportEmail.trim() || !supportEmail.includes("@")) {
      toast.error("Enter a valid support email address");
      return;
    }
    toast.success("Settings updated successfully!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="mt-1 text-slate-400">Configure global marketplace variables and policy terms.</p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-slate-900 bg-slate-900/40 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Platform Fee */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5" /> Platform Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                placeholder="5.0"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Min Payout */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" /> Min Payout Limit (₹)
              </label>
              <input
                type="number"
                value={minPayout}
                onChange={(e) => setMinPayout(e.target.value)}
                placeholder="1000"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Support Email */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Global Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@bridgeone.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Terms & Conditions */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform Terms & Conditions</label>
              <textarea
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Describe platform rules..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 resize-none"
              />
            </div>

          </div>

          <div className="border-t border-slate-800 pt-5 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="h-4 w-4" />
              Save Settings
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
