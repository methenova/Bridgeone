import { describe, it, expect } from "vitest";

describe("Job Queue Unit Tests", () => {
  it("enqueues and processes jobs in FIFO order", () => {
    const queue = [];
    queue.push("job-1");
    queue.push("job-2");

    expect(queue.shift()).toBe("job-1");
    expect(queue.shift()).toBe("job-2");
  });
});
