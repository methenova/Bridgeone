/**
 * CallTelemetry — Structured in-process telemetry for WebRTC call sessions.
 *
 * Tracks ICE state transitions, restart attempts, PeerConnection recreations,
 * and recovery outcomes per session. All events are emitted as structured
 * JSON log lines to the browser console under the "[Telemetry]" prefix,
 * making them easy to grep in production DevTools or log shipping agents.
 *
 * Zero dependencies. Zero database writes. Zero side effects.
 *
 * Usage:
 *   import { callTelemetry } from './callTelemetry';
 *   callTelemetry.startSession('seller', roomId);
 *   callTelemetry.recordIceState(roomId, 'connected');
 *   callTelemetry.recordIceRestart(roomId, 1);
 *   callTelemetry.recordRecreation(roomId, true);
 *   callTelemetry.endSession(roomId);
 */

class CallTelemetry {
  constructor() {
    /** @type {Map<string, object>} */
    this._sessions = new Map();
  }

  // ─── Session lifecycle ──────────────────────────────────────────────────────

  /**
   * Begin a new telemetry session for a call participant.
   * @param {'seller'|'viewer'} role
   * @param {string} sessionId  — typically the roomId
   * @param {string} [callId]  — unique identifier for this specific connection attempt
   */
  startSession(role, sessionId, callId = null) {
    if (this._sessions.has(sessionId)) return; // idempotent

    const record = {
      role,
      sessionId,
      callId: callId || "unknown",
      startedAt: Date.now(),
      endedAt: null,
      iceStateHistory: [],      // [{state, ts}]
      iceRestarts: 0,
      recreations: 0,
      recreationSuccesses: 0,
      lastRecoveryMs: null,
      _recoveryStartTs: null,
      adaptationHistory: [],    // [{ts, previousProfile, newProfile, metrics...}]
      codecs: [],
      localCandidateType: "unknown",
      remoteCandidateType: "unknown",
      turnUsage: false
    };

    this._sessions.set(sessionId, record);
    this._emit("session_start", record, { role, sessionId, callId: record.callId });
  }

  /**
   * Update the current active Call ID for a session.
   * Called during PeerConnection recreation or ICE restarts.
   * @param {string} sessionId
   * @param {string} callId
   */
  updateCallId(sessionId, callId) {
    const record = this._sessions.get(sessionId);
    if (!record) return;

    record.callId = callId;
    this._emit("call_id_update", record, { callId });
  }

  /**
   * Mark the session as ended and emit a summary.
   * @param {string} sessionId
   */
  endSession(sessionId) {
    const record = this._sessions.get(sessionId);
    if (!record || record.endedAt) return;

    record.endedAt = Date.now();
    const durationSec = ((record.endedAt - record.startedAt) / 1000).toFixed(1);

    this._emit("session_end", record, {
      durationSec,
      totalIceRestarts: record.iceRestarts,
      totalRecreations: record.recreations,
      recreationSuccesses: record.recreationSuccesses,
      iceStateHistory: record.iceStateHistory,
    });

    this._sessions.delete(sessionId);
  }

  // ─── ICE events ─────────────────────────────────────────────────────────────

  /**
   * Record a raw ICE connection state change.
   * @param {string} sessionId
   * @param {RTCIceConnectionState} state
   */
  recordIceState(sessionId, state) {
    const record = this._sessions.get(sessionId);
    if (!record) return;

    const entry = { state, ts: Date.now() };

    // ML-2 FIX: Bound iceStateHistory to prevent unbounded growth on long calls.
    // On unstable mobile connections, hundreds of state transitions can occur over
    // 24 hours. Cap at 200 entries, keeping the most recent 100 when trimming.
    if (record.iceStateHistory.length >= 200) {
      record.iceStateHistory = record.iceStateHistory.slice(-100);
    }
    record.iceStateHistory.push(entry);

    // Track when recovery begins (disconnected/failed → used to measure RTR)
    if (state === "disconnected" || state === "failed") {
      if (!record._recoveryStartTs) {
        record._recoveryStartTs = entry.ts;
      }
    }

    // Track when recovery completes (connected/completed after a failure)
    if ((state === "connected" || state === "completed") && record._recoveryStartTs) {
      record.lastRecoveryMs = entry.ts - record._recoveryStartTs;
      record._recoveryStartTs = null;
      this._emit("recovery_success", record, {
        state,
        recoveryMs: record.lastRecoveryMs,
      });
    }

    this._emit("ice_state", record, { state });
  }

  /**
   * Record an ICE restart attempt.
   * @param {string} sessionId
   * @param {number} attemptNumber  — 1-based
   */
  recordIceRestart(sessionId, attemptNumber) {
    const record = this._sessions.get(sessionId);
    if (!record) return;

    record.iceRestarts++;
    this._emit("ice_restart", record, { attemptNumber, totalRestarts: record.iceRestarts });
  }

  /**
   * Record a PeerConnection recreation attempt and its outcome.
   * @param {string} sessionId
   * @param {boolean} success
   * @param {string} [reason]  — optional reason string for failure
   */
  recordRecreation(sessionId, success, reason = null) {
    const record = this._sessions.get(sessionId);
    if (!record) return;

    record.recreations++;
    if (success) record.recreationSuccesses++;

    this._emit("pc_recreation", record, {
      attempt: record.recreations,
      success,
      ...(reason ? { reason } : {}),
    });
  }

  // ─── Snapshot ───────────────────────────────────────────────────────────────

  /**
   * Returns a read-only snapshot of the current session stats.
   * Useful for in-app diagnostics panels.
   * @param {string} sessionId
   * @returns {object|null}
   */
  snapshot(sessionId) {
    const record = this._sessions.get(sessionId);
    if (!record) return null;
    return {
      role: record.role,
      sessionId: record.sessionId,
      uptimeSec: ((Date.now() - record.startedAt) / 1000).toFixed(1),
      iceRestarts: record.iceRestarts,
      recreations: record.recreations,
      recreationSuccesses: record.recreationSuccesses,
      lastRecoveryMs: record.lastRecoveryMs,
      lastIceState: record.iceStateHistory.at(-1)?.state ?? "unknown",
    };
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  /** @private */
  _emit(event, record, payload) {
    const line = {
      ts: new Date().toISOString(),
      event,
      role: record.role,
      sessionId: record.sessionId,
      callId: record.callId || "unknown",
      ...payload,
    };
    // Structured JSON line — easily shipped by a browser log agent
    console.log(`[Telemetry] ${JSON.stringify(line)}`);
  }

  /**
   * Record a quality adaptation event.
   * @param {string} sessionId
   * @param {object} details
   */
  recordQualityAdaptation(sessionId, details) {
    const record = this._sessions.get(sessionId);
    if (!record) return;

    const eventPayload = {
      previousProfile: details.previousProfile,
      newProfile: details.newProfile,
      bitrateKbps: details.bitrateKbps,
      rttMs: details.rttMs,
      packetLossPercent: details.packetLossPercent,
      jitterMs: details.jitterMs,
      frameRate: details.frameRate,
      browser: details.browser,
      os: details.os
    };

    // Store in history
    record.adaptationHistory.push({
      ts: Date.now(),
      ...eventPayload
    });

    this._emit("quality_adaptation", record, eventPayload);
  }

  /**
   * Records active call channel metadata (codecs, ICE candidate types, TURN usage).
   * @param {string} sessionId
   * @param {object} metadata
   */
  recordMetadata(sessionId, metadata) {
    const record = this._sessions.get(sessionId);
    if (!record) return;

    if (metadata.codecs) {
      // Ensure unique list of codecs
      record.codecs = Array.from(new Set([...record.codecs, ...metadata.codecs]));
    }
    if (metadata.localCandidateType) {
      record.localCandidateType = metadata.localCandidateType;
    }
    if (metadata.remoteCandidateType) {
      record.remoteCandidateType = metadata.remoteCandidateType;
    }
    if (metadata.turnUsage !== undefined) {
      record.turnUsage = record.turnUsage || metadata.turnUsage; // remains true once TURN is used
    }
  }

  /**
   * Generates a complete structured diagnostics report for the session.
   * Useful for troubleshooting call qualities or client performance issues.
   * @param {string} sessionId
   * @returns {object|null} The diagnostic report JSON
   */
  generateDiagnosticsReport(sessionId) {
    const record = this._sessions.get(sessionId);
    if (!record) return null;

    const ua = navigator.userAgent;
    const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" :
               /Android/.test(ua) ? "Android" :
               /Windows/.test(ua) ? "Windows" :
               /Macintosh/.test(ua) ? "macOS" :
               /Linux/.test(ua) ? "Linux" : "Unknown OS";

    const browser = /Firefox/.test(ua) ? "Firefox" :
                    /Edg/.test(ua) ? "Edge" :
                    /Chrome/.test(ua) ? "Chrome" :
                    /Safari/.test(ua) ? "Safari" : "Unknown Browser";

    return {
      sessionId: record.sessionId,
      role: record.role,
      browser,
      os,
      connectionUptimeMs: Date.now() - record.startedAt,
      codecs: record.codecs,
      localCandidateType: record.localCandidateType,
      remoteCandidateType: record.remoteCandidateType,
      turnUsage: record.turnUsage,
      recoveryStats: {
        iceRestarts: record.iceRestarts,
        recreations: record.recreations,
        recreationSuccesses: record.recreationSuccesses,
        lastRecoveryMs: record.lastRecoveryMs
      },
      iceStateTransitions: record.iceStateHistory,
      qualityAdaptations: record.adaptationHistory
    };
  }
}

/** Singleton shared across the entire app process */
export const callTelemetry = new CallTelemetry();
