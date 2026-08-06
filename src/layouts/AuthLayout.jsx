import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}