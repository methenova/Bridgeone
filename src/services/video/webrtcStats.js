/**
 * webrtcStats.js - WebRTC Statistics Monitor
 *
 * Polls RTCPeerConnection.getStats() after every recovery event (ICE restart,
 * PeerConnection recreation) and during steady-state calls to verify that
 * packet loss, bitrate, RTT, jitter, frame rate, DTLS state, ICE candidate
 * pair state, and media quality all return to healthy values.
 *
 * Exported class: WebRTCStatsMonitor
 *
 * Usage:
 *   import { WebRTCStatsMonitor } from "./webrtcStats";
 *   const mon = new WebRTCStatsMonitor("[SellerPeer]");
 *   mon.startContinuous(peer, onDegradation);  // during active call
 *   mon.verifyPostRecovery(peer, "ICE_RESTART"); // fire-and-forget after recovery
 *   mon.stop();                                 // in destroy()
 */

import { callTelemetry } from "./callTelemetry";

class LongRunDiagnostics {
  constructor(label, roomId = null) {
    this.label = label;
    this.roomId = roomId;
    this.memoryHistory = [];
    this.lastTickTime = null;
    this.stalledEncoderTicks = 0;
  }

  update(peer, currentSample, deltas) {
    if (!peer) return;
    const now = Date.now();
    const reports = [];

    // 1. CPU Event Loop Lag (indicates CPU exhaustion/blocking tasks)
    if (this.lastTickTime !== null) {
      const actualDelta = now - this.lastTickTime;
      const expectedDelta = 5000; // CONTINUOUS_INTERVAL is 5000ms
      if (actualDelta > expectedDelta * 1.5) {
        const lagMs = actualDelta - expectedDelta;
        reports.push({
          type: "CPU_LAG_WARNING",
          message: `CPU Lag detected: main thread blocked. Event loop delayed by ${lagMs}ms.`
        });
      }
    }
    this.lastTickTime = now;

    // 2. Memory Leak Detection (Chrome/Edge/Opera only)
    if (window.performance && window.performance.memory) {
      const heap = window.performance.memory.usedJSHeapSize;
      this.memoryHistory.push(heap);
      if (this.memoryHistory.length > 10) {
        this.memoryHistory.shift();
      }

      if (this.memoryHistory.length >= 5) {
        // Check if memory has grown continuously
        let isGrowing = true;
        for (let i = 1; i < this.memoryHistory.length; i++) {
          if (this.memoryHistory[i] <= this.memoryHistory[i - 1]) {
            isGrowing = false;
            break;
          }
        }
        if (isGrowing) {
          const totalGrowthMb = (this.memoryHistory[this.memoryHistory.length - 1] - this.memoryHistory[0]) / (1024 * 1024);
          if (totalGrowthMb > 30) { // Growth of over 30MB consecutively
            reports.push({
              type: "MEMORY_LEAK_WARNING",
              message: `Potential Memory Leak: heap size increased consecutively by ${totalGrowthMb.toFixed(1)}MB over 5 samples.`
            });
          }
        }
      }
    }

    // 3. Stalled Encoder Detection
    if (currentSample.outbound && currentSample.outbound.video) {
      const deltaBytes = deltas.videoSendBitrateKbps ?? 0;
      const hasActiveVideoTrack = peer.getSenders().some(
        (s) => s.track && s.track.kind === "video" && s.track.readyState === "live"
      );
      
      if (hasActiveVideoTrack && deltaBytes === 0) {
        this.stalledEncoderTicks++;
        if (this.stalledEncoderTicks >= 3) { // Stalled for 15s
          reports.push({
            type: "ENCODER_STALL_WARNING",
            message: `Video encoder stalled: active video track detected but outbound bitrate is 0 kbps for 15 seconds.`
          });
        }
      } else {
        this.stalledEncoderTicks = 0;
      }
    }

    // 4. Resource / Track Accumulation Leak
    const totalSenders = peer.getSenders().length;
    if (totalSenders > 6) { // Typically 1 audio + 1 video + 1 screen-share. If senders build up, it's a leak
      reports.push({
        type: "RESOURCE_EXHAUSTION_WARNING",
        message: `High RTCRtpSender count (${totalSenders}): check for duplicate track registrations or un-removed streams.`
      });
    }

    // Report diagnostics
    reports.forEach((r) => {
      console.warn(`${this.label} [Diagnostics] ${r.type} - ${r.message}`);
      if (this.roomId) {
        callTelemetry._emit("long_call_diagnostic_warning", { role: "peer", sessionId: this.roomId }, {
          diagnosticType: r.type,
          diagnosticMessage: r.message
        });
      }
    });
  }
}

// Healthy-value thresholds (WebRTC standards, ITU-T G.114 / G.107)
const THRESHOLDS = {
  packetLossPercent: { warn: 2,   crit: 8   },  // %   above 8% noticeable degradation
  rttMs:             { warn: 150, crit: 400  },  // ms  above 400ms severe latency
  jitterMs:          { warn: 30,  crit: 80   },  // ms  above 80ms audio/video stutter
  videoFpsMin:       { warn: 10,  crit: 5    },  // fps below 5fps call is unusable
};

const POST_RECOVERY_SAMPLES  = 5;    // samples taken after recovery
const POST_RECOVERY_INTERVAL = 2000; // ms between post-recovery samples
const CONTINUOUS_INTERVAL    = 5000; // ms between continuous monitoring samples

export class WebRTCStatsMonitor {
  /**
   * @param {string} label - prefix for all console output, e.g. "[SellerPeer]"
   * @param {string} [roomId] - Optional session ID
   */
  constructor(label, roomId = null) {
    this.label           = label;
    this.roomId          = roomId;
    this._contInterval   = null;
    this._contTimeout    = null;
    this._isStopped      = false;
    this._prevSample     = null;
    this._prevSampleTime = null;
    this._inboundVideoFreezeTicks = 0;
    this.onFreezeRecovery = null;
    // ML-5 FIX: Guard against concurrent verifyPostRecovery executions.
    // If ICE rapidly cycles connected→disconnected→connected, multiple calls
    // can stack up — each holding an untracked local setInterval for 10s.
    this._isVerifying  = false;
    this._verifyTimer  = null;
    this.diagnostics   = null;
  }

  /**
   * Start continuous background stats monitoring during an active call.
   * Polls every CONTINUOUS_INTERVAL ms. Calls onDegradation(flags, deltas)
   * when a critical threshold is crossed.
   *
   * @param {RTCPeerConnection} peer
   * @param {Function}          [onDegradation]
   */
  startContinuous(peer, onSample) {
    this.stop();
    this._isStopped      = false;
    this._prevSample     = null;
    this._prevSampleTime = null;

    if (!this.diagnostics) {
      this.diagnostics = new LongRunDiagnostics(this.label, this.roomId);
    }

    const tick = async () => {
      if (this._isStopped || !peer || peer.iceConnectionState === "closed" || peer.iceConnectionState === "failed") {
        this.stop();
        return;
      }

      const now     = Date.now();
      const current = await this._sample(peer);
      let nextInterval = 5000; // default stable network interval

      if (current && this._prevSample && this._prevSampleTime) {
        const dtMs   = now - this._prevSampleTime;
        const deltas = this._computeDeltas(current, this._prevSample, dtMs);
        const flags  = this._analyze(deltas);

        // Run long call stability diagnostic audits (memory, CPU, encoder stall)
        if (this.diagnostics) {
          this.diagnostics.update(peer, current, deltas);
        }

        // Check for inbound video freeze:
        // If peer is connected, and we have inbound video track stats, but framesDecoded did not increase:
        if (peer && (peer.iceConnectionState === "connected" || peer.iceConnectionState === "completed")) {
          if (deltas.videoFramesDecodedDelta !== undefined && deltas.videoFramesDecodedDelta === 0) {
            // Only count if we are actually receiving video track packets (i.e. not muted or paused)
            if (current.inbound.video && current.inbound.video.bytesReceived > 0) {
              this._inboundVideoFreezeTicks++;
              console.warn(`${this.label} [RTCStats] Inbound video freeze detected! Tick count: ${this._inboundVideoFreezeTicks}`);
            }
          } else {
            this._inboundVideoFreezeTicks = 0;
          }

          // Trigger recovery if frozen for 3 consecutive checks
          if (this._inboundVideoFreezeTicks >= 3) {
            console.error(`${this.label} [RTCStats] CRITICAL: Video has been frozen for 3 checks while connected. Triggering automatic recovery!`);
            this._inboundVideoFreezeTicks = 0;
            if (this.onFreezeRecovery) {
              this.onFreezeRecovery();
            }
          }
        } else {
          this._inboundVideoFreezeTicks = 0;
        }

        // Determine network state for adaptive sampling
        const rtt = deltas.rttMs ?? 0;
        const packetLoss = Math.max(deltas.videoPacketLossPercent ?? 0, deltas.audioPacketLossPercent ?? 0);
        const isCritical = rtt > 400 || packetLoss > 8;
        const isWarning = rtt > 250 || packetLoss > 3;

        if (isCritical) {
          nextInterval = 1000; // 1 second high-frequency polling during critical dropouts
        } else if (isWarning) {
          nextInterval = 2500; // 2.5 seconds medium-frequency polling during warnings
        } else {
          nextInterval = 5000; // 5 seconds polling during stable networks
        }

        const criticals = flags.filter((f) => f.severity === "CRIT");
        if (criticals.length > 0) {
          this._logSnapshot("continuous", deltas);
          criticals.forEach((f) =>
            console.warn(`${this.label} [RTCStats] DEGRADATION - ${f.metric}: ${f.value}`)
          );
        }

        if (onSample) {
          onSample(flags, deltas);
        }
      }

      this._prevSample     = current;
      this._prevSampleTime = now;

      // Schedule recursively
      if (!this._isStopped) {
        this._contTimeout = setTimeout(tick, nextInterval);
      }
    };

    // Launch first tick
    tick();
  }

  /**
   * After an ICE restart or recreation, poll getStats() to verify recovery.
   * Runs asynchronously - does NOT block the call flow.
   * Logs PASS/WARNING/ABNORMAL for each metric across POST_RECOVERY_SAMPLES samples.
   *
   * @param {RTCPeerConnection} peer
   * @param {string}            event - "ICE_RESTART" | "RECREATION" | custom label
   * @returns {Promise<{healthy: boolean}>}
   */
  async verifyPostRecovery(peer, event) {
    // ML-5 FIX: Only one verification run at a time. If ICE recovers multiple
    // times quickly, the first run already covers the recovery; additional runs
    // would just produce redundant overlapping setIntervals.
    if (this._isVerifying) {
      console.log(`${this.label} [RTCStats] verifyPostRecovery skipped (already running for prior event)`);
      return { healthy: true };
    }
    this._isVerifying = true;

    const tag = `${this.label} [RTCStats][${event}]`;
    console.log(`${tag} Starting post-recovery verification (${POST_RECOVERY_SAMPLES} samples x ${POST_RECOVERY_INTERVAL}ms)...`);

    let prevSample  = await this._sample(peer);
    let prevTime    = Date.now();
    let sampleCount = 0;
    let allHealthy  = true;

    await new Promise((resolve) => {
      this._verifyTimer = setInterval(async () => {
        sampleCount++;

        if (!peer || peer.iceConnectionState === "closed") {
          clearInterval(this._verifyTimer);
          this._verifyTimer  = null;
          this._isVerifying  = false;
          resolve();
          return;
        }

        const current = await this._sample(peer);
        const now     = Date.now();
        const dtMs    = now - prevTime;

        if (current && prevSample) {
          const deltas = this._computeDeltas(current, prevSample, dtMs);
          const flags  = this._analyze(deltas);

          this._logSnapshot(`${tag} [${sampleCount}/${POST_RECOVERY_SAMPLES}]`, deltas);

          if (flags.length === 0) {
            console.log(`${tag} PASS ${sampleCount}/${POST_RECOVERY_SAMPLES} - all metrics healthy`);
          } else {
            flags.forEach((f) => {
              if (f.severity === "CRIT") {
                console.error(`${tag} ABNORMAL - ${f.metric}: ${f.value}`);
                allHealthy = false;
              } else {
                console.warn(`${tag} WARNING - ${f.metric}: ${f.value}`);
              }
            });
          }

          prevSample = current;
          prevTime   = now;
        }

        if (sampleCount >= POST_RECOVERY_SAMPLES) {
          clearInterval(this._verifyTimer);
          this._verifyTimer = null;
          this._isVerifying = false;
          if (allHealthy) {
            console.log(`${tag} Post-recovery PASSED - all metrics returned to healthy values.`);
          } else {
            console.warn(`${tag} Post-recovery PARTIAL - some metrics remain degraded after ${POST_RECOVERY_SAMPLES} samples.`);
          }
          resolve();
        }
      }, POST_RECOVERY_INTERVAL);
    });

    return { healthy: allHealthy };
  }

  /**
   * Stop the continuous background poll. Call in destroy().
   */
  stop() {
    this._isStopped = true;
    if (this._contTimeout) {
      clearTimeout(this._contTimeout);
      this._contTimeout = null;
    }
    if (this._contInterval) {
      clearInterval(this._contInterval);
      this._contInterval   = null;
    }
    this._prevSample     = null;
    this._prevSampleTime = null;
    // ML-5 FIX: Also cancel any in-progress post-recovery verification so it
    // doesn't continue polling a closed/null peer after destroy() is called.
    if (this._verifyTimer) {
      clearInterval(this._verifyTimer);
      this._verifyTimer = null;
      this._isVerifying = false;
    }
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  async _sample(peer) {
    if (!peer) return null;
    try {
      const report = await peer.getStats();
      return this._parse(report);
    } catch (err) {
      console.warn(`${this.label} [RTCStats] getStats() error:`, err.message);
      return null;
    }
  }

  _parse(report) {
    const snap = {
      ts:            Date.now(),
      outbound:      { audio: null, video: null },
      inbound:       { audio: null, video: null },
      candidatePair: null,
      transport:     null,
      codecs:        [],
    };

    report.forEach((s) => {
      switch (s.type) {
        case "outbound-rtp":
          snap.outbound[s.kind] = {
            packetsSent:             s.packetsSent             || 0,
            bytesSent:               s.bytesSent               || 0,
            framesPerSecond:         s.framesPerSecond,
            qualityLimitationReason: s.qualityLimitationReason || "none",
          };
          break;

        case "inbound-rtp":
          snap.inbound[s.kind] = {
            packetsReceived: s.packetsReceived || 0,
            packetsLost:     s.packetsLost     || 0,
            bytesReceived:   s.bytesReceived   || 0,
            jitter:          s.jitter          || 0,
            framesPerSecond: s.framesPerSecond,
            framesDropped:   s.framesDropped   || 0,
            framesDecoded:   s.framesDecoded   || 0,
            framesReceived:  s.framesReceived  || 0,
          };
          break;

        case "candidate-pair":
          // Only capture the active, nominated pair in "succeeded" state
          if (s.nominated && s.state === "succeeded") {
            const localCandidate = report.get(s.localCandidateId);
            const remoteCandidate = report.get(s.remoteCandidateId);
            const localType = localCandidate ? (localCandidate.candidateType || localCandidate.protocol || "unknown") : "unknown";
            const remoteType = remoteCandidate ? (remoteCandidate.candidateType || remoteCandidate.protocol || "unknown") : "unknown";
            const turnUsage = localType === "relay" || remoteType === "relay";

            snap.candidatePair = {
              state:                    s.state,
              nominated:                s.nominated,
              currentRoundTripTime:     s.currentRoundTripTime,
              availableOutgoingBitrate: s.availableOutgoingBitrate,
              bytesSent:                s.bytesSent     || 0,
              bytesReceived:            s.bytesReceived || 0,
              localType,
              remoteType,
              turnUsage
            };

            if (this.roomId) {
              callTelemetry.recordMetadata(this.roomId, {
                localCandidateType: localType,
                remoteCandidateType: remoteType,
                turnUsage: turnUsage
              });
            }
          }
          break;

        case "transport":
          snap.transport = {
            dtlsState:               s.dtlsState,
            iceState:                s.iceState,
            selectedCandidatePairId: s.selectedCandidatePairId,
            bytesSent:               s.bytesSent     || 0,
            bytesReceived:           s.bytesReceived || 0,
          };
          break;

        case "codec":
          snap.codecs.push({ mimeType: s.mimeType, clockRate: s.clockRate });
          if (this.roomId && s.mimeType) {
            callTelemetry.recordMetadata(this.roomId, {
              codecs: [s.mimeType]
            });
          }
          break;
      }
    });

    return snap;
  }

  _computeDeltas(cur, prev, dtMs) {
    if (!cur || !prev || dtMs <= 0) return {};
    const dtS = dtMs / 1000;
    const d   = {};

    // Inbound video
    if (cur.inbound.video && prev.inbound.video) {
      const c = cur.inbound.video, p = prev.inbound.video;
      const rxD = c.packetsReceived - p.packetsReceived;
      const lD  = c.packetsLost     - p.packetsLost;
      const tot = rxD + Math.max(0, lD);
      d.videoPacketLossPercent = tot > 0 ? (Math.max(0, lD) / tot) * 100 : 0;
      d.videoBitrateKbps       = ((c.bytesReceived - p.bytesReceived) * 8) / dtS / 1000;
      d.videoFps               = c.framesPerSecond || 0;
      d.videoJitterMs          = (c.jitter || 0) * 1000;
      d.videoFramesDropped     = c.framesDropped - p.framesDropped;
      d.videoFramesDecodedDelta  = c.framesDecoded - p.framesDecoded;
      d.videoFramesReceivedDelta = c.framesReceived - p.framesReceived;
    }

    // Inbound audio
    if (cur.inbound.audio && prev.inbound.audio) {
      const c = cur.inbound.audio, p = prev.inbound.audio;
      const rxD = c.packetsReceived - p.packetsReceived;
      const lD  = c.packetsLost     - p.packetsLost;
      const tot = rxD + Math.max(0, lD);
      d.audioPacketLossPercent = tot > 0 ? (Math.max(0, lD) / tot) * 100 : 0;
      d.audioBitrateKbps       = ((c.bytesReceived - p.bytesReceived) * 8) / dtS / 1000;
      d.audioJitterMs          = (c.jitter || 0) * 1000;
    }

    // Outbound video
    if (cur.outbound.video && prev.outbound.video) {
      const c = cur.outbound.video, p = prev.outbound.video;
      d.videoSendBitrateKbps    = ((c.bytesSent - p.bytesSent) * 8) / dtS / 1000;
      d.videoSendFps            = c.framesPerSecond || 0;
      d.qualityLimitationReason = c.qualityLimitationReason;
    }

    // Outbound audio
    if (cur.outbound.audio && prev.outbound.audio) {
      const c = cur.outbound.audio, p = prev.outbound.audio;
      d.audioSendBitrateKbps = ((c.bytesSent - p.bytesSent) * 8) / dtS / 1000;
    }

    // Candidate pair - RTT, available bitrate
    if (cur.candidatePair) {
      d.rttMs              = (cur.candidatePair.currentRoundTripTime || 0) * 1000;
      d.availBitrateKbps   = (cur.candidatePair.availableOutgoingBitrate || 0) / 1000;
      d.candidatePairState = cur.candidatePair.state;
    } else {
      d.candidatePairState = "none";
    }

    // Transport - DTLS + ICE state
    if (cur.transport) {
      d.dtlsState = cur.transport.dtlsState;
      d.iceState  = cur.transport.iceState;
    }

    d.codecs = cur.codecs.map((c) => c.mimeType).join(", ");
    return d;
  }

  _analyze(d) {
    const flags = [];

    const check = (metric, value, thresholds, unit, inverted) => {
      if (value === undefined || value === null || isNaN(value)) return;
      const bad  = inverted ? value < thresholds.crit : value > thresholds.crit;
      const warn = inverted ? value < thresholds.warn : value > thresholds.warn;
      if (bad)       flags.push({ metric, value: `${value.toFixed(1)}${unit}`, severity: "CRIT" });
      else if (warn) flags.push({ metric, value: `${value.toFixed(1)}${unit}`, severity: "WARN" });
    };

    check("Video Packet Loss",  d.videoPacketLossPercent, THRESHOLDS.packetLossPercent, "%",   false);
    check("Audio Packet Loss",  d.audioPacketLossPercent, THRESHOLDS.packetLossPercent, "%",   false);
    check("Round-Trip Time",    d.rttMs,                  THRESHOLDS.rttMs,             "ms",  false);
    check("Video Jitter",       d.videoJitterMs,          THRESHOLDS.jitterMs,          "ms",  false);
    check("Audio Jitter",       d.audioJitterMs,          THRESHOLDS.jitterMs,          "ms",  false);
    check("Video Frame Rate",   d.videoFps,               THRESHOLDS.videoFpsMin,       "fps", true);

    if (d.dtlsState && d.dtlsState !== "connected") {
      flags.push({ metric: "DTLS State",         value: d.dtlsState,         severity: "CRIT" });
    }
    if (d.candidatePairState && d.candidatePairState !== "succeeded" && d.candidatePairState !== "none") {
      flags.push({ metric: "ICE Candidate Pair", value: d.candidatePairState, severity: "CRIT" });
    }
    if (d.qualityLimitationReason && d.qualityLimitationReason !== "none") {
      flags.push({ metric: "Quality Limitation", value: d.qualityLimitationReason, severity: "WARN" });
    }

    return flags;
  }

  _logSnapshot(tag, d) {
    const parts = [];
    if (d.videoBitrateKbps      != null) parts.push(`vid-rx=${d.videoBitrateKbps.toFixed(0)}kbps`);
    if (d.videoSendBitrateKbps  != null) parts.push(`vid-tx=${d.videoSendBitrateKbps.toFixed(0)}kbps`);
    if (d.audioBitrateKbps      != null) parts.push(`aud-rx=${d.audioBitrateKbps.toFixed(0)}kbps`);
    if (d.audioSendBitrateKbps  != null) parts.push(`aud-tx=${d.audioSendBitrateKbps.toFixed(0)}kbps`);
    if (d.videoFps              != null) parts.push(`fps=${d.videoFps.toFixed(1)}`);
    if (d.rttMs                 != null) parts.push(`rtt=${d.rttMs.toFixed(0)}ms`);
    if (d.videoPacketLossPercent != null) parts.push(`vLoss=${d.videoPacketLossPercent.toFixed(1)}%`);
    if (d.audioPacketLossPercent != null) parts.push(`aLoss=${d.audioPacketLossPercent.toFixed(1)}%`);
    if (d.videoJitterMs         != null) parts.push(`jitter=${d.videoJitterMs.toFixed(1)}ms`);
    if (d.dtlsState)                     parts.push(`dtls=${d.dtlsState}`);
    if (d.candidatePairState)            parts.push(`ice-pair=${d.candidatePairState}`);
    if (d.availBitrateKbps      != null) parts.push(`avail=${d.availBitrateKbps.toFixed(0)}kbps`);
    if (d.codecs)                        parts.push(`codecs=[${d.codecs}]`);
    console.log(`${this.label} [RTCStats] ${tag}: ${parts.join(" | ") || "(no data)"}`);
  }
}
