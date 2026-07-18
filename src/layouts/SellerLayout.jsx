import { useState, useEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";
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
  User
} from "lucide-react";

const menu = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/seller", badge: null },
  { title: "Live Calls", icon: Video, path: "/seller/live", badge: "Live" },
  { title: "Customers", icon: Users, path: "/seller/customers", badge: null },
  { title: "Agents", icon: Shield, path: "/seller/agents", badge: null },
  { title: "Widget", icon: Sliders, path: "/seller/widget", badge: null },
  { title: "Analytics", icon: BarChart3, path: "/seller/analytics", badge: null },
  { title: "Notifications", icon: Bell, path: "/seller/notifications", badge: null },
  { title: "Integrations", icon: Layers, path: "/seller/integrations", badge: null },
  { title: "Settings", icon: Settings, path: "/seller/settings", badge: null },
  { title: "Profile", icon: User, path: "/seller/profile", badge: null },
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

    // Subscription A: Table notifications (Incoming/Missed calls, callbacks)
    const notifSub = supabase.channel(`global-notif-insert-${shopId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const notif = payload.new;
          if (notif.is_read) return;
          if (notif.type === "incoming_call") return; // Handled dynamically by callsSub to allow auto-closing

          chime.play().catch(() => {});

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(notif.title || "BridgeOne Alert", {
              body: notif.body || "",
              icon: "/favicon.ico"
            });
          }
        }
      )
      .subscribe();

    // Subscription B: Table messages (Customer messages)
    const msgSub = supabase.channel(`global-msg-insert-${shopId}`)
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
              icon: "/favicon.ico"
            });
          }
        }
      )
      .subscribe();

    // Subscription C: Table shop_agents (Agent Presence Updates)
    const agentSub = supabase.channel(`global-agent-update-${shopId}`)
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
              icon: "/favicon.ico"
            });
          }
        }
      )
      .subscribe();

    // Subscription D: Table video_rooms (Incoming Video Calls Global Popup)
    const callsSub = supabase.channel(`global-calls-insert-${shopId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "video_rooms", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const room = payload.new;
          if (room.status !== "connected") return;
          
          ringingCallsRef.current.set(room.id, room);
          
          ringtone.play().catch(() => {});
          if (navigator.vibrate) {
            // Professional vibration pattern for incoming calls
            navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500]);
          }

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const n = new Notification("Incoming Video Call", {
              body: `Incoming call in room: ${room.room_code}`,
              icon: "/favicon.ico"
            });
            activeNotificationsRef.current.set(room.id, n);
          }

          // Don't show toast if we are already on the Live page, as it handles its own full-screen modal
          if (window.location.pathname === "/seller/live") return;

          toast((t) => (
            <div className="flex flex-col gap-2 p-1 min-w-[200px]">
              <div className="font-bold text-sm text-slate-900">Incoming Video Call!</div>
              <div className="text-xs text-slate-500">A customer is requesting a live consultation.</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => {
                  toast.dismiss(t.id);
                  ringingCallsRef.current.delete(room.id);
                }} className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Dismiss</button>
                <button onClick={() => {
                  toast.dismiss(t.id);
                  ringingCallsRef.current.delete(room.id);
                  navigate("/seller/live");
                }} className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-500/20 transition-all active:scale-95">Answer Call</button>
              </div>
            </div>
          ), { duration: 30000, id: `call-${room.id}`, position: "top-center" });
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
              if (navigator.vibrate) navigator.vibrate(0);
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
              if (navigator.vibrate) navigator.vibrate(0);
            }
            
            const n = activeNotificationsRef.current.get(roomId);
            if (n) {
              n.close();
              activeNotificationsRef.current.delete(roomId);
            }
            
            // Clean up the transient incoming call database notification since it's now a missed call
            supabase.from("notifications").delete().match({ shop_id: shopId, type: "incoming_call" }).then();
            
            // Only show missed call toast if not on the Live page (Live page shows its own)
            if (window.location.pathname !== "/seller/live") {
              toast.error("Missed Video Call", { id: `missed-${roomId}`, duration: 5000, position: "top-center" });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifSub);
      supabase.removeChannel(msgSub);
      supabase.removeChannel(agentSub);
      supabase.removeChannel(callsSub);
    };
  }, [shopId, profile?.id, navigate]);

  // 3. Auto-mark related notifications as read when opening respective paths
  useEffect(() => {
    if (!shopId || !profile?.id) return;

    async function autoMarkRead() {
      const path = location.pathname;
      let typesToMark = [];

      if (path === "/seller/live") {
        typesToMark = ["incoming_call", "missed_call"];
      } else if (path === "/seller/callbacks") {
        typesToMark = ["callback_request"];
      } else if (path === "/seller/chat") {
        typesToMark = ["new_message"];
      } else if (path === "/seller/agents") {
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

  if (profile?.role !== "seller" && profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <PremiumLayout
      menuItems={menu}
      profile={profile}
      onLogout={handleLogout}
      workspaceName={shop?.shop_name || "My Store"}
      baseRoute="/seller"
      marketplaceRoute="/"
      shopId={shopId}
    />
  );
}
