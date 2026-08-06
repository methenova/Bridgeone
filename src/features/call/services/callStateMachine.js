import { supabase } from "@/config/supabase";
import { CallRouter } from "./callRouter";
import { sendPushNotification } from "@/services/notification/notification.service";

/**
 * Reusable Declarative Call State Machine
 */
const Transitions = {
  // currentState: { action: newState }
  ringing: {
    accept: "connected",
    reject: "rejected",
    busy: "busy",
    timeout: "timeout",
    cancel: "canceled",
    missed: "missed"
  },
  connected: {
    hangup: "completed",
    fail: "failed"
  },
  waiting: {
    ringing: "ringing",
    cancel: "canceled"
  }
};

export class CallStateMachine {
  /**
   * Transition call room state and handle business flow side-effects
   */
  static async transitionTo(roomId, action, context = {}) {
    try {
      // 1. Fetch current call state
      const { data: room, error: fetchErr } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (fetchErr || !room) {
        console.warn(`[CallStateMachine] Room not found: ${roomId}`);
        return { success: false, reason: "room_not_found" };
      }

      const currentState = room.status || "waiting";
      const allowedActions = Transitions[currentState];

      if (!allowedActions || !allowedActions[action]) {
        console.warn(`[CallStateMachine] Invalid action '${action}' for state '${currentState}'`);
        return { success: false, reason: "invalid_transition" };
      }

      const nextState = allowedActions[action];
      const now = new Date().toISOString();

      const updatePayload = {
        status: nextState,
        updated_at: now
      };

      if (nextState === "connected") {
        updatePayload.started_at = now;
      } else if (["completed", "failed", "rejected", "canceled", "missed", "timeout"].includes(nextState)) {
        updatePayload.ended_at = now;
      }

      // 2. Perform database update
      const { data: updatedRoom, error: updateErr } = await supabase
        .from("video_rooms")
        .update(updatePayload)
        .eq("id", roomId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // 3. Side Effects based on state
      if (nextState === "ringing" && room.agent_id) {
        // Send push notification to assigned agent
        sendPushNotification(room.agent_id, {
          title: "Incoming Video Call",
          body: `Customer requesting call for shop ${room.shop_id}`,
          data: { roomId, type: "incoming_call" }
        }).catch((err) => console.warn("[CallStateMachine] Push notification failed:", err));
      } else if (nextState === "rejected" || nextState === "missed" || nextState === "timeout") {
        // Attempt rerouting to alternative online agent if caller is rejected or times out
        if (context.autoReroute !== false) {
          CallRouter.routeCall(room.shop_id, room.call_type || "video", {}, { excludeAgentId: room.agent_id })
            .then(async (result) => {
              if (result.success && result.agentId) {
                // Reassign call to new agent
                await supabase
                  .from("video_rooms")
                  .update({
                    agent_id: result.agentId,
                    status: "ringing",
                    updated_at: new Date().toISOString()
                  })
                  .eq("id", roomId);
              }
            })
            .catch((err) => console.warn("[CallStateMachine] Auto-reroute failed:", err));
        }
      }

      return { success: true, room: updatedRoom, state: nextState };
    } catch (err) {
      console.error("[CallStateMachine] transitionTo failed:", err);
      return { success: false, error: err.message };
    }
  }
}
