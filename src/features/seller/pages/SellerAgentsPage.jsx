import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Power, 
  Clock, 
  Search, 
  Trash2, 
  X, 
  Loader2, 
  Activity, 
  Building,
  Check,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function SellerAgentsPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

  const [agents, setAgents] = useState([]);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState("agent");
  const [selectedDept, setSelectedDept] = useState("Sales");
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Load team agents and profile lists
  async function loadTeamData() {
    if (!shopId) return;
    try {
      setLoading(true);
      // 1. Fetch store agents joined with profiles
      const { data: team, error } = await supabase
        .from("shop_agents")
        .select(`
          *,
          profiles:profile_id ( full_name, email, avatar_url )
        `)
        .eq("shop_id", shopId);

      if (error) throw error;
      setAgents(team || []);

      // 2. Fetch all profiles that are not already agents for inviting dropdown
      const existingAgentIds = (team || []).map(a => a.profile_id);
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("role", "admin");

      if (pError) throw pError;
      
      const unassigned = (profiles || []).filter(p => !existingAgentIds.includes(p.id));
      setAvailableProfiles(unassigned);

    } catch (err) {
      console.error("[Agents] Load error:", err);
      toast.error("Failed to load team agents data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!shopId) return;
    loadTeamData();

    // Subscribe to shop_agents presence updates in real-time
    const channel = supabase.channel(`shop-agents-presence-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shop_agents",
          filter: `shop_id=eq.${shopId}`
        },
        () => {
          loadTeamData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  // Invite Agent trigger
  async function handleInviteAgent(e) {
    e.preventDefault();
    if (!selectedProfileId) {
      toast.error("Please select a profile to invite!");
      return;
    }
    setSubmittingInvite(true);
    try {
      const { error } = await supabase
        .from("shop_agents")
        .insert({
          shop_id: shopId,
          profile_id: selectedProfileId,
          role: selectedRole,
          department: selectedDept,
          is_online: false,
          status: "Offline"
        });

      if (error) throw error;
      toast.success("Agent invited to team successfully!");
      setIsInviteOpen(false);
      setSelectedProfileId("");
      loadTeamData();
    } catch (err) {
      toast.error(err.message || "Failed to invite agent");
    } finally {
      setSubmittingInvite(false);
    }
  }

  // Remove Agent
  async function handleRemoveAgent(agentId) {
    if (!window.confirm("Are you sure you want to remove this agent from your store?")) return;
    try {
      const { error } = await supabase
        .from("shop_agents")
        .delete()
        .eq("id", agentId);

      if (error) throw error;
      toast.success("Agent removed from team");
      loadTeamData();
    } catch (err) {
      toast.error(err.message || "Failed to remove agent");
    }
  }

  // Update status dropdown
  async function handleUpdateStatus(agentId, newStatus) {
    const isOnline = ["Available", "Busy", "In Call", "Away", "Break", "Meeting"].includes(newStatus);
    try {
      const { error } = await supabase
        .from("shop_agents")
        .update({ status: newStatus, is_online: isOnline })
        .eq("id", agentId);

      if (error) throw error;
      toast.success(`Agent status updated to ${newStatus}`);
      loadTeamData();
    } catch (err) {
      toast.error(err.message || "Failed to update agent status");
    }
  }

  // Mutate Role or Department from table inline selector
  async function handleUpdateField(agentId, field, value) {
    try {
      const { error } = await supabase
        .from("shop_agents")
        .update({ [field]: value })
        .eq("id", agentId);

      if (error) throw error;
      toast.success(`Agent ${field} updated`);
      loadTeamData();
    } catch (err) {
      toast.error(err.message || `Failed to update ${field}`);
    }
  }

  // Filters & Search logic
  const filteredAgents = useMemo(() => {
    return agents.filter(ag => {
      const name = ag.profiles?.full_name || "Agent";
      const email = ag.profiles?.email || "";
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || ag.role === roleFilter;
      const matchesDept = deptFilter === "all" || ag.department === deptFilter;
      const matchesStatus = 
        statusFilter === "all" || 
        ag.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [agents, searchQuery, roleFilter, deptFilter, statusFilter]);

  // Paginated list calculation
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgents, currentPage]);

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);

  if (shopLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-900" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-900 border border-slate-850" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team Management</h1>
          <p className="mt-1 text-xs text-slate-400">Invite call agents, assign service departments, toggle availability, and monitor performance.</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedProfileId("");
            setSelectedRole("agent");
            setSelectedDept("Sales");
            setIsInviteOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Agent</span>
        </button>
      </div>

      {/* Utilities panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search team agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-850 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-850 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-slate-350 outline-none focus:border-slate-850"
            >
              <option value="all">All States</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="In Call">In Call</option>
              <option value="Away">Away</option>
              <option value="Offline">Offline</option>
              <option value="Break">Break</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>

          {/* Department filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-slate-350 outline-none focus:border-slate-850"
            >
              <option value="all">All Depts</option>
              <option value="Sales">Sales</option>
              <option value="Support">Support</option>
              <option value="Billing">Billing</option>
            </select>
          </div>
        </div>

      </div>

      {/* Agents Roster Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-900 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4.5">Agent Details</th>
                <th className="px-6 py-4.5">Assigned Role</th>
                <th className="px-6 py-4.5">Department</th>
                <th className="px-6 py-4.5">Online Status</th>
                <th className="px-6 py-4.5 text-right">Roster Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-transparent text-xs text-slate-300">
              {paginatedAgents.map((ag, idx) => {
                const name = ag.profiles?.full_name || "Agent User";
                const email = ag.profiles?.email || "";

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={ag.id} 
                    className="hover:bg-slate-900/10 transition-colors"
                  >
                    {/* Details details */}
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-400">
                        {name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <span className="block font-bold text-white text-xs">{name}</span>
                        <span className="block text-[10px] text-slate-500 font-semibold">{email}</span>
                      </div>
                    </td>

                    {/* Role selector */}
                    <td className="px-6 py-4">
                      <select
                        value={ag.role}
                        onChange={(e) => handleUpdateField(ag.id, "role", e.target.value)}
                        className="rounded-lg border border-slate-850 bg-slate-950 px-2 py-1 text-xs outline-none text-slate-300 font-semibold"
                      >
                        <option value="agent">Agent</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>

                    {/* Department selector */}
                    <td className="px-6 py-4">
                      <select
                        value={ag.department}
                        onChange={(e) => handleUpdateField(ag.id, "department", e.target.value)}
                        className="rounded-lg border border-slate-850 bg-slate-950 px-2 py-1 text-xs outline-none text-slate-300 font-semibold"
                      >
                        <option value="Sales">Sales</option>
                        <option value="Support">Support</option>
                        <option value="Billing">Billing</option>
                      </select>
                    </td>

                    {/* Status switcher */}
                    <td className="px-6 py-4">
                      <select
                        value={ag.status || "Offline"}
                        onChange={(e) => handleUpdateStatus(ag.id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs outline-none font-bold uppercase cursor-pointer ${
                          ag.status === "Available" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" :
                          ag.status === "Busy" ? "bg-rose-500/10 text-rose-400 border-rose-500/25" :
                          ag.status === "In Call" ? "bg-purple-500/10 text-purple-400 border-purple-500/25" :
                          ag.status === "Away" ? "bg-amber-500/10 text-amber-400 border-amber-500/25" :
                          ag.status === "Break" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" :
                          ag.status === "Meeting" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" :
                          "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        <option value="Available" className="bg-slate-950 text-emerald-400">Available</option>
                        <option value="Busy" className="bg-slate-950 text-rose-400">Busy</option>
                        <option value="In Call" className="bg-slate-950 text-purple-400">In Call</option>
                        <option value="Away" className="bg-slate-950 text-amber-400">Away</option>
                        <option value="Break" className="bg-slate-950 text-yellow-400">Break</option>
                        <option value="Meeting" className="bg-slate-950 text-indigo-400">Meeting</option>
                        <option value="Offline" className="bg-slate-950 text-slate-400">Offline</option>
                      </select>
                    </td>

                    {/* Deletion action */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveAgent(ag.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove Agent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>

                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredAgents.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Users className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No team agents found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-900/10 p-4 border border-slate-900 rounded-xl text-xs">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-850 rounded-lg hover:border-slate-800 disabled:opacity-50 text-slate-400 font-bold cursor-pointer"
          >
            Previous
          </button>
          
          <span className="text-slate-500 font-bold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-slate-850 rounded-lg hover:border-slate-800 disabled:opacity-50 text-slate-400 font-bold cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* INVITE MODAL */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Invite store agent</h2>
                <button 
                  onClick={() => setIsInviteOpen(false)}
                  className="text-slate-450 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleInviteAgent} className="space-y-4 text-xs">
                
                {/* Profile selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select platform profile</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2.5 text-white outline-none focus:border-blue-500 font-semibold"
                    required
                  >
                    <option value="">-- Choose User Profile --</option>
                    {availableProfiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                    ))}
                  </select>
                </div>

                {/* Team role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Team role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2.5 text-white outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="agent">Agent (Answer Calls only)</option>
                    <option value="manager">Manager (Full edit store catalog access)</option>
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2.5 text-white outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div className="border-t border-slate-900 pt-4 flex gap-3 justify-end text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 border border-slate-850 rounded-xl text-slate-450 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-550 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {submittingInvite && <Loader2 className="h-3 w-3 animate-spin" />}
                    Invite
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
