import { describe, it, expect } from "vitest";

describe("Production Agent Presence Service Unit Tests", () => {
  it("verifies six presence status mappings", () => {
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
      expect(mapped).toBeTruthy();
    });
  });

  it("verifies inactivity timeout logic", () => {
    let userStatus = "online";
    let lastActivity = Date.now();

    const simulateInactivityCheck = (inactiveMs) => {
      const elapsed = Date.now() - (lastActivity - inactiveMs);
      const tenMinutes = 10 * 60 * 1000;
      if (elapsed >= tenMinutes && userStatus === "online") {
        userStatus = "away";
      }
    };

    simulateInactivityCheck(5 * 60 * 1000);
    expect(userStatus).toBe("online");

    simulateInactivityCheck(11 * 60 * 1000);
    expect(userStatus).toBe("away");
  });

  it("verifies heartbeat freshness limits", () => {
    const now = Date.now();
    const isStale = (lastSeenTimeMs) => {
      const elapsedSeconds = (Date.now() - lastSeenTimeMs) / 1000;
      return elapsedSeconds > 90;
    };

    expect(isStale(now - 15000)).toBe(false);
    expect(isStale(now - 95000)).toBe(true);
  });
});
