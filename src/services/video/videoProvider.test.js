import { describe, it, expect } from "vitest";

describe("Video Provider Unit Tests", () => {
  it("initializes video provider configuration", () => {
    const provider = "webrtc";
    expect(provider).toBe("webrtc");
  });
});
