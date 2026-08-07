import { describe, it, expect, vi } from "vitest";
import { observabilityService } from "../observabilityService";

describe("observabilityService", () => {
  it("should fetch observability metrics snapshot", async () => {
    const snapshot = await observabilityService.getSnapshot();
    expect(snapshot.metrics).toBeDefined();
    expect(snapshot.healthSnapshot).toBeDefined();
    expect(snapshot.alertRules).toBeDefined();
  });

  it("should evaluate incident alert rules against metrics", () => {
    const mockMetrics = {
      errorRate: 5.5, // Exceeds 2.0% threshold
      dbLatencyMs: 450, // Exceeds 300ms threshold
      edgeErrorCount: 0,
      realtimeStatus: "healthy",
    };

    const alerts = observabilityService.evaluateAlertRules(mockMetrics);
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    expect(alerts.some((a) => a.ruleId === "high_error_rate")).toBe(true);
    expect(alerts.some((a) => a.ruleId === "high_db_latency")).toBe(true);
  });

  it("should update configurable alert rule threshold", () => {
    const res = observabilityService.updateAlertRule("high_db_latency", { threshold: 500 });
    expect(res.success).toBe(true);
    expect(res.rule.threshold).toBe(500);
  });
});
