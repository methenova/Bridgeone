import { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Trash2, 
  Check, 
  Info, 
  Clock, 
  PhoneCall, 
  PhoneMissed,
  CalendarCheck,
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";

export default function SellerNotificationsPage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "calls" | "callbacks" | "system"

  // Channel toggles
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Load notifications from database
  async function loadNotifications() {
    if (!shopId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [shopId]);

  // Mark single as read
  async function handleMarkRead(id) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      toast.success("Notification marked as read");
    } catch (err) {
      toast.error(err.message || "Failed to update notification");
    }
  }

  // Clear all notifications
  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to clear all notification alerts?")) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("shop_id", shopId);

      if (error) throw error;
      setNotifications([]);
      toast.success("Notification center cleared");
    } catch (err) {
      toast.error(err.message || "Failed to clear notifications");
    }
  }

  // Filtered notifications calculation
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === "unread") return !n.is_read;
      if (activeTab === "calls") return n.type === "incoming_call" || n.type === "missed_call";
      if (activeTab === "callbacks") return n.type === "callback_reminder";
      if (activeTab === "system") return n.type === "system";
      return true;
    });
  }, [notifications, activeTab]);

  // Inject a mock/test notification for testing triggers
  async function handleCreateTestNotification(type) {
    if (!shopId) return;
    let title = "System Alert";
    let message = "A test notification trigger has fired.";
    
    if (type === "incoming_call") {
      title = "Incoming Call Alert";
      message = "A customer has initiated a live video consultation call.";
    } else if (type === "missed_call") {
      title = "Missed Call Alert";
      message = "You missed a live video call from Guest Customer.";
    } else if (type === "callback_reminder") {
      title = "Callback Reminder";
      message = "New callback requested for tomorrow at 11:30 AM.";
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .insert({
          shop_id: shopId,
          title,
          message,
          type,
          is_read: false
        });

      if (error) throw error;
      toast.success("Test notification created!");
      loadNotifications();
    } catch (err) {
      toast.error("Failed to create test notification");
    }
  }

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
          <h1 className="text-3xl font-extrabold tracking-tight">Notification Center</h1>
          <p className="mt-1 text-xs text-slate-400">View real-time video consultation alerts, missed call queues, and configure channels settings.</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-xs font-bold text-slate-400 hover:text-white px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left 2 Cols: In-app Notification List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs header selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-850 rounded-2xl self-start overflow-x-auto text-[10px] font-bold uppercase tracking-wider">
            {["all", "unread", "calls", "callbacks", "system"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Notifications feed */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((n, idx) => {
                const isCall = n.type === "incoming_call" || n.type === "missed_call";
                const isCallback = n.type === "callback_reminder";
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={n.id}
                    className={`rounded-2xl border p-4.5 flex gap-4 items-start transition-all ${
                      n.is_read 
                        ? "border-slate-900 bg-slate-900/10 opacity-70" 
                        : "border-slate-850 bg-slate-900/30"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === "incoming_call" 
                        ? "bg-blue-500/10 text-blue-400" 
                        : n.type === "missed_call" 
                        ? "bg-rose-500/10 text-rose-400"
                        : isCallback 
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-indigo-500/10 text-indigo-400"
                    }`}>
                      {n.type === "incoming_call" ? (
                        <PhoneCall className="h-4 w-4" />
                      ) : n.type === "missed_call" ? (
                        <PhoneMissed className="h-4 w-4" />
                      ) : isCallback ? (
                        <CalendarCheck className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>

                    {/* Details content */}
                    <div className="flex-1 space-y-1 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white block">{n.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(n.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-slate-450 leading-relaxed text-[11px]">{n.message}</p>
                    </div>

                    {/* Actions */}
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="h-7 w-7 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        title="Mark as Read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredNotifications.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center border border-slate-900 rounded-2xl bg-slate-900/10">
                <Bell className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
                <p className="text-sm font-bold text-slate-400">All caught up!</p>
                <p className="text-[10px] text-slate-500 mt-0.5">No notifications found under this category.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Channel settings & Sandbox Testing tools */}
        <div className="space-y-6">
          
          {/* Configurations */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-5 text-xs">
            <h3 className="text-[10px] font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-900">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Channels Settings</span>
            </h3>

            {/* In-app */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-[180px]">
                <span className="font-bold text-white block">In-App Notices</span>
                <p className="text-[10px] text-slate-500 leading-normal">Render call banners inside seller dashboards.</p>
              </div>
              <button
                onClick={() => setInAppEnabled(!inAppEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  inAppEnabled ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${inAppEnabled ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Email notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-[180px]">
                <span className="font-bold text-white block flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" /> Email Warning alerts
                </span>
                <p className="text-[10px] text-slate-500 leading-normal">Send logs of missed consultations via mail.</p>
              </div>
              <button
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  emailEnabled ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${emailEnabled ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Push notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-[180px]">
                <span className="font-bold text-white block flex items-center gap-1">
                  <Smartphone className="h-3 w-3 text-slate-400" /> Browser Push alerts
                </span>
                <p className="text-[10px] text-slate-500 leading-normal">Allow system chrome alerts for calls room signalling.</p>
              </div>
              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  pushEnabled ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${pushEnabled ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* Alert trigger Sandbox testing */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4 text-xs">
            <div>
              <span className="font-bold text-white block">Alert testing sandbox</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Manually invoke notifications triggers to test channels flow.</p>
            </div>

            <div className="grid gap-2 grid-cols-2 text-[10px] uppercase font-bold tracking-wider">
              <button
                onClick={() => handleCreateTestNotification("incoming_call")}
                className="py-2.5 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-800 hover:text-white text-slate-400 transition-colors"
              >
                Trigger call
              </button>
              
              <button
                onClick={() => handleCreateTestNotification("missed_call")}
                className="py-2.5 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-800 hover:text-white text-slate-400 transition-colors"
              >
                Trigger missed
              </button>

              <button
                onClick={() => handleCreateTestNotification("callback_reminder")}
                className="py-2.5 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-800 hover:text-white text-slate-400 transition-colors"
              >
                Trigger callback
              </button>

              <button
                onClick={() => handleCreateTestNotification("system")}
                className="py-2.5 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-800 hover:text-white text-slate-400 transition-colors"
              >
                Trigger system
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
