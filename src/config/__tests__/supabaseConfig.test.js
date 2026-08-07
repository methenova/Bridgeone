import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  supabase,
  triggerRegionalDbFailover,
  resetRegionalDbFailover,
  getFailoverStatus,
} from "../supabase";

describe("Supabase Client Failover Configuration Tests", () => {
  beforeEach(() => {
    resetRegionalDbFailover();
  });

  it("exports active supabase client proxy", () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });

  it("returns graceful false status when triggerRegionalDbFailover is called without VITE_SUPABASE_BACKUP_URL", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const success = triggerRegionalDbFailover();

    expect(success).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no backup database URL (VITE_SUPABASE_BACKUP_URL) is configured")
    );
    expect(getFailoverStatus().isFailoverActive).toBe(false);
    consoleWarnSpy.mockRestore();
  });

  it("resets failover state cleanly via resetRegionalDbFailover", () => {
    resetRegionalDbFailover();
    const status = getFailoverStatus();
    expect(status.isFailoverActive).toBe(false);
    expect(status.currentUrl).toBe(status.primaryUrl);
  });
});
