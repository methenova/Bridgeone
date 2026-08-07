import { useState, useEffect, useMemo, useRef } from "react";
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
  ToggleRight,
  Mail,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";
import { TableSkeleton } from "@/components/skeletons";
import { AgentPresenceService } from "@/services/presence/presenceService";
import { realtimeManager } from "@/services/realtime/realtimeManager";
import { useAuthContext } from "@/context/AuthContext";
import {
  createInvitation,
  getShopInvitations,
  cancelInvitation,
  resendInvitation,
} from "../services/invitation.service";

export default function SellerAgentsPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const { user } = useAuthContext();
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
  const [inviteTab, setInviteTab] = useState("existing"); // "existing" | "email"
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState("agent");
  const [selectedDept, setSelectedDept] = useState("Sales");
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Email invitation state
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailRole, setEmailRole] = useState("agent");
  const [submittingEmailInvite, setSubmittingEmailInvite] = useState(false);

  // Pending invitations state
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitationsExpanded, setInvitationsExpanded] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Load team agents and profile lists
  async function loadTeamData() {
    if (!shopId) return;
    try {
      setLoading(true);

      // 1. Fetch shop_members for this shop, joined with their shop_agents and profiles
      const { data: members, error } = await supabase
        .from("shop_members")
        .select(`
          id,
          profile_id,
          role,
          is_active,
          joined_at,
          profiles:profile_id ( id, full_name, email, avatar_url ),
          shop_agents ( id, display_name, status, max_active_conversations, last_seen_at )
        `)
        .eq("shop_id", shopId);

      if (error) throw error;

      // Flatten into a unified agent list for the UI
      const teamList = (members || []).map(m => {
        const agent = Array.isArray(m.shop_agents) ? (m.shop_agents[0] || null) : (m.shop_agents || null);
        return {
          // Use shop_agents.id if exists, otherwise shop_members.id
          id: agent?.id || m.id,
          member_id: m.id,
          profile_id: m.profile_id,
          role: m.role || "agent",
          status: agent?.status || "offline",
          display_name: agent?.display_name || m.profiles?.full_name || "Agent",
          max_active_conversations: agent?.max_active_conversations || 1,
          last_seen_at: agent?.last_seen_at,
          is_active: m.is_active,
          joined_at: m.joined_at,
          has_agent_record: !!agent,
          // Profile info for display
          profiles: m.profiles,
        };
      });

      setAgents(teamList);

      // 2. Fetch all profiles that are not already members for inviting dropdown
      const existingProfileIds = (members || []).map(m => m.profile_id);
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("role", "admin");

      if (pError) throw pError;
      
      const unassigned = (profiles || []).filter(p => !existingProfileIds.includes(p.id));
      setAvailableProfiles(unassigned);

    } catch (err) {
      console.error("[Agents] Load error:", err);
      toast.error("Failed to load team agents data");
    } finally {
      setLoading(false);
    }
  }

  // Load pending invitations
  async function loadInvitations() {
    if (!shopId) return;
    try {
      setLoadingInvitations(true);
      const invitations = await getShopInvitations(shopId);
      setPendingInvitations(invitations);
    } catch (err) {
      console.error("[Agents] Invitations load error:", err);
    } finally {
      setLoadingInvitations(false);
    }
  }

  useEffect(() => {
    if (!shopId) return;
    loadTeamData();
    loadInvitations();

    // Subscribe to shop_agents presence updates in real-time
    const topic = `shop-agents-presence-${shopId}`;
    const channel = realtimeManager.subscribe(topic)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shop_agents",
        },
        () => {
          loadTeamData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shop_members",
          filter: `shop_id=eq.${shopId}`
        },
        () => {
          loadTeamData();
        }
      );

    return () => {
      realtimeManager.unsubscribe(topic);
    };
  }, [shopId]);

  // Invite Agent — creates a shop_member first, then a shop_agent record
  async function handleInviteAgent(e) {
    e.preventDefault();
    if (!selectedProfileId) {
      toast.error("Please select a profile to invite!");
      return;
    }
    setSubmittingInvite(true);
    try {
      // Step 1: Create shop_member
      const { data: member, error: memberError } = await supabase
        .from("shop_members")
        .insert({
          shop_id: shopId,
          profile_id: selectedProfileId,
          role: selectedRole,
          is_active: true,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Step 2: Create shop_agent linked to the new member
      const { error: agentError } = await supabase
        .from("shop_agents")
        .insert({
          shop_member_id: member.id,
          display_name: null,
          status: "offline",
          max_active_conversations: 3,
        });

      if (agentError) throw agentError;

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

  // Invite Agent via Email — creates a shop_invitation record
  async function handleEmailInvite(e) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inviteEmail.trim() || !emailRegex.test(inviteEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmittingEmailInvite(true);
    try {
      await createInvitation(shopId, user?.id, inviteEmail.trim(), emailRole);
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setIsInviteOpen(false);
      setInviteEmail("");
      setEmailRole("agent");
      setInvitationsExpanded(true);
      loadInvitations();
    } catch (err) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSubmittingEmailInvite(false);
    }
  }

  // Cancel a pending email invitation
  async function handleCancelInvitation(invId) {
    if (!window.confirm("Cancel this pending invitation?")) return;
    try {
      await cancelInvitation(invId);
      toast.success("Invitation cancelled");
      loadInvitations();
    } catch (err) {
      toast.error(err.message || "Failed to cancel invitation");
    }
  }

  // Resend an invitation
  async function handleResendInvitation(invId) {
    try {
      await resendInvitation(invId);
      toast.success("Invitation resent successfully");
      loadInvitations();
    } catch (err) {
      toast.error(err.message || "Failed to resend invitation");
    }
  }

  // Remove Agent — removes both shop_agent and shop_member records
  async function handleRemoveAgent(ag) {
    if (!window.confirm("Are you sure you want to remove this agent from your store?")) return;
    try {
      // Delete shop_agent first (if exists)
      if (ag.has_agent_record) {
        const { error: agError } = await supabase
          .from("shop_agents")
          .delete()
          .eq("id", ag.id);
        if (agError) throw agError;
      }

      // Delete shop_member
      const { error: memError } = await supabase
        .from("shop_members")
        .delete()
        .eq("id", ag.member_id);
      if (memError) throw memError;

      toast.success("Agent removed from team");
      loadTeamData();
    } catch (err) {
      toast.error(err.message || "Failed to remove agent");
    }
  }

  // Mutex to prevent concurrent status updates per member
  const statusUpdateLocks = useRef(new Set());

  // Update agent status (on shop_agents table, agent_presence table, & shop online status)
  async function handleUpdateStatus(ag, newStatus) {
    // Prevent concurrent status toggles for the same member
    if (statusUpdateLocks.current.has(ag.member_id)) return;
    statusUpdateLocks.current.add(ag.member_id);

    try {
      // Optimistic UI update — only change status display, do NOT set has_agent_record yet
      setAgents(prev => prev.map(item => 
        item.member_id === ag.member_id 
          ? { ...item, status: newStatus } 
          : item
      ));

      if (ag.has_agent_record && ag.id && ag.id !== ag.member_id) {
        // Agent record already exists — update it by its real shop_agents.id
        const { error } = await supabase
          .from("shop_agents")
          .update({ 
            status: newStatus, 
            last_seen_at: new Date().toISOString() 
          })
          .eq("id", ag.id);
        if (error) throw error;
      } else {
        // No agent record yet — use upsert to prevent duplicates on rapid toggles
        const { data: newAg, error } = await supabase
          .from("shop_agents")
          .upsert(
            {
              shop_member_id: ag.member_id,
              status: newStatus,
              last_seen_at: new Date().toISOString(),
              max_active_conversations: 3,
            },
            { onConflict: "shop_member_id" }
          )
          .select()
          .single();
        if (error) throw error;

        // Patch the real agent ID back into local state immediately
        if (newAg?.id) {
          setAgents(prev => prev.map(item =>
            item.member_id === ag.member_id
              ? { ...item, id: newAg.id, has_agent_record: true, status: newStatus }
              : item
          ));
        }
      }

      // Sync presence table & shop_agents table via centralized AgentPresenceService
      if (ag.profile_id && shopId) {
        await AgentPresenceService.setPresence(ag.profile_id, shopId, newStatus);
      }

      // Automatically sync overall shop online status when agent status changes
      if (shopId) {
        const { data: onlineAgents } = await supabase
          .from("shop_agents")
          .select("id, shop_member:shop_member_id(shop_id)")
          .eq("status", "online");

        const hasOnline = (onlineAgents || []).some(a => a.shop_member?.shop_id === shopId) || (newStatus === "online");

        await supabase
          .from("shops")
          .update({ widget_enabled: hasOnline })
          .eq("id", shopId);
      }

      toast.success(`Agent status updated to ${newStatus}`);
      await loadTeamData();
    } catch (err) {
      console.error("[Agents] Status update error:", err);
      toast.error(err.message || "Failed to update agent status");
      await loadTeamData();
    } finally {
      statusUpdateLocks.current.delete(ag.member_id);
    }
  }

  // Update role (on shop_members table)
  async function handleUpdateRole(ag, newRole) {
    try {
      const { error } = await supabase
        .from("shop_members")
        .update({ role: newRole })
        .eq("id", ag.member_id);
      if (error) throw error;
      toast.success(`Agent role updated to ${newRole}`);
      loadTeamData();
    } catch (err) {
      toast.error(err.message || "Failed to update role");
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
      const matchesStatus = 
        statusFilter === "all" || 
        ag.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [agents, searchQuery, roleFilter, statusFilter]);

  // Paginated list calculation
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgents, currentPage]);

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);

  // Status color helper
  function statusStyle(status) {
    switch (status) {
      case "online": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "busy": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "away": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  }

  if (shopLoading || loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team Management</h1>
          <p className="mt-1 text-xs text-slate-500">Invite call agents, assign roles, toggle availability, and monitor performance.</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedProfileId("");
            setSelectedRole("agent");
            setSelectedDept("Sales");
            setIsInviteOpen(true);
          }} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Agent</span>
        </button>
      </div>

      {/* Utilities panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
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
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All States</option>
              <option value="online">Online</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)} 
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="agent">Agent</option>
            </select>
          </div>
        </div>

      </div>

      {/* Agents Roster Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-5 align-middle">Agent Details</th>
                <th className="px-6 py-5 align-middle">Assigned Role</th>
                <th className="px-6 py-5 align-middle">Online Status</th>
                <th className="px-6 py-5 align-middle text-right">Roster Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
              {paginatedAgents.map((ag, idx) => {
                const name = ag.profiles?.full_name || ag.display_name || "Agent User";
                const email = ag.profiles?.email || "";

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={ag.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Agent details */}
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center font-bold text-slate-500">
                          {name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900 text-sm max-w-[180px] truncate">{name}</span>
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role selector */}
                    <td className="px-6 py-5 align-middle">
                      <select
                        value={ag.role}
                        onChange={(e) => handleUpdateRole(ag, e.target.value)} 
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none text-slate-700 font-bold transition-all focus:border-slate-200"
                      >
                        <option value="agent">Agent</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>

                    {/* Status switcher */}
                    <td className="px-6 py-5 align-middle">
                      <select
                        value={ag.status || "offline"}
                        onChange={(e) => handleUpdateStatus(ag, e.target.value)}
                        className={`rounded-xl border px-3 py-1.5 text-xs outline-none font-bold uppercase tracking-wider cursor-pointer transition-all ${statusStyle(ag.status)}`}
                      >
                        <option value="online">Online</option>
                        <option value="busy">Busy</option>
                        <option value="away">Away</option>
                        <option value="offline">Offline</option>
                      </select>
                    </td>

                    {/* Deletion action */}
                    <td className="px-6 py-5 align-middle text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleRemoveAgent(ag)} 
                          title="Remove Agent"
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>

                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredAgents.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Users className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No team agents found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1} className="px-4 py-2 border border-slate-100 rounded-2xl hover:border-slate-300 disabled:opacity-50 text-slate-500 font-bold cursor-pointer"
          >
            Previous
          </button>
          
          <span className="text-slate-500 font-bold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages} className="px-4 py-2 border border-slate-100 rounded-2xl hover:border-slate-300 disabled:opacity-50 text-slate-500 font-bold cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* PENDING INVITATIONS PANEL */}
      {pendingInvitations.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setInvitationsExpanded(!invitationsExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900">Pending Invitations</span>
                <span className="ml-2 text-[10px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  {pendingInvitations.filter(i => i.status === "pending").length}
                </span>
              </div>
            </div>
            {invitationsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <AnimatePresence>
            {invitationsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-100"
              >
                <div className="divide-y divide-slate-100">
                  {pendingInvitations.map((inv) => {
                    const isExpired = new Date(inv.expires_at) < new Date();
                    const statusLabel = isExpired ? "Expired" : inv.status;
                    const statusClass = isExpired
                      ? "bg-slate-100 text-slate-500 border-slate-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <div key={inv.id} className="flex items-center justify-between px-6 py-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                            {inv.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{inv.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500">Role: <strong className="text-slate-700">{inv.role}</strong></span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-slate-500">Sent {new Date(inv.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusClass}`}>
                            {statusLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResendInvitation(inv.id)}
                            title="Resend Invitation"
                            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelInvitation(inv.id)}
                            title="Cancel Invitation"
                            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* INVITE MODAL */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl p-6 md:p-8 space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2">Invite store agent</h2>
                <button 
                  onClick={() => setIsInviteOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tab Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setInviteTab("existing")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                    inviteTab === "existing"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Existing User
                </button>
                <button
                  type="button"
                  onClick={() => setInviteTab("email")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                    inviteTab === "email"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Invite
                </button>
              </div>

              {/* Existing User Tab */}
              {inviteTab === "existing" && (
                <form onSubmit={handleInviteAgent} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">Select platform profile</label>
                    <select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">-- Choose User Profile --</option>
                      {availableProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">Select Team role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="agent">Agent (Answer Calls only)</option>
                      <option value="manager">Manager (Full edit store catalog access)</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingInvite} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10"
                    >
                      {submittingInvite && <Loader2 className="h-3 w-3 animate-spin" />}
                      Invite
                    </button>
                  </div>
                </form>
              )}

              {/* Email Invite Tab */}
              {inviteTab === "email" && (
                <form onSubmit={handleEmailInvite} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      Agent email address
                    </label>
                    <input
                      type="email"
                      placeholder="agent@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 placeholder-slate-400"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      An invitation will be created. The agent can join your store after registering on the platform.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">Assigned role</label>
                    <select
                      value={emailRole}
                      onChange={(e) => setEmailRole(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="agent">Agent (Answer Calls only)</option>
                      <option value="manager">Manager (Full edit store catalog access)</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEmailInvite} className="flex items-center gap-1.5 rounded-xl bg-fuchsia-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-fuchsia-500 cursor-pointer shadow-lg shadow-fuchsia-500/10"
                    >
                      {submittingEmailInvite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Send Invitation
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
