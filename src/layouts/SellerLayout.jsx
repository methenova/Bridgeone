import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

import SellerSidebar from "@/features/seller/components/SellerSidebar";
import SellerTopbar from "@/features/seller/components/SellerTopbar";

export default function SellerLayout() {
  const { profile, loading } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Sidebar - responsive desktop fixed / mobile sliding overlay */}
      <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        <SellerTopbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}