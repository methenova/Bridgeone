import { supabase } from "../../config/supabase";
import { CallRouter } from "../routing/callRouter";
import { sendPushNotification } from "../notification/notification.service";

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

      // 2. Perform DB transition update
      const { error: updateErr } = await supabase
        .from("video_rooms")
        .update({
          status: nextState,
          updated_at: new Date().toISOString()
        })
        .eq("id", roomId);

      if (updateErr) throw updateErr;

      console.info(`[CallStateMachine] Room ${roomId} transitioned: ${currentState} -> ${nextState} via action: ${action}`);

      // 3. Handle Side-Effects (Reject / Timeout / Accept)
      await this.handleSideEffects(room, action, nextState, context);

      return { success: true, newState: nextState };

    } catch (err) {
      console.error("[CallStateMachine] Transition failed:", err);
      return { success: false, reason: "internal_error", error: err.message };
    }
  }

  /**
   * Side-effects processor
   */
  static async handleSideEffects(room, action, nextState, context) {
    const { shop_id: shopId, visitor_id: visitorId, agent_id: currentAgentId } = room;

    // 1. Reject -> Notify Customer
    if (nextState === "rejected" || nextState === "busy") {
      console.info(`[CallStateMachine] Call rejected/busy by agent. Notifying visitor ${visitorId}`);
      // Notify customer (e.g. via realtime database channel or postMessage status)
      await supabase.channel(`call-status-${room.id}`).subscribe((status) => {
        if (status === "SUBSCRIBED") {
          supabase.channel(`call-status-${room.id}`).send({
            type: "broadcast",
            event: "call_status_updated",
            payload: { status: nextState }
          });
        }
      });
    }

    // 2. Timeout -> Send to next available agent
    else if (nextState === "timeout") {
      console.info(`[CallStateMachine] Call timed out. Rerouting to next agent...`);
      
      // Invoke Call Router to find next agent (ignoring the agent who timed out)
      const routeResult = await CallRouter.routeCall(
        shopId,
        "video",
        { id: visitorId },
        { 
          strategy: "round-robin",
          excludeAgentId: currentAgentId // Custom routing engine option to exclude the failed agent
        }
      );

      if (routeResult.success && routeResult.agentId) {
        console.info(`[CallStateMachine] Rerouted call ${room.id} to new agent: ${routeResult.agentId}`);

        // Update video_room to target the new agent and reset status to ringing
        await supabase
          .from("video_rooms")
          .update({
            agent_id: routeResult.agentId,
            status: "ringing",
            updated_at: new Date().toISOString()
          })
          .eq("id", room.id);

        // Send Push Notification to new agent
        await sendPushNotification(
          routeResult.agentId,
          "Incoming Call (Rerouted)",
          "A customer is waiting. Tap to answer.",
          {
            type: "incoming_video_call",
            roomId: room.id,
            roomKey: room.room_code
          }
        );
      } else {
        // No other agent available: transition room to failed/missed
        console.warn("[CallStateMachine] No other agent available after timeout");
        await supabase
          .from("video_rooms")
          .update({ status: "missed" })
          .eq("id", room.id);
      }
    }

    // 3. Accept -> Update call loganswered timestamp
    else if (nextState === "connected") {
      console.info(`[CallStateMachine] Call answered. Connected room ${room.id}`);
      // Update answering timestamp in call_logs table
      await supabase
        .from("call_logs")
        .update({
          status: "connected",
          answered_at: new Date().toISOString()
        })
        .eq("room_id", room.id);
    }
  }
}
