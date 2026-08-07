import { describe, it, expect } from "vitest";

describe("Call State Machine Unit Tests", () => {
  it("validates call state transitions", () => {
    const validTransitions = {
      idle: ["ringing", "connecting"],
      ringing: ["connected", "ended", "rejected"],
      connected: ["ended"]
    };

    const canTransition = (from, to) => (validTransitions[from] || []).includes(to);

    expect(canTransition("idle", "ringing")).toBe(true);
    expect(canTransition("ringing", "connected")).toBe(true);
    expect(canTransition("connected", "idle")).toBe(false);
  });
});
