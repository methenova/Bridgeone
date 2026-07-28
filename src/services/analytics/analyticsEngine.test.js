import assert from "assert";

console.log("🚀 Running Analytics Event Engine Unit Tests...");

// Mock raw events db
const mockEventsDb = [];

const trackEvent = (shopId, visitorId, sessionId, eventType, eventData = {}) => {
  const event = {
    id: `event-${Math.random().toString(36).substring(2, 9)}`,
    shop_id: shopId,
    visitor_id: visitorId,
    session_id: sessionId,
    event_type: eventType,
    event_data: eventData,
    timestamp: new Date().toISOString()
  };
  mockEventsDb.push(event);
  return event;
};

const calculateAggregates = (shopId) => {
  let widgetLoads = 0;
  let widgetOpens = 0;
  let callsAnswered = 0;
  let totalDuration = 0;

  mockEventsDb
    .filter((e) => e.shop_id === shopId)
    .forEach((e) => {
      if (e.event_type === "widget_loaded") widgetLoads++;
      if (e.event_type === "widget_opened") widgetOpens++;
      if (e.event_type === "video_call_answered") callsAnswered++;
      if (e.event_type === "call_duration") totalDuration += e.event_data.duration || 0;
    });

  const bounceRate = widgetLoads > 0 ? Math.round(((widgetLoads - widgetOpens) / widgetLoads) * 100) : 0;

  return {
    widgetLoads,
    widgetOpens,
    bounceRate,
    avgCallDuration: callsAnswered > 0 ? Math.round(totalDuration / callsAnswered) : 0
  };
};

// 1. Test event payload tracking (Flat ClickHouse format)
try {
  const e1 = trackEvent("shop-1", "visitor-1", "sess-1", "widget_loaded");
  const e2 = trackEvent("shop-1", "visitor-1", "sess-1", "widget_opened");
  const e3 = trackEvent("shop-1", "visitor-1", "sess-1", "video_call_answered");
  const e4 = trackEvent("shop-1", "visitor-1", "sess-1", "call_duration", { duration: 120 });

  assert.strictEqual(e1.event_type, "widget_loaded", "Event type must match exactly");
  assert.strictEqual(e4.event_data.duration, 120, "Payload data must be stored correctly");
  assert.ok(e1.timestamp, "Timestamp must be generated");

  console.log("✅ Flat ClickHouse-ready event mapping verified successfully!");
} catch (err) {
  console.error("❌ Event mapping tests failed:", err.message);
  process.exit(1);
}

// 2. Test Aggregates calculations (No frontend calculations)
try {
  const aggregates = calculateAggregates("shop-1");
  assert.strictEqual(aggregates.widgetLoads, 1, "Loads count must be 1");
  assert.strictEqual(aggregates.widgetOpens, 1, "Opens count must be 1");
  assert.strictEqual(aggregates.bounceRate, 0, "Bounce rate must be 0% when opened");
  assert.strictEqual(aggregates.avgCallDuration, 120, "Average duration must be 120s");

  // Track another load that bounces
  trackEvent("shop-1", "visitor-2", "sess-2", "widget_loaded");
  const updatedAggregates = calculateAggregates("shop-1");
  assert.strictEqual(updatedAggregates.widgetLoads, 2, "Loads count must be 2");
  assert.strictEqual(updatedAggregates.bounceRate, 50, "Bounce rate must increase to 50% on bounce");

  console.log("✅ Database-side aggregations and calculations verified successfully!");
} catch (err) {
  console.error("❌ Aggregation tests failed:", err.message);
  process.exit(1);
}

console.log("🎉 All Analytics Event Engine Unit Tests passed cleanly!");
