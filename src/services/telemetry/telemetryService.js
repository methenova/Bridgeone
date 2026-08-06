import { callTelemetry } from "../video/callTelemetry";

/**
 * Centralized TelemetryService
 * Captures WebRTC failures, ICE state drops, media permission blocks,
 * Supabase/DB errors, API failures, and unhandled runtime exceptions.
 * Features structured JSON logging and an in-memory diagnostic buffer.
 */
class TelemetryService {
  constructor() {
    this.buffer = [];
    this.maxBufferSize = 100;
    this.userId = null;
    this.shopId = null;
    this.isInitialized = false;
  }

  /**
   * Initialize global error listeners for uncaught runtime exceptions & unhandled promise rejections.
   */
  init(userId = null, shopId = null) {
    if (this.isInitialized) return;
    this.userId = userId;
    this.shopId = shopId;
    this.isInitialized = true;

    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.logError("runtime", event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        this.logError("runtime", "Unhandled Promise Rejection", {
          reason: typeof reason === "object" ? reason?.message || String(reason) : String(reason),
          stack: reason?.stack,
        });
      });
    }

    console.log("[TelemetryService] Global diagnostics initialized.");
  }

  setUserContext(userId, shopId) {
    this.userId = userId;
    this.shopId = shopId;
  }

  /**
   * Log structured error event
   */
  logError(category, message, metadata = {}) {
    const logEvent = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      category, // 'webrtc' | 'media_permission' | 'supabase' | 'api' | 'runtime'
      message,
      userId: this.userId,
      shopId: this.shopId,
      metadata,
    };

    this._addToBuffer(logEvent);
    console.error(`[Telemetry::${category.toUpperCase()}]`, message, metadata);

    // Also forward WebRTC events to callTelemetry if applicable
    if (category === "webrtc" && metadata.sessionId) {
      callTelemetry.recordIceState(metadata.sessionId, metadata.iceState || "failed");
    }
  }

  /**
   * Log structured warning event
   */
  logWarning(category, message, metadata = {}) {
    const logEvent = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      category,
      message,
      userId: this.userId,
      shopId: this.shopId,
      metadata,
    };

    this._addToBuffer(logEvent);
    console.warn(`[Telemetry::${category.toUpperCase()}]`, message, metadata);
  }

  /**
   * Log structured info event
   */
  logInfo(category, message, metadata = {}) {
    const logEvent = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      category,
      message,
      userId: this.userId,
      shopId: this.shopId,
      metadata,
    };

    this._addToBuffer(logEvent);
    console.log(`[Telemetry::${category.toUpperCase()}]`, message, metadata);
  }

  /**
   * Capture WebRTC peer connection failures or ICE state degradations
   */
  captureWebRTCError(peerRole, roomId, error, iceState = null) {
    this.logError("webrtc", `WebRTC error in ${peerRole} session: ${error?.message || error}`, {
      peerRole,
      sessionId: roomId,
      iceState,
      stack: error?.stack,
    });
  }

  /**
   * Capture Media devices / getUserMedia permissions failures
   */
  captureMediaError(error, constraints = {}) {
    this.logError("media_permission", `Media Device Access Error: ${error?.name || "UnknownError"}`, {
      errorName: error?.name,
      errorMessage: error?.message,
      constraints,
      isHttps: typeof location !== "undefined" ? location.protocol === "https:" : false,
    });
  }

  /**
   * Capture Supabase DB / RLS / Auth query errors
   */
  captureSupabaseError(action, error, queryParams = {}) {
    this.logError("supabase", `Supabase operation failed: ${action}`, {
      action,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      queryParams,
    });
  }

  /**
   * Capture HTTP API / Edge Function failures
   */
  captureApiError(endpoint, status, responseData = {}) {
    this.logError("api", `API Request Failed: ${endpoint} (Status: ${status})`, {
      endpoint,
      status,
      responseData,
    });
  }

  _addToBuffer(event) {
    this.buffer.push(event);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  /**
   * Get in-memory diagnostic logs
   */
  getLogs() {
    return [...this.buffer];
  }

  /**
   * Export diagnostic logs as a JSON string for debugging or DevTools download
   */
  exportLogs() {
    return JSON.stringify(this.buffer, null, 2);
  }
}

export const telemetryService = new TelemetryService();
