import { describe, it, expect, vi } from "vitest";
import { checkLeakedPassword, validatePasswordSecurity } from "../passwordSecurity.service";

describe("Password Security & HIBP Integration Tests", () => {
  it("returns leaked: true for known compromised password 'password123'", async () => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode("password123"));
    const fullHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const suffix = fullHash.substring(5);

    const mockResponseBody = `00185A48F95F7F8971B95B11C3A5A1A5432:2\n${suffix}:4210984\nFFF1234567890ABCDEF1234567890ABCDEF:1`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockResponseBody,
    });

    const result = await checkLeakedPassword("password123");
    expect(result.leaked).toBe(true);
    expect(result.count).toBe(4210984);
  });

  it("returns leaked: false for safe unique password", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "00000000000000000000000000000000000:1\n",
    });

    const result = await checkLeakedPassword("x9$mP!kQ#8vLz@2WqP0n");
    expect(result.leaked).toBe(false);
    expect(result.count).toBe(0);
  });

  it("throws security error when validatePasswordSecurity encounters a leaked password", async () => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode("password123"));
    const fullHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const suffix = fullHash.substring(5);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `${suffix}:100\n`,
    });

    await expect(validatePasswordSecurity("password123")).rejects.toThrow(
      /Security Alert: This password has appeared in known data breaches/
    );
  });
});
