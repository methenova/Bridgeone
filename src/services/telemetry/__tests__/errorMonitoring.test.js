import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorMonitoringService } from "../errorMonitoring.service";

describe("errorMonitoringService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize error monitoring listeners", () => {
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorMonitoringService.init();
    expect(errorMonitoringService.isInitialized).toBe(true);
  });

  it("should bind user context securely", () => {
    errorMonitoringService.setUserContext("user_12345", "shop_999");
    expect(errorMonitoringService.userId).toBe("user_12345");
    expect(errorMonitoringService.shopId).toBe("shop_999");
  });

  it("should capture and enrich exception events", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    errorMonitoringService.setUserContext("user_abc", "shop_xyz");

    const sampleError = new Error("Test application exception");
    const event = errorMonitoringService.captureException(sampleError, { feature: "video_call" });

    expect(consoleSpy).toHaveBeenCalled();
    expect(event).toBeDefined();
    expect(event.error.message).toBe("Test application exception");
    expect(event.user.id).toBe("user_abc");
    expect(event.user.shopId).toBe("shop_xyz");
    expect(event.context.feature).toBe("video_call");
    expect(event.environment).toBeDefined();
    expect(event.appVersion).toBeDefined();
    expect(event.browser).toBeDefined();
  });

  it("should capture React ErrorBoundary exceptions", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sampleError = new Error("React render crash");
    const errorInfo = { componentStack: "    in ComponentA\n    in App" };

    const event = errorMonitoringService.captureReactError(sampleError, errorInfo);

    expect(consoleSpy).toHaveBeenCalled();
    expect(event.error.message).toBe("React render crash");
    expect(event.context.source).toBe("ErrorBoundary");
    expect(event.context.componentStack).toContain("ComponentA");
  });
});
