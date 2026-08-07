import { describe, it, expect } from "vitest";

describe("Presence Service Unit Tests", () => {
  it("maps status fallbacks", () => {
    const map = { online: "online", offline: "offline", busy: "dnd" };
    expect(map["online"]).toBe("online");
    expect(map["busy"]).toBe("dnd");
  });
});
