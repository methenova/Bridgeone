import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Clock, Languages, DollarSign, Users, ArrowRight, ShieldCheck, AlertCircle, Camera, TrendingUp } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { updateProfile } from "@/features/auth/services/profile.service";
import { saveTemporaryOnboardingState } from "@/features/onboarding/services/onboarding.service";

const LANGUAGES = [
  { code: "en", label: "English (US/UK)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "pt", label: "Portuguese (Português)" },
  { code: "ar", label: "Arabic (العربية)" },
];

const CURRENCIES = [
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", label: "AUD ($) - Australian Dollar" },
  { code: "SGD", label: "SGD ($) - Singapore Dollar" },
  { code: "AED", label: "AED - UAE Dirham" },
];

const EXPECTED_VISITORS_OPTIONS = [
  { value: "0-10k", label: "< 10,000 monthly store visitors" },
  { value: "10k-50k", label: "10,000 - 50,000 monthly store visitors" },
  { value: "50k-100k", label: "50,000 - 100,000 monthly store visitors" },
  { value: "100k+", label: "100,000+ monthly store visitors" },
];

const AGENT_COUNT_OPTIONS = [
  { value: "1-5", label: "1 - 5 Agents (Startup Team)" },
  { value: "6-20", label: "6 - 20 Agents (Growing Brand)" },
  { value: "21-50", label: "21 - 50 Agents (Mid-Market)" },
  { value: "50+", label: "50+ Agents (Enterprise Scale)" },
];

export default function OnboardingWorkspacePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuthContext();

  const [shopName, setShopName] = useState("");
  const [workingHours, setWorkingHours] = useState("Mon-Fri: 09:00 - 18:00");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [currency, setCurrency] = useState("USD");
  const [monthlyVisitors, setMonthlyVisitors] = useState("10k-50k");
  const [agentCount, setAgentCount] = useState("1-5");
  const [logoPreview, setLogoPreview] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const meta = profile?.onboarding_metadata || {};
    if (meta.shopName) setShopName(meta.shopName);
    else if (meta.businessName) setShopName(meta.businessName); // Fallback to Business Name

    if (meta.workingHours) setWorkingHours(meta.workingHours);
    if (meta.defaultLanguage) setDefaultLanguage(meta.defaultLanguage);
    if (meta.currency) setCurrency(meta.currency);
    if (meta.monthlyVisitors) setMonthlyVisitors(meta.monthlyVisitors);
    if (meta.agentCount) setAgentCount(meta.agentCount);
    if (meta.logoPreview) setLogoPreview(meta.logoPreview);
  }, [profile]);

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Logo image file size must be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (!shopName.trim()) {
      errors.shopName = "Shop Name is required.";
    }

    if (!workingHours.trim()) {
      errors.workingHours = "Working Hours are required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setFieldErrors({});

      const now = new Date().toISOString();

      // Save workspace details temporarily in profiles.onboarding_metadata
      await saveTemporaryOnboardingState(user.id, {
        shopName: shopName.trim(),
        workingHours: workingHours.trim(),
        defaultLanguage: defaultLanguage,
        currency: currency,
        monthlyVisitors: monthlyVisitors,
        agentCount: agentCount,
        logoPreview: logoPreview || null,
      });

      // Update profiles current_onboarding_step = 4
      if (user?.id) {
        await updateProfile(user.id, {
          current_onboarding_step: 4,
          updated_at: now,
        });
        await refreshProfile();
      }

      // Redirect to /onboarding/subscription
      navigate("/onboarding/subscription", { replace: true });
    } catch (error) {
      console.error("Error updating workspace setup:", error);
      setErrorMsg(error.message || "Failed to update shop workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white/85 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8"
    >
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Workspace Configuration
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
          Configure operating parameters, language, currency, and capacity for your live agent workspace.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Business Logo Upload */}
        <div className="flex flex-col items-center justify-center space-y-2 pb-2">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-fuchsia-200 overflow-hidden flex items-center justify-center shadow-inner">
              {logoPreview ? (
                <img src={logoPreview} alt="Business Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Store className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <label htmlFor="logo-upload" className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-slate-950 text-white shadow-md hover:bg-fuchsia-600 transition-colors cursor-pointer">
              <Camera className="w-4 h-4" />
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Business Logo (Optional)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Shop Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-fuchsia-500" /> Shop Name <span className="text-fuchsia-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Apparel Flagship Store"
              value={shopName}
              onChange={(e) => {
                setShopName(e.target.value);
                if (fieldErrors.shopName) setFieldErrors((prev) => ({ ...prev, shopName: "" }));
              }}
              className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all ${
                fieldErrors.shopName
                  ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
              }`}
            />
            {fieldErrors.shopName && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
                <AlertCircle className="w-3 h-3" /> {fieldErrors.shopName}
              </p>
            )}
          </div>

          {/* Working Hours */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-fuchsia-500" /> Working Hours <span className="text-fuchsia-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mon-Fri: 09:00 - 18:00 EST"
              value={workingHours}
              onChange={(e) => {
                setWorkingHours(e.target.value);
                if (fieldErrors.workingHours) setFieldErrors((prev) => ({ ...prev, workingHours: "" }));
              }}
              className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all ${
                fieldErrors.workingHours
                  ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
              }`}
            />
            {fieldErrors.workingHours && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
                <AlertCircle className="w-3 h-3" /> {fieldErrors.workingHours}
              </p>
            )}
          </div>

          {/* Default Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-fuchsia-500" /> Default Language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-fuchsia-500" /> Store Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all cursor-pointer"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Monthly Visitors */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-fuchsia-500" /> Expected Monthly Visitors
            </label>
            <select
              value={monthlyVisitors}
              onChange={(e) => setMonthlyVisitors(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all cursor-pointer"
            >
              {EXPECTED_VISITORS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Agents */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-fuchsia-500" /> Number of Agents
            </label>
            <select
              value={agentCount}
              onChange={(e) => setAgentCount(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all cursor-pointer"
            >
              {AGENT_COUNT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-4 text-sm shadow-xl shadow-slate-900/15 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer mt-6"
        >
          {loading ? (
            <span>Updating Workspace Config...</span>
          ) : (
            <>
              <span>Save & Continue to Plan Selection</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Updates shops table parameters & sets current_onboarding_step = 4
      </div>
    </motion.div>
  );
}
