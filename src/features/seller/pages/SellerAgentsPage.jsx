import { useState } from "react";
import { Users, UserPlus, Shield, Power, Clock, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SellerAgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockAgents = [
    { name: "Vikram Malhotra", email: "vikram@merchant.com", role: "Agent", status: "Online", callsHandled: 28 },
    { name: "Ananya Iyer", email: "ananya@merchant.com", role: "Manager", status: "Offline", callsHandled: 42 }
  ];

  return (
    <div className="space-y-6 text-white max-w-6xl relative">
      <div className="absolute top-2 right-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
        NOT FUNCTIONAL · USING MOCK DATA · BACKEND NOT IMPLEMENTED
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Agent roster</h1>
          <p className="mt-1 text-xs text-slate-400">Invite call managers, check live connectivity, and audit answered consultation rates.</p>
        </div>
        
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-all cursor-not-allowed opacity-50">
          <UserPlus className="h-4 w-4" />
          <span>Invite Agent</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-850 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-850 transition-colors"
          />
        </div>
      </div>

      {/* Agents Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
        <table className="min-w-full text-left border-collapse">
          <thead className="border-b border-slate-900 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4.5">Agent Details</th>
              <th className="px-6 py-4.5">Role Type</th>
              <th className="px-6 py-4.5">Availability Status</th>
              <th className="px-6 py-4.5">Consults Answered</th>
              <th className="px-6 py-4.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 bg-transparent text-xs text-slate-300">
            {mockAgents.map((ag) => (
              <tr key={ag.email} className="hover:bg-slate-900/10 transition-colors">
                <td className="px-6 py-4 font-bold text-white flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                    {ag.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <span className="block font-bold text-white">{ag.name}</span>
                    <span className="block text-[10px] text-slate-500 font-semibold">{ag.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-400">{ag.role}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${
                    ag.status === "Online" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-slate-800 text-slate-450 border-slate-800"
                  }`}>
                    {ag.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-slate-350">{ag.callsHandled} sessions</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-500 hover:text-red-400 transition-colors cursor-not-allowed opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
