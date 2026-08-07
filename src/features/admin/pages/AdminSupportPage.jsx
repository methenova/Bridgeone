import { useState, useEffect, useMemo } from "react";
import {
  LifeBuoy,
  Search,
  Plus,
  Trash2,
  X,
  Lightbulb,
  Bug,
  HelpCircle,
  Loader2,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSupportTickets,
  useCreateSupportTicket,
  useDeleteSupportTicket,
  useUpdateSupportTicketStatus
} from "@/features/admin/hooks/useAdmin";
import { TableSkeleton } from "@/components/skeletons";

// ── Status config ──────────────────────────────────────────────
const STATUS_CONFIG = {
  open:     { label: "Open",     color: "bg-amber-50 text-amber-600 border-amber-200",   dot: "bg-amber-500"  },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  closed:   { label: "Closed",   color: "bg-slate-100 text-slate-500 border-slate-200",  dot: "bg-slate-400"  },
};

// ── Type config ────────────────────────────────────────────────
const TYPE_CONFIG = {
  bug:     { label: "bug",     icon: Bug,        color: "bg-red-50 text-red-500 border-red-200"       },
  feature: { label: "feature", icon: Lightbulb,  color: "bg-indigo-50 text-indigo-500 border-indigo-200" },
  ticket:  { label: "ticket",  icon: HelpCircle, color: "bg-blue-50 text-blue-500 border-blue-200"    },
};

export default function AdminSupportPage() {
  const { data: tickets = [], isLoading: loading } = useSupportTickets();
  const createTicketMutation = useCreateSupportTicket();
  const deleteTicketMutation = useDeleteSupportTicket();
  const updateStatusMutation = useUpdateSupportTicketStatus();

  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter]     = useState("all");

  // Modal form states
  const [isOpen, setIsOpen]       = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc]   = useState("");
  const [formType, setFormType]   = useState("bug");

  // ── Inline status change ───────────────────────────────────
  function handleStatusChange(ticketId, newStatus) {
    updateStatusMutation.mutate({ id: ticketId, status: newStatus });
  }

  // ── Delete ─────────────────────────────────────────────────
  function handleDeleteTicket(ticketId) {
    if (!window.confirm("Delete this ticket permanently?")) return;
    deleteTicketMutation.mutate(ticketId);
  }

  // ── Create ─────────────────────────────────────────────────
  function handleSubmitTicket(e) {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      toast.error("Title and description are required!");
      return;
    }
    createTicketMutation.mutate(
      { subject: formTitle, description: formDesc, type: formType, status: "open" },
      {
        onSuccess: () => {
          setIsOpen(false);
          setFormTitle("");
          setFormDesc("");
        }
      }
    );
  }

  // ── Filtering ──────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch =
        (ticket.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesType   = typeFilter   === "all" || ticket.type   === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tickets, searchQuery, statusFilter, typeFilter]);

  // ── Stats ──────────────────────────────────────────────────
  const openCount     = tickets.filter(t => t.status === "open").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;
  const bugCount      = tickets.filter(t => t.type   === "bug").length;

  if (loading) return <div className="space-y-6"><TableSkeleton rows={8} /></div>;

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl relative">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Support Desk</h1>
          <p className="mt-1 text-xs text-slate-500">
            Review client-submitted issues, address system bugs, and respond to feature requests.
          </p>
        </div>
        <button
          onClick={() => { setFormTitle(""); setFormDesc(""); setFormType("bug"); setIsOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Log New Ticket
        </button>
      </div>

      {/* Scorecard row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Tickets",   value: openCount,     color: "text-amber-600",   bg: "bg-amber-50/70 border-amber-100" },
          { label: "Resolved",       value: resolvedCount, color: "text-emerald-600", bg: "bg-emerald-50/70 border-emerald-100" },
          { label: "Bug Reports",    value: bugCount,      color: "text-red-500",     bg: "bg-red-50/70 border-red-100" },
        ].map(sc => (
          <div key={sc.label} className={`rounded-2xl border p-4 sm:p-5 ${sc.bg}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{sc.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${sc.color}`}>{sc.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none">
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Type:</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none">
              <option value="all">All</option>
              <option value="bug">Bugs</option>
              <option value="feature">Feature Requests</option>
              <option value="ticket">Help Tickets</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 align-middle">Ticket Details</th>
                <th className="px-6 py-4 align-middle">Vertical Type</th>
                <th className="px-6 py-4 align-middle">Resolution Status</th>
                <th className="px-6 py-4 align-middle">Report Date</th>
                <th className="px-6 py-4 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredTickets.map((t, idx) => {
                const dateText  = t.created_at
                  ? new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "numeric" })
                  : "—";
                const statusCfg  = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                const typeCfg    = TYPE_CONFIG[t.type]     || TYPE_CONFIG.ticket;
                const TypeIcon   = typeCfg.icon;
                const isUpdating = updatingId === t.id;

                return (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Title + Description */}
                    <td className="px-6 py-5 align-middle max-w-sm">
                      <span className="font-bold text-slate-900 block text-sm leading-snug">{t.subject}</span>
                      <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed line-clamp-2">
                        {t.description}
                      </span>
                    </td>

                    {/* Type Badge */}
                    <td className="px-6 py-5 align-middle">
                      <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${typeCfg.color}`}>
                        <TypeIcon className="h-3 w-3 shrink-0" />
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Status pill — styled select */}
                    <td className="px-6 py-5 align-middle">
                      <div className={`relative inline-flex items-center gap-1.5 border rounded-full pl-2.5 pr-1 py-1 ${statusCfg.color} ${isUpdating ? "opacity-50" : ""}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                        <select
                          value={t.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className="appearance-none bg-transparent text-[10px] font-bold cursor-pointer outline-none pr-4"
                          style={{ color: "inherit" }}
                        >
                          <option value="open">Open</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        <ChevronDown className="h-2.5 w-2.5 shrink-0 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </td>

                    {/* Report Date */}
                    <td className="px-6 py-5 align-middle text-slate-400 font-medium text-[11px] whitespace-nowrap">
                      {dateText}
                    </td>

                    {/* Delete action */}
                    <td className="px-6 py-5 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(t.id)}
                        title="Delete Ticket"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <LifeBuoy className="h-10 w-10 text-slate-200" />
              <p className="text-sm font-bold text-slate-500">No Support Tickets Found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or log a new ticket.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Log Support Ticket"
        description="Report a bug, request a feature, or ask for help."
      >
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Ticket Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
              placeholder="e.g. Video call freezes on mobile"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Issue Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Category Type</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 transition-all font-semibold"
            >
              <option value="bug">🐛 System Bug Report</option>
              <option value="feature">💡 Feature Request</option>
              <option value="ticket">🎫 General Help Ticket</option>
            </select>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
