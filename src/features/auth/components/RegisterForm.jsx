import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "seller",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMsg) setErrorMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      alert("Registration successful! Please check your email.");
      navigate("/login");
    } catch (error) {
      setErrorMsg(error.message || "Registration failed. Please try again.");
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
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="relative group">
          <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
            className="w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-12 pr-4 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Email */}
        <div className="relative group">
          <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-12 pr-4 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Password */}
        <div className="relative group">
          <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-12 pr-12 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative group">
          <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-12 pr-12 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 mt-6 py-4 font-bold text-white transition-all hover:bg-black hover:shadow-lg hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
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
