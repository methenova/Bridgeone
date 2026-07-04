import { Outlet } from "react-router-dom";

import SellerSidebar from "@/features/seller/components/SellerSidebar";
import SellerTopbar from "@/features/seller/components/SellerTopbar";

export default function SellerLayout() {
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