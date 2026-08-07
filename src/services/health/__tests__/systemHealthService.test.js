import { describe, it, expect, vi } from "vitest";
import { SystemHealthService } from "../systemHealthService";

describe("SystemHealthService", () => {
  it("should run database health check probe", async () => {
    const result = await SystemHealthService.checkDatabase();
    expect(result.name).toContain("Database");
    expect(result.status).toBeDefined();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should run Edge Functions health check probe", async () => {
    const result = await SystemHealthService.checkEdgeFunctions();
    expect(result.name).toContain("Edge Functions");
    expect(result.status).toBeDefined();
  });

  it("should run storage health check probe", async () => {
    const result = await SystemHealthService.checkStorage();
    expect(result.name).toContain("Object Storage");
    expect(result.status).toBeDefined();
  });

  it("should run realtime connectivity probe", async () => {
    const result = await SystemHealthService.checkRealtime();
    expect(result.name).toContain("Realtime Engine");
    expect(result.status).toBe("healthy");
  });

  it("should run Stripe billing integration probe", async () => {
    const result = await SystemHealthService.checkStripe();
    expect(result.name).toContain("Stripe Billing");
    expect(result.status).toBeDefined();
  });

  it("should run notification services probe", async () => {
    const result = await SystemHealthService.checkNotificationServices();
    expect(result.name).toContain("Notification Services");
    expect(result.status).toBeDefined();
  });

  it("should run comprehensive health check suite", async () => {
    const fullReport = await SystemHealthService.checkAllServices();
    expect(fullReport.timestamp).toBeDefined();
    expect(fullReport.overallStatus).toBeDefined();
    expect(fullReport.services.database).toBeDefined();
    expect(fullReport.services.edgeFunctions).toBeDefined();
    expect(fullReport.services.storage).toBeDefined();
    expect(fullReport.services.realtime).toBeDefined();
    expect(fullReport.services.stripe).toBeDefined();
    expect(fullReport.services.notifications).toBeDefined();
  });
});
