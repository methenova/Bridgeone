import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/common/Navbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}