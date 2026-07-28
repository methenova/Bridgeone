import { supabase } from "../../config/supabase";

/**
 * Helper to check if current time is within business hours.
 */
export function isWithinBusinessHours(hoursString) {
  if (!hoursString) return true;

  try {
    const cleanStr = hoursString.trim().toLowerCase();
    if (
      cleanStr === "24/7" ||
      cleanStr === "always open" ||
      cleanStr === "always" ||
      cleanStr === ""
    ) {
      return true;
    }

    const parts = cleanStr.split(":");
    if (parts.length < 2) return true;

    const daysPart = parts[0].trim();
    const timesPart = parts.slice(1).join(":").trim();

    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const currentDayName = dayNames[now.getDay()];

    let dayMatch = false;
    if (daysPart.includes("-")) {
      const [startDay, endDay] = daysPart.split("-").map((d) => d.trim());
      const startIndex = dayNames.indexOf(startDay);
      const endIndex = dayNames.indexOf(endDay);
      const currentIndex = now.getDay();

      if (startIndex !== -1 && endIndex !== -1) {
        if (startIndex <= endIndex) {
          dayMatch = currentIndex >= startIndex && currentIndex <= endIndex;
        } else {
          dayMatch = currentIndex >= startIndex || currentIndex <= endIndex;
        }
      }
    } else if (daysPart.includes(",")) {
      const allowedDays = daysPart.split(",").map((d) => d.trim());
      dayMatch = allowedDays.includes(currentDayName);
    } else {
      dayMatch = daysPart === currentDayName;
    }

    if (!dayMatch) return false;

    const timeRanges = timesPart.split("-").map((t) => t.trim());
    if (timeRanges.length === 2) {
      const [startTimeStr, endTimeStr] = timeRanges;
      const [startHour, startMin] = startTimeStr.split(":").map(Number);
      const [endHour, endMin] = endTimeStr.split(":").map(Number);

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      const currentTotalMin = currentHour * 60 + currentMin;
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;

      return currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
    }
  } catch (err) {
    console.warn("[CallRouter] isWithinBusinessHours parse error:", err);
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// Routing Strategies (Strategy Pattern)
// ─────────────────────────────────────────────────────────────

/**
 * Base Routing Strategy Interface
 */
export class RoutingStrategy {
  async selectAgent(agents, context = {}) {
    throw new Error("selectAgent() not implemented");
  }
}

/**
 * Round-Robin Routing Strategy (Persisted rotational index)
 */
export class RoundRobinStrategy extends RoutingStrategy {
  async selectAgent(agents, context = {}) {
    if (!agents || agents.length === 0) return null;

    const shopId = context.shopId;
    const storageKey = `call-router-last-index-${shopId}`;
    let lastIndex = -1;

    if (typeof window !== "undefined") {
      const cachedVal = window.localStorage.getItem(storageKey);
      if (cachedVal !== null) {
        lastIndex = parseInt(cachedVal, 10);
      }
    }

    const nextIndex = (lastIndex + 1) % agents.length;
    const selected = agents[nextIndex];

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, nextIndex.toString());
    }

    return selected;
  }
}

/**
 * Least-Active Routing Strategy (Assigns agent with lowest concurrent loads)
 */
export class LeastActiveStrategy extends RoutingStrategy {
  async selectAgent(agents, context = {}) {
    if (!agents || agents.length === 0) return null;

    const shopId = context.shopId;
    const profileIds = agents.map((a) => a.profileId);

    // Query active conversations
    const { data: activeConvs, error } = await supabase
      .from("conversations")
      .select("agent_id")
      .eq("status", "open")
      .eq("shop_id", shopId)
      .in("agent_id", profileIds);

    if (error) throw error;

    const convCounts = {};
    profileIds.forEach((pid) => {
      convCounts[pid] = 0;
    });

    (activeConvs || []).forEach((c) => {
      if (c.agent_id && convCounts[c.agent_id] !== undefined) {
        convCounts[c.agent_id]++;
      }
    });

    // Filter agents by capacity threshold
    let eligible = agents.filter((a) => (convCounts[a.profileId] || 0) < a.maxActive);
    if (eligible.length === 0) return null;

    // Sort by conversation count ascending
    eligible.sort((a, b) => (convCounts[a.profileId] || 0) - (convCounts[b.profileId] || 0));
    return eligible[0];
  }
}

/**
 * Priority Routing Strategy (Prioritizes owners or managers)
 */
export class PriorityRoutingStrategy extends RoutingStrategy {
  constructor(baseStrategy = new RoundRobinStrategy()) {
    super();
    this.baseStrategy = baseStrategy;
  }

  async selectAgent(agents, context = {}) {
    if (!agents || agents.length === 0) return null;

    // Filter priority agents (role owner/manager)
    const priorityAgents = agents.filter((a) => a.role === "owner" || a.role === "manager");
    
    if (priorityAgents.length > 0) {
      const selected = await this.baseStrategy.selectAgent(priorityAgents, context);
      if (selected) return selected;
    }

    // Fallback to remaining general agents
    return this.baseStrategy.selectAgent(agents, context);
  }
}

/**
 * AI-Based Routing Strategy (AI-ready placeholder matching visitor context)
 */
export class AIRoutingStrategy extends RoutingStrategy {
  async selectAgent(agents, context = {}) {
    if (!agents || agents.length === 0) return null;

    const visitor = context.visitor || {};
    console.info(`[AIRouting] Analyzing visitor context: Lang=${visitor.language}, Referrer=${visitor.referrer}`);

    // Placeholder: match language profiles if available, else fallback to Round Robin
    const defaultStrategy = new RoundRobinStrategy();
    return defaultStrategy.selectAgent(agents, context);
  }
}

// ─────────────────────────────────────────────────────────────
// Call Router Engine
// ─────────────────────────────────────────────────────────────

export class CallRouter {
  /**
   * Router Engine main entrypoint.
   */
  static async routeCall(shopId, callType, visitor = {}, options = {}) {
    try {
      // 1. Validate Shop
      const { data: shop, error: shopErr } = await supabase
        .from("shops")
        .select("id, status, business_hours, owner_id")
        .eq("id", shopId)
        .maybeSingle();

      if (shopErr || !shop) {
        return { success: false, queueRequired: false, reason: "shop_not_found" };
      }

      if (shop.status === "archived") {
        return { success: false, queueRequired: false, reason: "shop_archived" };
      }

      // 2. Check Business Hours
      if (!isWithinBusinessHours(shop.business_hours)) {
        return { success: false, queueRequired: false, reason: "outside_business_hours" };
      }

      // 3. Check Subscription Validity
      const { data: sub, error: subErr } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("shop_id", shopId)
        .maybeSingle();

      if (subErr) throw subErr;
      if (sub) {
        const inactiveStatuses = ["canceled", "unpaid", "past_due"];
        if (inactiveStatuses.includes(sub.status)) {
          return { success: false, queueRequired: false, reason: "subscription_inactive" };
        }
      }

      // 4. Query live online agents (heartbeat <= 90 seconds)
      const threshold = new Date(Date.now() - 90000).toISOString();
      const { data: onlinePresences, error: presenceErr } = await supabase
        .from("agent_presence")
        .select("user_id, status, last_seen")
        .eq("shop_id", shopId)
        .eq("status", "online")
        .gte("last_seen", threshold);

      if (presenceErr) throw presenceErr;

      const onlineUserIds = new Set((onlinePresences || []).map((p) => p.user_id));

      if (onlineUserIds.size === 0) {
        // Fallback: Check if owner is online in database
        const { data: ownerPres } = await supabase
          .from("agent_presence")
          .select("status")
          .eq("user_id", shop.owner_id)
          .eq("shop_id", shopId)
          .eq("status", "online")
          .gte("last_seen", threshold)
          .maybeSingle();

        if (ownerPres) {
          onlineUserIds.add(shop.owner_id);
        } else {
          return { success: false, queueRequired: true, reason: "no_agent_available" };
        }
      }

      // Fetch agent profiles and capacities
      const profileIds = Array.from(onlineUserIds);
      const { data: shopAgents, error: agentsErr } = await supabase
        .from("shop_agents")
        .select(`
          id,
          display_name,
          max_active_conversations,
          shop_members!inner (
            id,
            profile_id,
            role,
            shop_id
          )
        `)
        .eq("shop_members.shop_id", shopId)
        .in("shop_members.profile_id", profileIds);

      if (agentsErr) throw agentsErr;

      let availableAgents = (shopAgents || []).map((a) => ({
        agentRecordId: a.id,
        profileId: a.shop_members?.profile_id,
        role: a.shop_members?.role,
        maxActive: a.max_active_conversations || 3
      }));

      // 5. Exclude Busy Agents (Ignore busy, on_call, break status, or active video_rooms)
      const { data: activeRooms, error: roomsErr } = await supabase
        .from("video_rooms")
        .select("agent_id")
        .eq("shop_id", shopId)
        .in("status", ["waiting", "ringing", "connected"]);

      if (roomsErr) throw roomsErr;

      const busyProfileIds = new Set((activeRooms || []).map((r) => r.agent_id).filter(Boolean));

      // Exclude break or away statuses from agent_presence table
      const { data: nonOnlinePres } = await supabase
        .from("agent_presence")
        .select("user_id")
        .eq("shop_id", shopId)
        .in("status", ["busy", "on_call", "break", "away"]);

      (nonOnlinePres || []).forEach((p) => {
        busyProfileIds.add(p.user_id);
      });

      availableAgents = availableAgents.filter((a) => !busyProfileIds.has(a.profileId));

      if (options.excludeAgentId) {
        availableAgents = availableAgents.filter((a) => a.profileId !== options.excludeAgentId);
      }

      if (availableAgents.length === 0) {
        return { success: false, queueRequired: true, reason: "no_agent_available" };
      }

      // 6. Select Strategy
      let strategy = new RoundRobinStrategy();
      const strategyType = options.strategy || "round-robin";

      if (strategyType === "least-active") {
        strategy = new LeastActiveStrategy();
      } else if (strategyType === "priority") {
        strategy = new PriorityRoutingStrategy(new RoundRobinStrategy());
      } else if (strategyType === "ai") {
        strategy = new AIRoutingStrategy();
      }

      // 7. Route and return selected agent
      const selected = await strategy.selectAgent(availableAgents, {
        shopId,
        visitor
      });

      if (!selected) {
        return { success: false, queueRequired: true, reason: "no_agent_available" };
      }

      return {
        success: true,
        queueRequired: false,
        agentId: selected.profileId,
        role: selected.role,
        agentRecordId: selected.agentRecordId
      };
    } catch (err) {
      console.error("[CallRouter] Call routing failed with error:", err);
      return { success: false, queueRequired: false, reason: "internal_error" };
    }
  }
}
