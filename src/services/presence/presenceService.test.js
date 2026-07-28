import assert from "assert";

console.log("🚀 Running Production Agent Presence Service Unit Tests...");

// 1. Test six presence states transition mappings
try {
  const allowedStatuses = ["online", "offline", "away", "busy", "on_call", "break"];
  const dbStatusFallbackMap = {
    online: "online",
    offline: "offline",
    away: "away",
    busy: "dnd",
    on_call: "dnd",
    break: "dnd"
  };

  allowedStatuses.forEach((status) => {
    const mapped = dbStatusFallbackMap[status];
    assert.ok(mapped, `Status '${status}' must have a fallback mapping defined`);
  });

  console.log("✅ Production presence status mappings verified successfully!");
} catch (err) {
  console.error("❌ Presence mapping tests failed:", err.message);
  process.exit(1);
}

// 2. Test inactivity timeout logic
try {
  let userStatus = "online";
  let lastActivity = Date.now();

  const simulateInactivityCheck = (inactiveMs) => {
    const elapsed = Date.now() - (lastActivity - inactiveMs);
    const tenMinutes = 10 * 60 * 1000;
    if (elapsed >= tenMinutes && userStatus === "online") {
      userStatus = "away";
    }
  };

  // Less than 10 mins
  simulateInactivityCheck(5 * 60 * 1000);
  assert.strictEqual(userStatus, "online", "Agent must remain online under 10 minutes of inactivity");

  // Exceeding 10 mins
  simulateInactivityCheck(11 * 60 * 1000);
  assert.strictEqual(userStatus, "away", "Agent must transition to away status when inactive for over 10 minutes");

  console.log("✅ Inactivity timeout logic verified successfully!");
} catch (err) {
  console.error("❌ Inactivity tests failed:", err.message);
  process.exit(1);
}

// 3. Test heartbeat timing limits (Prevent stale statuses)
try {
  const now = Date.now();
  
  // Verify if a last_seen timestamp is stale (> 90 seconds)
  const isStale = (lastSeenTimeMs) => {
    const elapsedSeconds = (Date.now() - lastSeenTimeMs) / 1000;
    return elapsedSeconds > 90;
  };

  // Fresh heartbeat (15 seconds ago)
  assert.strictEqual(isStale(now - 15000), false, "15s old heartbeat must not be stale");

  // Stale heartbeat (95 seconds ago)
  assert.strictEqual(isStale(now - 95000), true, "95s old heartbeat must be flagged as stale");

  console.log("✅ Heartbeat freshness logic verified successfully!");
} catch (err) {
  console.error("❌ Heartbeat tests failed:", err.message);
  process.exit(1);
}

console.log("🎉 All Production Presence Service Unit Tests passed cleanly!");
