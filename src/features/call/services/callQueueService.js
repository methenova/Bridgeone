import { supabase } from "@/config/supabase";

/**
 * Call Queue Service for Managing Video Call Waiting Lines
 */
export class CallQueueService {
  /**
   * Place a visitor into the call queue.
   */
  static async addToQueue(shopId, visitorId, callType = "video", priority = 1) {
    try {
      // 1. Check if visitor is already waiting in queue
      const existing = await this.reconnectQueue(shopId, visitorId);
      if (existing) {
        return { success: true, queue: existing };
      }

      // 2. Resolve queue position (count existing waiting visitors)
      const { count, error: countErr } = await supabase
        .from("call_queues")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("status", "waiting");

      if (countErr) throw countErr;

      const position = (count || 0) + 1;
      const estimatedWait = position * 60; // 60 seconds average wait per person

      // 3. Insert queue record
      const { data: queue, error } = await supabase
        .from("call_queues")
        .insert({
          shop_id: shopId,
          visitor_id: visitorId,
          call_type: callType,
          priority,
          position,
          estimated_wait: estimatedWait,
          status: "waiting",
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Broadcast update
      this.broadcastQueueChange(shopId);

      return { success: true, queue };
    } catch (err) {
      console.error("[CallQueueService] addToQueue failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancel / abandon queue (visitor cancels call request)
   */
  static async cancelQueue(queueId) {
    try {
      const now = new Date().toISOString();
      const { data: queue, error } = await supabase
        .from("call_queues")
        .update({
          status: "abandoned",
          left_at: now,
          position: 0
        })
        .eq("id", queueId)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (queue) {
        // Resequence remaining queue
        await this.resequenceQueue(queue.shop_id);
        this.broadcastQueueChange(queue.shop_id);
      }

      return { success: true };
    } catch (err) {
      console.error("[CallQueueService] cancelQueue failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Timeout queue (caller is ejected due to no response)
   */
  static async timeoutQueue(queueId) {
    try {
      const now = new Date().toISOString();
      const { data: queue, error } = await supabase
        .from("call_queues")
        .update({
          status: "timeout",
          left_at: now,
          position: 0
        })
        .eq("id", queueId)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (queue) {
        await this.resequenceQueue(queue.shop_id);
        this.broadcastQueueChange(queue.shop_id);
      }

      return { success: true };
    } catch (err) {
      console.error("[CallQueueService] timeoutQueue failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Reconnect to recover existing queue details
   */
  static async reconnectQueue(shopId, visitorId) {
    try {
      const { data } = await supabase
        .from("call_queues")
        .select("*")
        .eq("shop_id", shopId)
        .eq("visitor_id", visitorId)
        .eq("status", "waiting")
        .maybeSingle();

      return data;
    } catch (err) {
      console.warn("[CallQueueService] reconnectQueue lookup failed:", err);
      return null;
    }
  }

  /**
   * Answer queue (Agent accepts the call from queue)
   */
  static async answerQueue(queueId, agentId) {
    try {
      const now = new Date().toISOString();
      const { data: queue, error } = await supabase
        .from("call_queues")
        .update({
          status: "answered",
          answered_at: now,
          left_at: now,
          position: 0
        })
        .eq("id", queueId)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (queue) {
        await this.resequenceQueue(queue.shop_id);
        this.broadcastQueueChange(queue.shop_id);
      }

      return { success: true, queue };
    } catch (err) {
      console.error("[CallQueueService] answerQueue failed:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Resequence waiting positions to keep queue indices contiguous
   */
  static async resequenceQueue(shopId) {
    try {
      const { error } = await supabase.rpc("resequence_queue", {
        p_shop_id: shopId
      });
      if (error) throw error;
    } catch (err) {
      console.warn("[CallQueueService] Resequencing failed:", err);
    }
  }

  /**
   * Retrieve queue statistics for the dashboard
   */
  static async getQueueStats(shopId) {
    try {
      // 1. Get current waiting queue
      const { data: waitingList } = await supabase
        .from("call_queues")
        .select("*")
        .eq("shop_id", shopId)
        .eq("status", "waiting")
        .order("joined_at", { ascending: true });

      // 2. Fetch answered stats
      const { data: answeredList } = await supabase
        .from("call_queues")
        .select("joined_at, answered_at")
        .eq("shop_id", shopId)
        .eq("status", "answered")
        .not("answered_at", "is", null);

      let totalWaitTime = 0;
      let longestWait = 0;

      (answeredList || []).forEach((q) => {
        const wait = (new Date(q.answered_at) - new Date(q.joined_at)) / 1000; // in seconds
        totalWaitTime += wait;
        if (wait > longestWait) longestWait = wait;
      });

      const avgWait = answeredList && answeredList.length > 0
        ? Math.round(totalWaitTime / answeredList.length)
        : 0;

      return {
        queueSize: waitingList?.length || 0,
        averageWait: avgWait, // in seconds
        longestWait: Math.round(longestWait), // in seconds
        currentQueue: waitingList || []
      };
    } catch (err) {
      console.error("[CallQueueService] getQueueStats failed:", err);
      return { queueSize: 0, averageWait: 0, longestWait: 0, currentQueue: [] };
    }
  }

  /**
   * Broadcast updates on Supabase channels
   */
  static broadcastQueueChange(shopId) {
    const channel = supabase.channel(`queue:${shopId}`);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "queue_updated",
          payload: { shopId }
        });
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    });
  }

  /**
   * Assign next visitor when agent becomes free
   */
  static async assignNextVisitor(shopId, agentId) {
    try {
      const { data: nextQueue } = await supabase
        .from("call_queues")
        .select("*")
        .eq("shop_id", shopId)
        .eq("status", "waiting")
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextQueue) {
        await this.answerQueue(nextQueue.id, agentId);
        return nextQueue;
      }
      return null;
    } catch (err) {
      console.warn("[CallQueueService] assignNextVisitor failed:", err);
      return null;
    }
  }
}
