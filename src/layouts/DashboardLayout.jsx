import { useAuthContext } from "@/context/AuthContext";
import AdminLayout from "./AdminLayout";
import SellerLayout from "./SellerLayout";

export default function DashboardLayout() {
  const { role } = useAuthContext();

  if (role === "admin" || role === "super_admin") {
    return <AdminLayout />;
  }

  return <SellerLayout />;
}