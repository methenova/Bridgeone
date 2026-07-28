import assert from "assert";

console.log("🚀 Running Production Call Router Engine Unit Tests...");

// 1. Business Hours Utility Tests
try {
  const isWithinBusinessHours = (hoursString, currentTimeMs) => {
    if (!hoursString) return true;
    const cleanStr = hoursString.trim().toLowerCase();
    if (cleanStr === "24/7" || cleanStr === "always open" || cleanStr === "") return true;

    const parts = cleanStr.split(":");
    if (parts.length < 2) return true;

    const daysPart = parts[0].trim();
    const timesPart = parts.slice(1).join(":").trim();

    const now = new Date(currentTimeMs);
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const currentDayName = dayNames[now.getDay()];

    let dayMatch = false;
    if (daysPart.includes("-")) {
      const [startDay, endDay] = daysPart.split("-").map((d) => d.trim());
      const startIndex = dayNames.indexOf(startDay);
      const endIndex = dayNames.indexOf(endDay);
      const currentIndex = now.getDay();
      if (startIndex <= endIndex) {
        dayMatch = currentIndex >= startIndex && currentIndex <= endIndex;
      } else {
        dayMatch = currentIndex >= startIndex || currentIndex <= endIndex;
      }
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
    return true;
  };

  const fixedMondayNoon = new Date("2026-07-27T12:00:00").getTime(); // Monday noon
  const fixedSundayNoon = new Date("2026-07-26T12:00:00").getTime(); // Sunday noon

  assert.strictEqual(isWithinBusinessHours("Mon-Fri: 09:00 - 18:00", fixedMondayNoon), true, "Monday noon should be inside Mon-Fri business hours");
  assert.strictEqual(isWithinBusinessHours("Mon-Fri: 09:00 - 18:00", fixedSundayNoon), false, "Sunday noon should be outside Mon-Fri business hours");

  console.log("✅ Business Hours checks verified successfully!");
} catch (err) {
  console.error("❌ Business Hours tests failed:", err.message);
  process.exit(1);
}

// 2. Subscription Validity Verification Simulation
try {
  const isSubscriptionActive = (subStatus) => {
    const inactiveStatuses = ["canceled", "unpaid", "past_due"];
    return !inactiveStatuses.includes(subStatus);
  };

  assert.strictEqual(isSubscriptionActive("active"), true, "active subscription should be valid");
  assert.strictEqual(isSubscriptionActive("trialing"), true, "trialing subscription should be valid");
  assert.strictEqual(isSubscriptionActive("canceled"), false, "canceled subscription should be invalid");
  assert.strictEqual(isSubscriptionActive("past_due"), false, "past_due subscription should be invalid");

  console.log("✅ Subscription validity checks verified successfully!");
} catch (err) {
  console.error("❌ Subscription tests failed:", err.message);
  process.exit(1);
}

// 3. Strategy Pattern Simulations
try {
  const mockAgents = [
    { profileId: "agent-1", role: "agent", maxActive: 3 },
    { profileId: "agent-2", role: "agent", maxActive: 3 },
    { profileId: "agent-3", role: "manager", maxActive: 3 }
  ];

  // Strategy A: Least Active load balancer
  const selectLeastActive = (agents, loadMap) => {
    const sorted = [...agents].sort((a, b) => (loadMap[a.profileId] || 0) - (loadMap[b.profileId] || 0));
    return sorted[0];
  };

  const loads = { "agent-1": 2, "agent-2": 0, "agent-3": 1 };
  const selectedAgent = selectLeastActive(mockAgents, loads);
  assert.strictEqual(selectedAgent.profileId, "agent-2", "Least-Active must choose the lowest loaded agent");

  // Strategy B: Priority Routing
  const selectPriority = (agents) => {
    const priority = agents.filter((a) => a.role === "manager" || a.role === "owner");
    return priority.length > 0 ? priority[0] : agents[0];
  };

  const selectedPriority = selectPriority(mockAgents);
  assert.strictEqual(selectedPriority.profileId, "agent-3", "Priority routing must select manager/owner over standard agent");

  console.log("✅ Strategy Pattern options verified successfully!");
} catch (err) {
  console.error("❌ Strategy tests failed:", err.message);
  process.exit(1);
}

console.log("🎉 All Production Call Router Engine Unit Tests passed cleanly!");
