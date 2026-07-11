import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

export default function LoginForm() {
  const navigate = useNavigate();

  const { login } = useAuthContext();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    try {
      setLoading(true);

      const result = await login(formData);
      const userRole = result?.profile?.role || "customer";

      alert("Login Successful");

      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "seller") {
        navigate("/seller");
      } else {
        navigate("/");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm p-3 text-slate-900"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm p-3 text-slate-900"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Signing In..." : "Login"}
      </button>
    </form>
  );
}