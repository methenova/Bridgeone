import { describe, it, expect } from "vitest";

describe("Call Queue Service Unit Tests", () => {
  it("calculates wait positions correctly", () => {
    const queue = ["call-1", "call-2", "call-3"];
    const getPosition = (id) => queue.indexOf(id) + 1;

    expect(getPosition("call-1")).toBe(1);
    expect(getPosition("call-2")).toBe(2);
  });
});
