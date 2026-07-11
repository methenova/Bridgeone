import { useState } from "react";
import { 
  Bell, 
  Send, 
  Mail, 
  Smartphone, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Info,
  Building,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function AdminNotificationsPage() {
  const [channel, setChannel] = useState("banner"); // "banner" | "email" | "push"
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAudience, setTargetAudience] = useState("all"); // "all" | "sellers"
  const [submitting, setSubmitting] = useState(false);

  // Mock list of notification histories
  const [history, setHistory] = useState([
    {
      id: 1,
      title: "Planned TURN Signalling Host maintenance",
      body: "Database servers will undergo hardware updates on July 10th at 03:00 UTC. Expect minor call signaling delays.",
      channel: "banner",
      audience: "All Merchants",
      date: "08-Jul-2026",
      status: "Dispatched"
    },
    {
      id: 2,
      title: "Pricing plan limits policy update",
      body: "Free tier shop limits have been updated. Capped limits are now strictly enforced automatically MTD.",
      channel: "email",
      audience: "Basic Tier Users",
      date: "04-Jul-2026",
      status: "Dispatched"
    }
  ]);

  // Submit announcement handler
  async function handleSendBroadcast(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Announcement title and message body are required!");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const newLog = {
        id: Date.now(),
        title,
        body,
        channel,
        audience: targetAudience === "all" ? "All Platform Users" : "All Merchants / Sellers",
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        status: "Dispatched"
      };

      setHistory(prev => [newLog, ...prev]);
      setTitle("");
      setBody("");
      setSubmitting(false);
      toast.success("Platform announcement broadcasted successfully!");
    }, 1000);
  }

  return (
    <div className="space-y-6 text-slate-900 max-w-6xl relative">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Platform Broadcasts</h1>
        <p className="mt-1 text-xs text-slate-500">Broadcast warning banners to seller dashboards, email updates, and push notifications.</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Left 2 Cols: Form to compose announcement */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-500" />
            <span>Compose Broadcast</span>
          </h2>

          <form onSubmit={handleSendBroadcast} className="space-y-5 text-xs">
            
            {/* Delivery Channel Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Delivery Mode</label>
              <div className="grid grid-cols-3 gap-3">
                
                {/* Banner */}
                <Button
                  type="button"
                  onClick={() => setChannel("banner")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    channel === "banner" 
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold" 
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200"
                  }`}
                >
                  <Bell className="h-4 w-4 mb-1" />
                  <span>In-App Banner</span>
                </Button>

                {/* Email */}
                <Button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    channel === "email" 
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold" 
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200"
                  }`}
                >
                  <Mail className="h-4 w-4 mb-1" />
                  <span>Email Broadcast</span>
                </Button>

                {/* Mobile push */}
                <Button
                  type="button"
                  onClick={() => setChannel("push")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    channel === "push" 
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold" 
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200"
                  }`}
                >
                  <Smartphone className="h-4 w-4 mb-1" />
                  <span>Mobile Push</span>
                </Button>

              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 font-semibold"
              >
                <option value="all">All Platform Users (Sellers + Customers)</option>
                <option value="sellers">Registered Sellers / Shop Owners only</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Announcement Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="planned server maintenance window..."
                className="w-full rounded-xl border border-slate-200 bg-slate-955 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Broadcast Message Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Write warning details here..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send Broadcast Alert</span>
              </Button>
            </div>

          </form>
        </div>

        {/* Right 1 Col: Broadcast Log History */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500">Broadcast History</h3>
            <p className="text-xs text-slate-500">Previously dispatched communications log</p>
          </div>

          <div className="space-y-4">
            {history.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 leading-normal line-clamp-1">{log.title}</h4>
                    <p className="text-[9px] text-slate-500 font-semibold">{log.date} · {log.audience}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400 uppercase">
                    Sent
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{log.body}</p>
                <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-100">
                  Channel: <span className="uppercase font-semibold text-slate-700">{log.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
