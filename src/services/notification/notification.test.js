import { describe, it, expect } from "vitest";

describe("Notification Service Unit Tests", () => {
  it("formats notification payload correctly", () => {
    const formatNotif = (title, body) => ({
      title,
      body,
      is_read: false,
      created_at: new Date().toISOString()
    });

    const notif = formatNotif("Incoming Call", "Customer is waiting");
    expect(notif.title).toBe("Incoming Call");
    expect(notif.is_read).toBe(false);
  });
});
