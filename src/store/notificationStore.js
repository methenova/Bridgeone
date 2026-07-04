import { create } from "zustand";
import { persist } from "zustand/middleware";

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: "initial-1",
          title: "Welcome to BridgeOne! 🎉",
          message: "Explore live shopping channels and buy directly from your favorite local vendors.",
          read: false,
          created_at: new Date().toISOString(),
          type: "system",
        },
      ],

      // Add a notification
      addNotification: (title, message, type = "info", link = "") => {
        const newNotif = {
          id: Math.random().toString(),
          title,
          message,
          read: false,
          created_at: new Date().toISOString(),
          type,
          link,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
      },

      // Mark single as read
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      // Mark all as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      // Clear all
      clearAll: () => {
        set({ notifications: [] });
      },

      // Computed unread count
      get unreadCount() {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: "bridgeone-notifications",
    }
  )
);

export default useNotificationStore;
export { useNotificationStore };
