import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}