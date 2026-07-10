import { useState } from "react";
import { Bell, CheckCheck, Trash2, AlertCircle, ShoppingBag } from "lucide-react";

import useNotificationStore from "@/store/notificationStore";

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 border border-slate-100/50 shadow-xs cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm shadow-blue-600/20">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Notifications</span>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
              {notifications.map((n) => {
                const isUnread = !n.read;
                const timeStr = new Date(n.created_at).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3.5 text-xs transition-colors cursor-pointer text-left ${
                      isUnread 
                        ? "bg-blue-50/20 hover:bg-blue-50/45 border-l-2 border-l-blue-650" 
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                        n.type === "order"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                          : "bg-blue-50 border-blue-100 text-blue-600"
                      }`}>
                        {n.type === "order" ? <ShoppingBag className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-slate-800 truncate ${isUnread ? "text-blue-650" : ""}`}>
                          {n.title}
                        </p>
                        <p className="text-slate-500 mt-0.5 leading-relaxed text-[11px]">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">{timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2 bg-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                    <Bell className="h-5 w-5 stroke-[1.6]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700">Inbox is Clear</p>
                    <p className="text-[10px] text-slate-405">No active alerts found.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
