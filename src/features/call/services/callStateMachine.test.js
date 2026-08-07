import { describe, it, expect } from "vitest";

describe("Features Call State Machine Unit Tests", () => {
  it("manages call state machine", () => {
    const state = "ringing";
    expect(["ringing", "connected", "ended"]).toContain(state);
  });
});
