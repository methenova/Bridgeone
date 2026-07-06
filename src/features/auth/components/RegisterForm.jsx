import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!formData.email.trim()) {
      alert("Please enter your email.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      alert("Registration successful! Please check your email.");

      navigate("/login");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-white">
        Create Account
      </h1>

      <p className="mb-8 text-center text-slate-400">
        Register to continue to BridgeOne
      </p>

      {/* Account Type Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, role: "customer" }))}
          className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            formData.role === "customer"
              ? "border-blue-500 bg-blue-600/10 text-blue-400"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-300"
          }`}
        >
          🛍️ Customer Account
        </button>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, role: "seller" }))}
          className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            formData.role === "seller"
              ? "border-blue-500 bg-blue-600/10 text-blue-400"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-300"
          }`}
        >
          🏪 Shop Owner (Seller)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/40 pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all focus:bg-slate-800"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/40 pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all focus:bg-slate-800"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/40 pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all focus:bg-slate-800"
          />
        </div>

        <div className="relative">
          <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/40 pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all focus:bg-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-500 hover:text-blue-400"
        >
          Login
        </Link>
      </p>
    </div>
  );
}