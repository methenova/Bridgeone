import { supabase } from "@/config/supabase";
import { activeJobQueue } from "../jobs/jobQueue";

/**
 * Production-Ready Analytics Event Engine
 * Flat append-only structure prepared for future ClickHouse migration.
 */
export class AnalyticsEngine {
  /**
   * Track an analytics event (non-blocking, dispatched via background Job Queue)
   */
  static trackEvent(shopId, visitorId, sessionId, eventType, eventData = {}) {
    if (!shopId || !eventType) return;

    const payload = {
      shopId,
      visitorId: visitorId || "anonymous",
      sessionId: sessionId || null,
      eventType,
      eventData,
      timestamp: new Date().toISOString()
    };

    // Event-driven: Dispatch event to the background job worker to prevent UI/API blockage
    activeJobQueue.add("track-analytics-event", payload, async (jobPayload) => {
      try {
        await supabase.from("analytics_raw_events").insert({
          shop_id: jobPayload.shopId,
          visitor_id: jobPayload.visitorId,
          session_id: jobPayload.sessionId,
          event_type: jobPayload.eventType,
          event_data: jobPayload.eventData,
          timestamp: jobPayload.timestamp
        });
      } catch (err) {
        console.warn("[AnalyticsEngine] Failed to write raw event to DB:", err);
      }
    });
  }

  /**
   * Database-side Aggregations (No analytics calculations performed in frontend)
   */
  static async getDashboardAggregates(shopId) {
    try {
      const { data, error } = await supabase.rpc("get_dashboard_aggregates", {
        p_shop_id: shopId
      });

      if (error) throw error;
      return data || {
        widgetLoads: 0,
        widgetOpens: 0,
        bounceRate: 0,
        callsStarted: 0,
        callsAnswered: 0,
        callsMissed: 0,
        avgCallDuration: 0,
        avgQueueTime: 0,
        avgAgentResponseTime: 0,
        messagesCount: 0,
        productsViewedCount: 0
      };
    } catch (err) {
      console.error("[AnalyticsEngine] getDashboardAggregates failed:", err);
      return {
        widgetLoads: 0,
        widgetOpens: 0,
        bounceRate: 0,
        callsStarted: 0,
        callsAnswered: 0,
        callsMissed: 0,
        avgCallDuration: 0,
        avgQueueTime: 0,
        avgAgentResponseTime: 0,
        messagesCount: 0,
        productsViewedCount: 0
      };
    }
  }
}
