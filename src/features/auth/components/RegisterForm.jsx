import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { validateRegistrationForm } from "@/features/auth/utils/auth.validation";

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear inline error for this specific field on user edit
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (errorMsg) setErrorMsg("");
    if (successMsg) setSuccessMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // 1. Run validation using reusable validation utility
    const { isValid, errors } = validateRegistrationForm(formData);

    if (!isValid) {
      setFieldErrors(errors);
      setErrorMsg("Please fix the validation errors below.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      setFieldErrors({});

      // 2. Create user with Supabase Auth (role = owner, onboarding_completed = false, current_onboarding_step = 1)
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMsg("Account created successfully! Redirecting to profile setup...");

      // 3. Redirect to /onboarding/profile
      setTimeout(() => {
        navigate("/onboarding/profile", { replace: true });
      }, 600);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMsg(
        error.message || "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10">
      <h2 className="mb-2 text-3xl font-extrabold text-slate-900 tracking-tight">
        Create Account
      </h2>
      <p className="mb-8 text-slate-500 font-medium text-sm">
        Register to continue to BridgeOne
      </p>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Full Name */}
        <div>
          <div className="relative group">
            <User className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${fieldErrors.name ? "text-red-400" : "text-slate-400 group-focus-within:text-fuchsia-500"}`} />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              className={`w-full rounded-2xl border pl-12 pr-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all placeholder:text-slate-400 ${
                fieldErrors.name
                  ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-200/80 bg-white/80 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p className="mt-1.5 text-xs text-red-500 font-semibold pl-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <div className="relative group">
            <Mail className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${fieldErrors.email ? "text-red-400" : "text-slate-400 group-focus-within:text-fuchsia-500"}`} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={`w-full rounded-2xl border pl-12 pr-4 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all placeholder:text-slate-400 ${
                fieldErrors.email
                  ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-200/80 bg-white/80 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-500 font-semibold pl-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="relative group">
            <Lock className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${fieldErrors.password ? "text-red-400" : "text-slate-400 group-focus-within:text-fuchsia-500"}`} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              className={`w-full rounded-2xl border pl-12 pr-12 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all placeholder:text-slate-400 ${
                fieldErrors.password
                  ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-200/80 bg-white/80 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-500 font-semibold pl-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.password}</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="relative group">
            <ShieldCheck className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${fieldErrors.confirmPassword ? "text-red-400" : "text-slate-400 group-focus-within:text-fuchsia-500"}`} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              className={`w-full rounded-2xl border pl-12 pr-12 py-3.5 text-sm text-slate-900 font-medium outline-none transition-all placeholder:text-slate-400 ${
                fieldErrors.confirmPassword
                  ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-200/80 bg-white/80 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500 font-semibold pl-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{fieldErrors.confirmPassword}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 mt-6 py-4 font-bold text-white transition-all hover:bg-black hover:shadow-lg hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Creating Account...</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-slate-500 text-xs font-medium">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-fuchsia-600 hover:text-fuchsia-500 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
