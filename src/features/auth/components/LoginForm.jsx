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
    <div className="w-full rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10">
      <h2 className="mb-2 text-3xl font-extrabold text-slate-900 tracking-tight">
        Welcome Back
      </h2>
      <p className="mb-8 text-slate-500 font-medium text-sm">
        Log in to your agent workspace
      </p>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Address */}
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
            autoComplete="current-password"
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 font-medium transition-colors">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500/20"
            />
            <span>Remember me</span>
          </label>
          <a href="#forgot" className="font-bold text-fuchsia-600 hover:text-fuchsia-500 transition-colors">
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 mt-4 py-4 font-bold text-white transition-all hover:bg-black hover:shadow-lg hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Log In to Workspace"}
        </button>
      </form>

      <p className="mt-8 text-center text-slate-500 text-xs font-medium">
        Don't have a seller account?{" "}
        <Link
          to="/register"
          className="font-bold text-fuchsia-600 hover:text-fuchsia-500 transition-colors"
        >
          Register Now
        </Link>
      </p>
    </div>
  );
}
