import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Mail, Phone, Globe, Layers, MapPin, Building2, Hash, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { updateProfile } from "@/features/auth/services/profile.service";
import { saveTemporaryOnboardingState } from "@/features/onboarding/services/onboarding.service";

const BUSINESS_CATEGORIES = [
  { value: "fashion_apparel", label: "Fashion & Apparel" },
  { value: "beauty_cosmetics", label: "Beauty & Cosmetics" },
  { value: "luxury_jewelry", label: "Luxury & Jewelry" },
  { value: "electronics_tech", label: "Electronics & Tech" },
  { value: "home_living", label: "Home & Living" },
  { value: "health_wellness", label: "Health & Wellness" },
  { value: "automotive", label: "Automotive & Vehicles" },
  { value: "food_beverage", label: "Food & Gourmet Beverage" },
  { value: "other_retail", label: "Other High-Growth E-Commerce" },
];

export default function OnboardingBusinessPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuthContext();

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState(user?.email || "");
  const [businessPhone, setBusinessPhone] = useState(profile?.phone || profile?.phone_number || "");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessCategory, setBusinessCategory] = useState("fashion_apparel");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState(profile?.country || "US");
  const [gstNumber, setGstNumber] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Pre-populate with saved temporary metadata if exists
    const meta = profile?.onboarding_metadata || {};
    if (meta.businessName) setBusinessName(meta.businessName);
    if (meta.businessEmail) setBusinessEmail(meta.businessEmail);
    if (meta.businessPhone) setBusinessPhone(meta.businessPhone);
    if (meta.businessWebsite) setBusinessWebsite(meta.businessWebsite);
    if (meta.businessCategory) setBusinessCategory(meta.businessCategory);
    if (meta.address) setAddress(meta.address);
    if (meta.city) setCity(meta.city);
    if (meta.state) setState(meta.state);
    if (meta.country) setCountry(meta.country);
    if (meta.gstNumber) setGstNumber(meta.gstNumber);

    // Fallbacks if metadata is empty
    if (!meta.businessEmail && user?.email) {
      setBusinessEmail(user.email);
    }
    if (!meta.businessPhone && (profile?.phone || profile?.phone_number)) {
      setBusinessPhone(profile.phone || profile.phone_number);
    }
    if (!meta.country && profile?.country) {
      setCountry(profile.country);
    }
  }, [user, profile]);

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (!businessName.trim()) {
      errors.businessName = "Business Name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!businessEmail.trim() || !emailRegex.test(businessEmail.trim())) {
      errors.businessEmail = "Valid Business Email is required.";
    }

    if (!businessPhone.trim()) {
      errors.businessPhone = "Business Phone is required.";
    }

    if (!businessWebsite.trim()) {
      errors.businessWebsite = "Business Website is required.";
    }

    if (!businessCategory) {
      errors.businessCategory = "Business Category is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fix all required fields before continuing.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setFieldErrors({});

      const now = new Date().toISOString();

      // Save business details in profiles.onboarding_metadata
      await saveTemporaryOnboardingState(user.id, {
        businessName: businessName.trim(),
        businessEmail: businessEmail.trim(),
        businessPhone: businessPhone.trim(),
        businessWebsite: businessWebsite.trim(),
        businessCategory: businessCategory,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
        gstNumber: gstNumber.trim() || null,
      });

      // Update profiles current_onboarding_step = 3
      if (user?.id) {
        await updateProfile(user.id, {
          current_onboarding_step: 3,
          updated_at: now,
        });
        await refreshProfile();
      }

      // Redirect to /onboarding/workspace
      navigate("/onboarding/workspace", { replace: true });
    } catch (error) {
      console.error("Business onboarding save error:", error);
      setErrorMsg(error.message || "Failed to save business details. Please try again.");
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
          Business & Store Setup
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
          Enter your company details to generate your store configuration and live widget credentials.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Required Business Fields Section */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            Primary Business Info (Required)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Business Name * */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-fuchsia-500" /> Business Name <span className="text-fuchsia-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Luxury Apparel"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (fieldErrors.businessName) setFieldErrors((prev) => ({ ...prev, businessName: "" }));
                }}
                className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all ${
                  fieldErrors.businessName
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
                }`}
              />
              {fieldErrors.businessName && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.businessName}
                </p>
              )}
            </div>

            {/* Business Email * */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-fuchsia-500" /> Business Email <span className="text-fuchsia-500">*</span>
              </label>
              <input
                type="email"
                placeholder="support@acmeluxury.com"
                value={businessEmail}
                onChange={(e) => {
                  setBusinessEmail(e.target.value);
                  if (fieldErrors.businessEmail) setFieldErrors((prev) => ({ ...prev, businessEmail: "" }));
                }}
                className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all ${
                  fieldErrors.businessEmail
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
                }`}
              />
              {fieldErrors.businessEmail && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.businessEmail}
                </p>
              )}
            </div>

            {/* Business Phone * */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-fuchsia-500" /> Business Phone <span className="text-fuchsia-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+1 (800) 555-0199"
                value={businessPhone}
                onChange={(e) => {
                  setBusinessPhone(e.target.value);
                  if (fieldErrors.businessPhone) setFieldErrors((prev) => ({ ...prev, businessPhone: "" }));
                }}
                className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all ${
                  fieldErrors.businessPhone
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
                }`}
              />
              {fieldErrors.businessPhone && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.businessPhone}
                </p>
              )}
            </div>

            {/* Business Website * */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-fuchsia-500" /> Business Website <span className="text-fuchsia-500">*</span>
              </label>
              <input
                type="text"
                placeholder="https://acmeluxury.com"
                value={businessWebsite}
                onChange={(e) => {
                  setBusinessWebsite(e.target.value);
                  if (fieldErrors.businessWebsite) setFieldErrors((prev) => ({ ...prev, businessWebsite: "" }));
                }}
                className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all ${
                  fieldErrors.businessWebsite
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
                }`}
              />
              {fieldErrors.businessWebsite && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.businessWebsite}
                </p>
              )}
            </div>

            {/* Business Category * */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-fuchsia-500" /> Business Category <span className="text-fuchsia-500">*</span>
              </label>
              <select
                value={businessCategory}
                onChange={(e) => {
                  setBusinessCategory(e.target.value);
                  if (fieldErrors.businessCategory) setFieldErrors((prev) => ({ ...prev, businessCategory: "" }));
                }}
                className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all cursor-pointer ${
                  fieldErrors.businessCategory
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
                }`}
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {fieldErrors.businessCategory && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.businessCategory}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Optional Location & Tax Details Section */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            Location & Tax Information (Optional)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> Business Address
              </label>
              <input
                type="text"
                placeholder="100 Luxury Avenue, Suite 400"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" /> City
              </label>
              <input
                type="text"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" /> State / Province
              </label>
              <input
                type="text"
                placeholder="NY"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" /> Country
              </label>
              <input
                type="text"
                placeholder="United States"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
              />
            </div>

            {/* GST Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-slate-400" /> GST / Tax Number (Optional)
              </label>
              <input
                type="text"
                placeholder="22AAAAA0000A1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-4 text-sm shadow-xl shadow-slate-900/15 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer mt-6"
        >
          {loading ? (
            <span>Creating Shop & Credentials...</span>
          ) : (
            <>
              <span>Save & Continue to Workspace Setup</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Auto-generates shop_id, widget credentials & updates current_onboarding_step = 3
      </div>
    </motion.div>
  );
}
