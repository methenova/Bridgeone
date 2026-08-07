/**
 * Production-Grade Error Monitoring Service (Sentry / LogRocket Compatible Integration)
 * Captures unhandled JavaScript errors, React ErrorBoundary exceptions, and unhandled promise rejections.
 * Enriches error events with environment metadata, route, release, browser details, and safe user context.
 */

class ErrorMonitoringService {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.shopId = null;
    this.isProduction = import.meta.env.PROD || import.meta.env.MODE === "production";
    this.appVersion = import.meta.env.VITE_APP_VERSION || "0.0.0";
    this.release = import.meta.env.VITE_RELEASE || "bridgeone@0.0.0";
    this.sentryDsn = import.meta.env.VITE_SENTRY_DSN || null;
    this.logRocketId = import.meta.env.VITE_LOGROCKET_ID || null;
  }

  /**
   * Initialize global error listeners (Environment-aware: active in production or when DSN configured)
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window === "undefined") return;

    // 1. Unhandled JavaScript Runtime Errors
    window.addEventListener("error", (event) => {
      this.captureException(event.error || new Error(event.message), {
        source: "window.onerror",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // 2. Unhandled Promise Rejections
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const errorInstance = reason instanceof Error ? reason : new Error(String(reason || "Unhandled Promise Rejection"));
      this.captureException(errorInstance, {
        source: "unhandledrejection",
        rawReason: typeof reason === "object" ? JSON.stringify(reason) : String(reason),
      });
    });

    // 3. Optional Sentry SDK / LogRocket dynamic SDK binding if loaded on window
    if (this.isProduction) {
      if (window.Sentry && this.sentryDsn) {
        window.Sentry.init({
          dsn: this.sentryDsn,
          release: this.release,
          environment: import.meta.env.MODE,
        });
      }
      if (window.LogRocket && this.logRocketId) {
        window.LogRocket.init(this.logRocketId);
      }
      console.info(`[ErrorMonitoring] Initialized production error telemetry (v${this.appVersion})`);
    } else {
      console.info("[ErrorMonitoring] Non-production environment detected. Exception monitoring active in local dev mode.");
    }
  }

  /**
   * Bind authenticated user context securely (avoiding PII like raw passwords or credit card numbers)
   */
  setUserContext(userId, shopId = null) {
    this.userId = userId;
    this.shopId = shopId;

    if (typeof window !== "undefined") {
      if (window.Sentry?.setUser) {
        window.Sentry.setUser({ id: userId });
      }
      if (window.LogRocket?.identify && userId) {
        window.LogRocket.identify(userId);
      }
    }
  }

  /**
   * Capture React ErrorBoundary Exceptions
   */
  captureReactError(error, errorInfo = {}) {
    return this.captureException(error, {
      source: "ErrorBoundary",
      componentStack: errorInfo.componentStack,
    });
  }

  /**
   * Core exception capturing & enrichment pipeline
   */
  captureException(error, customContext = {}) {
    if (!error) return;

    const enrichedEvent = {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || "development",
      appVersion: this.appVersion,
      release: this.release,
      error: {
        name: error.name || "Error",
        message: error.message || String(error),
        stack: error.stack || null,
      },
      user: {
        id: this.userId || "anonymous",
        shopId: this.shopId || null,
      },
      location: typeof window !== "undefined" ? {
        pathname: window.location.pathname,
        search: window.location.search,
        href: window.location.href,
      } : {},
      browser: typeof window !== "undefined" ? {
        userAgent: window.navigator.userAgent,
        language: window.navigator.language,
        online: window.navigator.onLine,
        screenWidth: window.screen?.width,
        screenHeight: window.screen?.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      } : {},
      context: customContext,
    };

    // Log structured event to console (production-safe error format)
    console.error("[ProductionErrorCaptured]", enrichedEvent);

    // Forward to Sentry window SDK if available
    if (typeof window !== "undefined" && window.Sentry?.captureException) {
      window.Sentry.captureException(error, {
        extra: enrichedEvent,
      });
    }

    // Forward to LogRocket window SDK if available
    if (typeof window !== "undefined" && window.LogRocket?.captureException) {
      window.LogRocket.captureException(error, {
        extra: enrichedEvent,
      });
    }

    return enrichedEvent;
  }
}

export const errorMonitoringService = new ErrorMonitoringService();
