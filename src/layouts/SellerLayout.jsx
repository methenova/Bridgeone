import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/config/supabase";
import useSellerShop from "@/features/seller/hooks/useSellerShop";
import PremiumLayout from "./components/PremiumLayout";
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

    // sound chime alert
    const sound = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");

    // Subscription A: Table notifications (Incoming/Missed calls, callbacks)
    const notifSub = supabase.channel(`global-notif-insert-${shopId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const notif = payload.new;
          if (notif.is_read) return;

          sound.play().catch(() => {});

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

          sound.play().catch(() => {});

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

          sound.play().catch(() => {});

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

    return () => {
      supabase.removeChannel(notifSub);
      supabase.removeChannel(msgSub);
      supabase.removeChannel(agentSub);
    };
  }, [shopId, profile?.id]);

  // 3. Auto-mark related notifications as read when opening respective paths
  useEffect(() => {
    if (!shopId || !profile?.id) return;

    async function autoMarkRead() {
      const path = location.pathname;
      let typesToMark = [];

      if (path === "/seller/live") {
        typesToMark = ["incoming_call", "missed_call"];
      } else if (path === "/seller/callbacks") {
        typesToMark = ["callback_reminder"];
      } else if (path === "/seller/chat") {
        typesToMark = ["customer_message"];
      } else if (path === "/seller/agents") {
        typesToMark = ["agent_status_change"];
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
      workspaces={shop ? [{ name: shop.shop_name || "My Store" }] : []}
      baseRoute="/seller"
      marketplaceRoute="/"
    />
  );
}
