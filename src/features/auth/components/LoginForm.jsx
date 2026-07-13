import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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
    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const result = await login(formData);
      const userRole = result?.profile?.role || "customer";

      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "seller") {
        navigate("/seller");
      } else {
        navigate("/");
      }
    } catch (error) {
      setErrorMsg(error.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-sm p-8 shadow-xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-slate-900">
        Welcome Back
      </h1>
      <p className="mb-8 text-center text-slate-500">
        Log in to continue to BridgeOne
      </p>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Address */}
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
            autoComplete="current-password"
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-700">
            <input
              type="checkbox"
              className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
            />
            <span>Remember me</span>
          </label>
          <a href="#forgot" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-md shadow-blue-500/10"
        >
          {loading ? "Logging In..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-500 text-xs">
        Don't have a seller account?{" "}
        <Link
          to="/register"
          className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
        >
          Register Now
        </Link>
      </p>
    </div>
  );
}