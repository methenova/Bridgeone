import { Outlet, Navigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

import SellerSidebar from "@/features/seller/components/SellerSidebar";
import SellerTopbar from "@/features/seller/components/SellerTopbar";

export default function SellerLayout() {
  const { profile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  if (profile?.role !== "seller" && profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <SellerSidebar />

      <div className="flex flex-1 flex-col">
        <SellerTopbar />

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}