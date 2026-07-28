import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, Globe, Clock, Camera, ArrowRight, ShieldCheck, AlertCircle, Lock } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { updateProfile } from "@/features/auth/services/profile.service";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "NL", name: "Netherlands" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Universal Coordinated Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada) - EST/EDT" },
  { value: "America/Chicago", label: "Central Time (US & Canada) - CST/CDT" },
  { value: "America/Denver", label: "Mountain Time (US & Canada) - MST/MDT" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada) - PST/PDT" },
  { value: "Europe/London", label: "London, Dublin, Lisbon - GMT/BST" },
  { value: "Europe/Paris", label: "Paris, Berlin, Amsterdam - CET/CEST" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AEST)" },
];

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuthContext();

  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Account Owner";
  const email = profile?.email || user?.email || "";

  const [phone, setPhone] = useState(profile?.phone || profile?.phone_number || "");
  const [country, setCountry] = useState(profile?.country || "US");
  const [timezone, setTimezone] = useState(
    profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || "");

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (profile?.phone || profile?.phone_number) {
      setPhone(profile.phone || profile.phone_number);
    }
    if (profile?.country) setCountry(profile.country);
    if (profile?.timezone) setTimezone(profile.timezone);
    if (profile?.avatar_url) setAvatarPreview(profile.avatar_url);
  }, [profile]);

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image file size must be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (!phone.trim()) {
      errors.phone = "Phone number is required.";
    }

    if (!country.trim()) {
      errors.country = "Country is required.";
    }

    if (!timezone.trim()) {
      errors.timezone = "Timezone is required.";
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

      // Save inside profiles table & update current_onboarding_step = 2
      if (user?.id) {
        await updateProfile(user.id, {
          phone: phone.trim(),
          phone_number: phone.trim(),
          country: country.trim(),
          timezone: timezone.trim(),
          avatar_url: avatarPreview || null,
          current_onboarding_step: 2,
          updated_at: new Date().toISOString(),
        });

        await refreshProfile();
      }

      // Redirect to /onboarding/business
      navigate("/onboarding/business", { replace: true });
    } catch (error) {
      console.error("Profile onboarding error:", error);
      setErrorMsg(error.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto bg-white/85 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8"
    >
      {/* Step Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Personal Profile Setup
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
          Verify your contact information and preferences to setup your owner account.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Optional Profile Photo */}
        <div className="flex flex-col items-center justify-center space-y-2 pb-2">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-fuchsia-200 overflow-hidden flex items-center justify-center shadow-inner">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-950 text-white shadow-md hover:bg-fuchsia-600 transition-colors cursor-pointer">
              <Camera className="w-4 h-4" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Profile Photo (Optional)</span>
        </div>

        {/* Read-Only Full Name */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" /> Full Name
            </label>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" /> Read-Only
            </span>
          </div>
          <input
            type="text"
            readOnly
            value={fullName}
            className="w-full rounded-2xl border border-slate-200 bg-slate-100/90 px-4 py-3.5 text-sm text-slate-600 font-semibold cursor-not-allowed outline-none shadow-inner"
          />
        </div>

        {/* Read-Only Email */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" /> Email Address
            </label>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" /> Read-Only
            </span>
          </div>
          <input
            type="email"
            readOnly
            value={email}
            className="w-full rounded-2xl border border-slate-200 bg-slate-100/90 px-4 py-3.5 text-sm text-slate-600 font-semibold cursor-not-allowed outline-none shadow-inner"
          />
        </div>

        {/* Phone Number * */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-fuchsia-500" /> Phone Number <span className="text-fuchsia-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
            }}
            className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all ${
              fieldErrors.phone
                ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
            }`}
          />
          {fieldErrors.phone && (
            <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.phone}
            </p>
          )}
        </div>

        {/* Country * */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-fuchsia-500" /> Country <span className="text-fuchsia-500">*</span>
          </label>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              if (fieldErrors.country) setFieldErrors((prev) => ({ ...prev, country: "" }));
            }}
            className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all cursor-pointer ${
              fieldErrors.country
                ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
            }`}
          >
            <option value="">Select Country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          {fieldErrors.country && (
            <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.country}
            </p>
          )}
        </div>

        {/* Timezone * */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-fuchsia-500" /> Timezone <span className="text-fuchsia-500">*</span>
          </label>
          <select
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              if (fieldErrors.timezone) setFieldErrors((prev) => ({ ...prev, timezone: "" }));
            }}
            className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all cursor-pointer ${
              fieldErrors.timezone
                ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "border-slate-200 bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
            }`}
          >
            <option value="">Select Timezone</option>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {fieldErrors.timezone && (
            <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pl-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.timezone}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-4 text-sm shadow-xl shadow-slate-900/15 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer mt-6"
        >
          {loading ? (
            <span>Saving Profile...</span>
          ) : (
            <>
              <span>Save & Continue to Business Setup</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Saves profiles table & updates current_onboarding_step = 2
      </div>
    </motion.div>
  );
}
