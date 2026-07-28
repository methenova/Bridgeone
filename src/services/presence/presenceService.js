import { supabase } from "../../config/supabase";

const activeChannels = new Map();
let heartbeatInterval = null;
let inactivityTimeout = null;
let lastActivityTime = Date.now();
let currentUserId = null;
let currentShopId = null;
let currentStatus = "offline";
let currentSessionId = Math.random().toString(36).substring(2, 15);

// Detect device type
const getDeviceType = () => {
  if (typeof window === "undefined") return "server";
  const ua = window.navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
};

/**
 * Dedicated Agent Presence Service (WebSocket + Database Fallback)
 * Designed for future Redis integration by wrapping the client interface.
 */
export class AgentPresenceService {
  /**
   * Set agent presence status (online, offline, away, busy, on_call, break).
   * 
   * @param {string} userId - User profile UUID
   * @param {string} shopId - Shop UUID
   * @param {string} status - Presence state
   */
  static async setPresence(userId, shopId, status) {
    if (!userId || !shopId) return;

    // Prevent redundant presence update if parameters and status are identical
    if (currentUserId === userId && currentShopId === shopId && currentStatus === status) {
      return;
    }

    currentUserId = userId;
    currentShopId = shopId;
    currentStatus = status;
    lastActivityTime = Date.now();

    try {
      // 1. Join / track on Realtime WebSocket channel (Live Presence separate from DB)
      let channel = activeChannels.get(shopId);
      if (!channel) {
        channel = supabase.channel(`presence:${shopId}`, {
          config: {
            presence: {
              key: userId
            }
          }
        });

        await new Promise((resolve) => {
          channel.subscribe(async (subStatus) => {
            if (subStatus === "SUBSCRIBED") {
              resolve();
            }
          });
        });
        activeChannels.set(shopId, channel);
      }

      await channel.track({
        user_id: userId,
        status: status,
        last_seen_at: new Date().toISOString()
      });

      // 2. Synchronize to database agent_presence table
      const now = new Date().toISOString();
      const presencePayload = {
        user_id: userId,
        shop_id: shopId,
        status: status,
        last_seen: now,
        last_activity: new Date(lastActivityTime).toISOString(),
        device_type: getDeviceType(),
        session_id: currentSessionId,
        updated_at: now
      };

      const { data: existing } = await supabase
        .from("agent_presence")
        .select("id")
        .eq("user_id", userId)
        .eq("shop_id", shopId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("agent_presence")
          .update(presencePayload)
          .eq("id", existing.id);
      } else {
        await supabase
          .from("agent_presence")
          .insert({ ...presencePayload, created_at: now });
      }

      // 3. Legacy shop_agents Sync (Backwards-compatibility)
      const { data: member } = await supabase
        .from("shop_members")
        .select("id")
        .eq("shop_id", shopId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (member) {
        let dbStatus = status;
        if (status === "on_call" || status === "busy" || status === "break") {
          dbStatus = "dnd"; // Fallback to DND for DB compatibility
        }

        await supabase
          .from("shop_agents")
          .update({
            status: dbStatus,
            last_seen_at: now
          })
          .eq("shop_member_id", member.id);
      }

      // 4. Initialize Heartbeat & Inactivity Tracking
      this.initHeartbeat();
      this.initInactivityTracker();

    } catch (err) {
      console.warn("[AgentPresenceService] setPresence failed:", err);
    }
  }

  /**
   * Heartbeat Loop (Runs every 30s updating last_seen to keep status fresh)
   */
  static initHeartbeat() {
    if (heartbeatInterval) return;

    heartbeatInterval = setInterval(async () => {
      if (!currentUserId || !currentShopId || currentStatus === "offline") {
        this.stopHeartbeat();
        return;
      }

      try {
        const now = new Date().toISOString();

        // Update WebSocket channel
        const channel = activeChannels.get(currentShopId);
        if (channel) {
          await channel.track({
            user_id: currentUserId,
            status: currentStatus,
            last_seen_at: now
          });
        }

        // Update Database presence row
        await supabase
          .from("agent_presence")
          .update({
            last_seen: now,
            updated_at: now
          })
          .eq("user_id", currentUserId)
          .eq("shop_id", currentShopId);

      } catch (err) {
        console.warn("[AgentPresenceService] Heartbeat failed:", err);
      }
    }, 30000);
  }

  static stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  /**
   * Inactivity Tracker (Auto-sets status to "away" after 10 minutes of browser idle)
   */
  static initInactivityTracker() {
    if (typeof window === "undefined" || inactivityTimeout) return;

    const resetActivity = () => {
      lastActivityTime = Date.now();
      
      // Auto-restore to online if user interacted and was previously marked away
      if (currentStatus === "away" && currentUserId && currentShopId) {
        console.info("[AgentPresenceService] User active: restoring online presence");
        this.setPresence(currentUserId, currentShopId, "online");
      }
    };

    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("click", resetActivity);
    window.addEventListener("scroll", resetActivity);

    // Check inactivity states every 60s
    inactivityTimeout = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivityTime;
      const tenMinutes = 10 * 60 * 1000;

      if (inactiveDuration >= tenMinutes && currentStatus === "online") {
        console.info("[AgentPresenceService] Inactivity timeout: setting status to away");
        this.setPresence(currentUserId, currentShopId, "away");
      }
    }, 60000);
  }

  static stopInactivityTracker() {
    if (inactivityTimeout) {
      clearInterval(inactivityTimeout);
      inactivityTimeout = null;
    }
  }

  /**
   * Get active presences for a shop.
   * 
   * @param {string} shopId - Shop UUID
   * @returns {object} Presence state map
   */
  static getPresence(shopId) {
    const channel = activeChannels.get(shopId);
    if (!channel) return {};
    return channel.presenceState();
  }

  /**
   * Subscribe to real-time presence changes.
   * 
   * @param {string} shopId - Shop UUID
   * @param {function} callback - Callback function receives presence state
   * @returns {function} Unsubscribe cleanup function
   */
  static subscribeToPresence(shopId, callback) {
    const channel = supabase.channel(`presence:${shopId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presenceMap = {};
        Object.keys(state).forEach((key) => {
          const userPresences = state[key];
          if (userPresences && userPresences.length > 0) {
            presenceMap[key] = userPresences[0];
          }
        });
        callback(presenceMap);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Terminate presence state and register offline status.
   */
  static async disconnect() {
    this.stopHeartbeat();
    this.stopInactivityTracker();

    if (currentUserId && currentShopId) {
      try {
        const now = new Date().toISOString();
        await supabase
          .from("agent_presence")
          .update({
            status: "offline",
            last_seen: now,
            updated_at: now
          })
          .eq("user_id", currentUserId)
          .eq("shop_id", currentShopId);

        const channel = activeChannels.get(currentShopId);
        if (channel) {
          await channel.unsubscribe();
          activeChannels.delete(currentShopId);
        }
      } catch (err) {
        console.warn("[AgentPresenceService] Disconnect failed:", err);
      }
    }
  }
}

// Bind browser unload hooks to cleanup status
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    AgentPresenceService.disconnect();
  });
}
