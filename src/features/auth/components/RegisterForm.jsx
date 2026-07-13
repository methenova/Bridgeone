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
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-sm p-8 shadow-xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-slate-900">
        Create Account
      </h1>

      <p className="mb-8 text-center text-slate-500">
        Register to continue to BridgeOne
      </p>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="relative">
          <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
            className="w-full rounded-xl border border-slate-200 bg-slate-100/40 pl-12 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 transition-all focus:bg-slate-100"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 bg-slate-100/40 pl-12 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 transition-all focus:bg-slate-100"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-100/40 pl-12 pr-12 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 transition-all focus:bg-slate-100"
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
        <div className="relative">
          <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-100/40 pl-12 pr-12 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 transition-all focus:bg-slate-100"
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
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-md shadow-blue-500/10"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-500 text-xs">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}