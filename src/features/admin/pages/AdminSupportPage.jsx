import { useState, useEffect, useMemo } from "react";
import { 
  LifeBuoy, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Bug,
  HelpCircle,
  Clock,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("bug");
  const [submitting, setSubmitting] = useState(false);

  // Load support tickets
  async function loadTickets() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error("[Support] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  // Update status mutation
  async function handleStatusChange(ticketId, newStatus) {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;
      toast.success("Ticket status updated successfully!");
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Failed to update ticket status");
    }
  }

  // Delete ticket helper
  async function handleDeleteTicket(ticketId) {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;
      toast.success("Ticket deleted");
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Failed to delete ticket");
    }
  }

  // Submit new ticket
  async function handleSubmitTicket(e) {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      toast.error("Title and description are required!");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          title: formTitle,
          description: formDesc,
          type: formType,
          status: "open"
        });

      if (error) throw error;
      toast.success("Support ticket registered");
      setIsOpen(false);
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = 
        (ticket.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesType = typeFilter === "all" || ticket.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tickets, searchQuery, statusFilter, typeFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 text-slate-900 max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Support Desk</h1>
          <p className="mt-1 text-xs text-slate-500">Review client-submitted issues, address system bugs, and respond to feature requests.</p>
        </div>
        
        <Button
          onClick={() => {
            setFormTitle("");
            setFormDesc("");
            setFormType("bug");
            setIsOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-slate-900 hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Ticket</span>
        </Button>
      </div>

      {/* Utilities bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by ticket title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-200 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-200"
            >
              <option value="all">All Types</option>
              <option value="bug">Bugs</option>
              <option value="feature">Feature Requests</option>
              <option value="ticket">Help Tickets</option>
            </select>
          </div>
        </div>

      </div>

      {/* Tickets table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-white shadow-sm/40 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4.5">Ticket details</th>
                <th className="px-6 py-4.5">Vertical Type</th>
                <th className="px-6 py-4.5">Resolution status</th>
                <th className="px-6 py-4.5">Report Date</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent text-xs text-slate-700">
              {filteredTickets.map((t, idx) => {
                const dateText = t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN") : "—";
                
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={t.id} 
                    className="hover:bg-white shadow-sm/10 transition-colors"
                  >
                    {/* Ticket Title & Desc */}
                    <td className="px-6 py-4 max-w-md">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{t.title}</span>
                        <span className="text-[10px] text-slate-500 mt-1 block leading-normal line-clamp-2">
                          {t.description}
                        </span>
                      </div>
                    </td>

                    {/* Ticket Type */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold capitalize ${
                        t.type === "bug" 
                          ? "text-red-400" 
                          : t.type === "feature" 
                          ? "text-indigo-400" 
                          : "text-blue-400"
                      }`}>
                        {t.type === "bug" && <Bug className="h-3.5 w-3.5" />}
                        {t.type === "feature" && <Lightbulb className="h-3.5 w-3.5" />}
                        {t.type === "ticket" && <HelpCircle className="h-3.5 w-3.5" />}
                        <span>{t.type}</span>
                      </span>
                    </td>

                    {/* Resolution Status Dropdown */}
                    <td className="px-6 py-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none text-slate-700 font-semibold"
                      >
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    {/* Report Date */}
                    <td className="px-6 py-4 text-slate-500 font-medium">{dateText}</td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(t.id)}
                          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 shrink-0 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 cursor-pointer"
                          title="Delete Ticket"
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

          {filteredTickets.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <LifeBuoy className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No Support Tickets Found</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-white shadow-sm/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Log Ticket</h2>
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Ticket Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
                    placeholder="e.g. Call logs fail to render"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Issue Description</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 resize-none"
                    placeholder="Provide details about the issue..."
                  />
                </div>

                {/* Type select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Ticket Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="bug">System Bug Log</option>
                    <option value="feature">Feature Request Option</option>
                    <option value="ticket">General Help Ticket</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-4 flex gap-3 justify-end text-xs font-semibold">
                  <Button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-550 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Log Ticket
                  </Button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
