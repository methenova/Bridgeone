import { useAdminUsers, useUpdateProfileRole } from "../hooks/useAdmin";
import { User } from "lucide-react";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateRole = useUpdateProfileRole();

  async function handleRoleChange(userId, newRole) {
    if (window.confirm(`Change role for this user to ${newRole}?`)) {
      await updateRole.mutateAsync({ userId, role: newRole });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="mt-1 text-slate-400">View and moderate platform user roles.</p>
      </div>

      {isLoading ? (
        <ProductSkeleton rows={6} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-300 text-sm font-semibold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/10 text-sm text-slate-300">
                {users.map((u) => {
                  const joinDate = new Date(u.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-400">
                            <User className="h-5 w-5" />
                          </div>
                          <span className="font-semibold text-white">
                            {u.full_name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-slate-400">
                        {u.email || "—"}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : u.role === "seller"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700/60"
                        }`}>
                          {u.role || "customer"}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-slate-400">
                        {joinDate}
                      </td>

                      {/* Change Role Selector */}
                      <td className="px-6 py-4 text-right">
                        <select
                          value={u.role || "customer"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updateRole.isPending}
                          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
