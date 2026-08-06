import { useState, useEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";
import { realtimeManager } from "@/services/realtime/realtimeManager";
import useSellerShop from "@/features/seller/hooks/useSellerShop";
import PremiumLayout from "./components/PremiumLayout";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Video,
  Users,
  Shield,
  Sliders,
  BarChart3,
  Bell,
  Layers,
  Settings,
  User,
  Store
} from "lucide-react";

const menu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", badge: null },
  { title: "Live Calls", icon: Video, path: "/dashboard/live", badge: "Live" },
  { title: "Customers", icon: Users, path: "/dashboard/customers", badge: null },
  { title: "Agents", icon: Shield, path: "/dashboard/agents", badge: null },
  { title: "Widget", icon: Sliders, path: "/dashboard/widget", badge: null },
  { title: "Analytics", icon: BarChart3, path: "/dashboard/analytics", badge: null },
  { title: "Notifications", icon: Bell, path: "/dashboard/notifications", badge: null },
  { title: "Integrations", icon: Layers, path: "/dashboard/integrations", badge: null },
  { title: "Settings", icon: Settings, path: "/dashboard/settings", badge: null },
  { title: "Shop Manager", icon: Store, path: "/dashboard/profile", badge: null },
];

export default function SellerLayout() {
  const { profile, loading, logout } = useAuthContext();
  const { shop, loading: shopLoading } = useSellerShop();
  const ringingCallsRef = useRef(new Map());
  const activeNotificationsRef = useRef(new Map());
  const shopId = shop?.id;
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Request HTML5 Browser Notification permissions on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  // 2. Setup Realtime subscriptions for:
  // - Incoming Calls / Missed Calls / Callback Requests (from notifications table)
  // - Customer Messages (from messages table)
  // - Agent Status Changes (from shop_agents table)
  useEffect(() => {
    if (!shopId || !profile?.id) return;

    // sound chime alert for general notifications
    const chime = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
    
    // professional looped ringtone for incoming calls
    const ringtone = new Audio("https://assets.mixkit.co/active_storage/sfx/2870/2870-84.wav");
    ringtone.loop = true;

    // Single consolidated channel for all Postgres changes updates to minimize sockets and memory leaks
    const topic = `global-seller-channel-${shopId}`;
    const globalSellerSub = realtimeManager.subscribe(topic)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const notif = payload.new;
          if (notif.is_read) return;
          if (notif.type === "incoming_call") return; // Handled dynamically below to allow auto-closing

          chime.play().catch(() => {});

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(notif.title || "BridgeOne Alert", {
              body: notif.body || "",
              icon: "/favicon.svg"
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          const msg = payload.new;
          if (msg.sender_id === profile.id) return; // Ignore own messages

          chime.play().catch(() => {});

          // Fetch sender details
          const { data: senderProf } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.sender_id)
            .single();

          const senderName = senderProf?.full_name || "Customer";

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`New Message from ${senderName}`, {
              body: msg.content || "Sent an attachment",
              icon: "/favicon.svg"
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shop_agents", filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          const newAgent = payload.new;
          const oldAgent = payload.old;
          if (newAgent.profile_id === profile.id) return; // Ignore self updates
          if (oldAgent && oldAgent.status === newAgent.status) return; // Ignore if status is identical

          chime.play().catch(() => {});

          // Fetch agent details
          const { data: agentProf } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newAgent.profile_id)
            .single();

          const agentName = agentProf?.full_name || "Team Agent";

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("Agent Presence Update", {
              body: `${agentName} is now ${newAgent.status || "Offline"}`,
              icon: "/favicon.svg"
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "video_rooms", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const room = payload.new;
          const roomCode = room.room_key || room.room_code || "";
          if (room.status !== "waiting" && room.status !== "ringing" && room.status !== "connected") return;
          
          ringingCallsRef.current.set(room.id, room);
          
          ringtone.play().catch(() => {});
          if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
            // Professional vibration pattern for incoming calls
            navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500]);
          }

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const n = new Notification("Incoming Video Call", {
              body: `Incoming call in room: ${roomCode}`,
              icon: "/favicon.svg"
            });
            activeNotificationsRef.current.set(room.id, n);
          }

          // Auto-navigate to Live page to accept the call immediately
          if (window.location.pathname !== "/dashboard/live") {
            toast.success("Incoming call — connecting...", { duration: 2000 });
            navigate("/dashboard/live");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "video_rooms", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const room = payload.new;
          if (room.answer) {
            // Call was accepted
            ringingCallsRef.current.delete(room.id);
            toast.dismiss(`call-${room.id}`);
            
            // Stop ringtone and vibration if no other calls are ringing
            if (ringingCallsRef.current.size === 0) {
              ringtone.pause();
              ringtone.currentTime = 0;
              if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(0);
            }
            
            const n = activeNotificationsRef.current.get(room.id);
            if (n) {
              n.close();
              activeNotificationsRef.current.delete(room.id);
            }
            
            // Clean up the transient incoming call database notification
            supabase.from("notifications").delete().match({ shop_id: shopId, type: "incoming_call" }).then();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "video_rooms", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const roomId = payload.old.id;
          if (ringingCallsRef.current.has(roomId)) {
            // Call was never answered, so it's a missed call
            ringingCallsRef.current.delete(roomId);
            toast.dismiss(`call-${roomId}`);
            
            // Stop ringtone and vibration if no other calls are ringing
            if (ringingCallsRef.current.size === 0) {
              ringtone.pause();
              ringtone.currentTime = 0;
              if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(0);
            }
            
            const n = activeNotificationsRef.current.get(roomId);
            if (n) {
              n.close();
              activeNotificationsRef.current.delete(roomId);
            }
            
            // Clean up the transient incoming call database notification since it's now a missed call
            supabase.from("notifications").delete().match({ shop_id: shopId, type: "incoming_call" }).then();
            
            // Only show missed call toast if not on the Live page (Live page shows its own)
            if (window.location.pathname !== "/dashboard/live") {
              toast.error("Missed Video Call", { id: `missed-${roomId}`, duration: 5000, position: "top-center" });
            }
          }
        }
      )
      .subscribe();

    return () => {
      realtimeManager.unsubscribe(topic);
    };
  }, [shopId, profile?.id, navigate]);

  // 3. Auto-mark related notifications as read when opening respective paths
  useEffect(() => {
    if (!shopId || !profile?.id) return;

    async function autoMarkRead() {
      const path = location.pathname;
      let typesToMark = [];

      if (path === "/dashboard/live") {
        typesToMark = ["incoming_call", "missed_call"];
      } else if (path === "/dashboard/callbacks") {
        typesToMark = ["callback_request"];
      } else if (path === "/dashboard/chat") {
        typesToMark = ["new_message"];
      } else if (path === "/dashboard/agents") {
        typesToMark = ["system"];
      }

      if (typesToMark.length > 0) {
        try {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("shop_id", shopId)
            .in("type", typesToMark)
            .eq("is_read", false);
        } catch (err) {
          console.warn("Failed to auto-mark notifications as read:", err);
        }
      }
    }

    autoMarkRead();
  }, [location.pathname, shopId, profile?.id]);

  if (loading || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  if (profile?.role !== "seller" && profile?.role !== "owner" && profile?.role !== "agent" && profile?.role !== "admin" && profile?.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  // Filter menu items for Agents
  const filteredMenu = menu.filter(item => {
    if (profile?.role === "agent") {
      // Hide owner-only features from agents
      return !["Agents", "Widget", "Integrations", "Analytics", "Notifications"].includes(item.title);
    }
    return true;
  });

  return (
    <PremiumLayout
      menuItems={filteredMenu}
      profile={profile}
      onLogout={handleLogout}
      workspaceName={shop?.shop_name || "My Store"}
      baseRoute="/dashboard"
      marketplaceRoute="/"
      shopId={shopId}
    />
  );
}
