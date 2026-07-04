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
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/40">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-850">
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
                    className={`p-3.5 text-xs transition-colors cursor-pointer ${
                      isUnread ? "bg-blue-600/5 hover:bg-blue-600/10" : "hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        n.type === "order"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {n.type === "order" ? <ShoppingBag className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-white truncate ${isUnread ? "text-blue-400" : ""}`}>
                          {n.title}
                        </p>
                        <p className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">{n.message}</p>
                        <span className="text-[9px] text-slate-500 block mt-1">{timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Bell className="h-8 w-8 mb-2 stroke-[1.5]" />
                  <p className="text-xs">No notifications yet.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
