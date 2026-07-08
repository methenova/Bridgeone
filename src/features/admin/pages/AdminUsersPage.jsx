import { useState, useMemo } from "react";
import { 
  User, 
  Search, 
  Users, 
  ShieldCheck, 
  Store 
} from "lucide-react";
import { motion } from "framer-motion";

import { useAdminUsers, useUpdateProfileRole } from "../hooks/useAdmin";
import ProductSkeleton from "@/features/seller/components/ProductSkeleton";

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateRole = useUpdateProfileRole();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function handleRoleChange(userId, newRole) {
    const actionText = `Change role for this user to ${newRole.toUpperCase()}?`;
    if (window.confirm(actionText)) {
      await updateRole.mutateAsync({ userId, role: newRole });
    }
  }

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || (u.role || "customer") === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === "admin").length;
    const sellers = users.filter(u => u.role === "seller").length;
    const customers = total - admins - sellers;
    return { total, admins, sellers, customers };
  }, [users]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <ProductSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-7xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Users</h1>
        <p className="mt-1 text-xs text-slate-400">Manage, moderate, and adjust platform user roles and system privileges.</p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 max-w-4xl">
        {/* Total Users */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Users</p>
            <p className="text-xl font-bold tracking-tight">{stats.total}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Platform Admins */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admins</p>
            <p className="text-xl font-bold tracking-tight text-red-400">{stats.admins}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Sellers */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sellers</p>
            <p className="text-xl font-bold tracking-tight text-blue-400">{stats.sellers}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Store className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Customers */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customers</p>
            <p className="text-xl font-bold tracking-tight text-slate-300">{stats.customers}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
            <User className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Utility Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-850 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-slate-800"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>

      </div>

      {/* Users Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-900 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4.5">Account Profile</th>
                <th className="px-6 py-4.5">Email Address</th>
                <th className="px-6 py-4.5">Membership Role</th>
                <th className="px-6 py-4.5">Registration Date</th>
                <th className="px-6 py-4.5 text-right">System Privilege Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-transparent text-xs text-slate-300">
              {filteredUsers.map((u, idx) => {
                const joinDate = new Date(u.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const userRole = u.role || "customer";

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={u.id} 
                    className="hover:bg-slate-900/10 transition-colors"
                  >
                    {/* Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/10 text-blue-450 shrink-0 font-extrabold text-[10px]">
                          {(u.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block text-sm">{u.full_name || "—"}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                            ID: #{u.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-slate-350 font-medium">
                      {u.email || "—"}
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                        userRole === "admin"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : userRole === "seller"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-slate-800 text-slate-450 border border-slate-700/60"
                      }`}>
                        {userRole}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {joinDate}
                    </td>

                    {/* Dropdown Change Selector */}
                    <td className="px-6 py-4 text-right">
                      <select
                        value={userRole}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updateRole.isPending}
                        className="rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 disabled:opacity-50 font-bold transition-all"
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </td>

                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Users className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No Users Registered</p>
              <p className="text-xs text-slate-500 mt-1">Platform user accounts will list here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
