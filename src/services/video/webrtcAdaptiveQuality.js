/**
 * webrtcAdaptiveQuality.js - Adaptive Quality Controller
 *
 * Manages dynamic video quality adaptation using five quality profiles:
 * Ultra, High, Medium, Low, and Audio Priority.
 *
 * Automatically monitors RTT, packet loss, jitter, available outgoing bitrate,
 * and video frame rate to transition between profiles. Includes step-up debounce
 * to prevent quality oscillations ("ping-pong" effect).
 */

import { applyTrackConstraintsSafely, applySenderParametersSafely, checkHardwareEncoderSupport, detectBrowser } from "./webrtcCompatibility";
import { callTelemetry } from "./callTelemetry";

export const QUALITY_PROFILES = {
  EXCELLENT: {
    index: 4,
    label: "Excellent",
    maxBitrate: 2500000,          // 2.5 Mbps
    scaleResolutionDownBy: 1.0,
    width: 1920,
    height: 1080,
    frameRate: 30,
  },
  GOOD: {
    index: 3,
    label: "Good",
    maxBitrate: 1500000,          // 1.5 Mbps
    scaleResolutionDownBy: 1.0,
    width: 1280,
    height: 720,
    frameRate: 30,
  },
  FAIR: {
    index: 2,
    label: "Fair",
    maxBitrate: 600000,           // 600 kbps
    scaleResolutionDownBy: 1.5,   // 480p equivalent
    width: 854,
    height: 480,
    frameRate: 24,
  },
  POOR: {
    index: 1,
    label: "Poor",
    maxBitrate: 250000,           // 250 kbps
    scaleResolutionDownBy: 2.0,   // 360p equivalent
    width: 640,
    height: 360,
    frameRate: 15,
  },
  CRITICAL: {
    index: 0,
    label: "Critical",
    maxBitrate: 50000,            // 50 kbps
    scaleResolutionDownBy: 4.0,   // extreme scale
    width: 320,
    height: 180,
    frameRate: 5,
  }
};

const PROFILE_ORDER = [
  QUALITY_PROFILES.CRITICAL,
  QUALITY_PROFILES.POOR,
  QUALITY_PROFILES.FAIR,
  QUALITY_PROFILES.GOOD,
  QUALITY_PROFILES.EXCELLENT
];

export class WebRTCAdaptiveQualityController {
  /**
   * @param {RTCPeerConnection} peer
   * @param {MediaStream} localStream
   * @param {string} [label] - Prefix for console logging
   * @param {string} [roomId] - Video room session identifier
   * @param {object} [initialProfile] - Starting profile
   */
  constructor(peer, localStream, label = "[Peer]", roomId = null, initialProfile = null) {
    this.peer = peer;
    this.localStream = localStream;
    this.label = label;
    this.roomId = roomId;
    
    // Default to initialProfile or GOOD profile on connection start
    this.currentProfile = initialProfile || QUALITY_PROFILES.GOOD;
    
    this.consecutiveHealthyTicks = 0;
    this.TICKS_TO_STEP_UP = 5; // 25 seconds of healthy network required to step up
    
    this.lastAdjustmentTime = 0;
    this.ADJUST_DEBOUNCE_MS = 3000; // 3s minimum time between any adjustment
    
    // Hysteresis cooldown: prevent stepping up for 15 seconds after any step down
    this.lastStepDownTime = 0;
    this.STEP_UP_COOLDOWN_MS = 15000;

    // Cooldown manager flags: ignores duplicate adjustments while stabilizing
    this._isAdapting = false;

    // Hardware encoder detection for performance adaptation
    this.hasHardwareEncoder = true;
    checkHardwareEncoderSupport().then((supported) => {
      this.hasHardwareEncoder = supported;
      console.log(`${this.label} [AdaptiveQuality] Hardware encoder supported: ${supported}`);
    });

    // Rolling history window (stores last 5 samples) for trend analysis
    this.history = [];

    // User-selectable quality preferences (Auto, HD, Balanced, Data Saver)
    this.qualityPreference = "Auto";

    // Metrics cache for telemetry logging
    this.lastRtt = 0;
    this.lastLoss = 0;
    this.lastJitter = 0;
    this.lastFps = 30;
    this.lastAvailBitrate = 999999;
  }

  /**
   * Sets the user's manual quality preference mode.
   * Immediately adjusts the active profile down if it exceeds the new cap.
   * 
   * @param {string} mode - "Auto" | "HD" | "Balanced" | "Data Saver"
   */
  async setQualityPreference(mode) {
    const validModes = ["Auto", "HD", "Balanced", "Data Saver"];
    if (!validModes.includes(mode)) return;
    
    this.qualityPreference = mode;
    console.log(`${this.label} [AdaptiveQuality] Preference set to: ${mode}`);

    let targetProfile = null;
    if (mode === "Data Saver" && this.currentProfile.index > QUALITY_PROFILES.POOR.index) {
      targetProfile = QUALITY_PROFILES.POOR;
    } else if (mode === "Balanced" && this.currentProfile.index > QUALITY_PROFILES.FAIR.index) {
      targetProfile = QUALITY_PROFILES.FAIR;
    }

    if (targetProfile) {
      console.log(`${this.label} [AdaptiveQuality] Current quality exceeds preference cap. Adjusting immediately.`);
      await this.applyProfile(targetProfile);
    }
  }

  /**
   * Evaluates the current WebRTC deltas/flags and shifts quality profiles accordingly.
   * 
   * @param {object} deltas - Calculated stats deltas
   * @param {Array} flags - List of detected metric degradations
   */
  async evaluate(deltas, flags) {
    const now = Date.now();
    if (this._isAdapting || (now - this.lastAdjustmentTime < this.ADJUST_DEBOUNCE_MS)) return;

    const rtt = deltas.rttMs ?? 0;
    const packetLoss = Math.max(deltas.videoPacketLossPercent ?? 0, deltas.audioPacketLossPercent ?? 0);
    const jitter = Math.max(deltas.videoJitterMs ?? 0, deltas.audioJitterMs ?? 0);
    const availBitrate = deltas.availBitrateKbps ?? 999999;
    const videoFps = deltas.videoFps ?? 30;
    const qualityLimitationReason = deltas.qualityLimitationReason || "none";

    // Cache latest stats metrics for telemetry reporting
    this.lastRtt = rtt;
    this.lastLoss = packetLoss;
    this.lastJitter = jitter;
    this.lastFps = videoFps;
    this.lastAvailBitrate = availBitrate;

    // Record current sample in the rolling history buffer
    this.history.push({ rtt, packetLoss, jitter, availBitrate, videoFps, qualityLimitationReason });
    if (this.history.length > 5) {
      this.history.shift();
    }

    // Predictive Trend Analysis (requires at least 3 samples to evaluate trends)
    let isDegradingTrend = false;
    let trendReason = "";

    if (this.history.length >= 3) {
      const h = this.history;
      const len = h.length;

      // 1. RTT increasing consecutively (queue buildup / bufferbloat)
      const rttClimbing = h[len - 1].rtt > h[len - 2].rtt && h[len - 2].rtt > h[len - 3].rtt;
      if (rttClimbing && h[len - 1].rtt > 150) {
        isDegradingTrend = true;
        trendReason = `RTT climbing consecutively (${h[len - 3].rtt.toFixed(0)}ms -> ${h[len - 2].rtt.toFixed(0)}ms -> ${h[len - 1].rtt.toFixed(0)}ms)`;
      }

      // 2. Packet loss climbing consecutively (queue drops / packet congestion)
      const lossClimbing = h[len - 1].packetLoss > h[len - 2].packetLoss && h[len - 2].packetLoss > h[len - 3].packetLoss;
      if (lossClimbing && h[len - 1].packetLoss > 1.0) {
        isDegradingTrend = true;
        trendReason = `Packet loss climbing consecutively (${h[len - 3].packetLoss.toFixed(1)}% -> ${h[len - 2].packetLoss.toFixed(1)}% -> ${h[len - 1].packetLoss.toFixed(1)}%)`;
      }

      // 3. Available outgoing bitrate dropping consecutively
      const bitrateDropping = h[len - 1].availBitrate < h[len - 2].availBitrate && h[len - 2].availBitrate < h[len - 3].availBitrate;
      if (bitrateDropping && h[len - 1].availBitrate !== 999999) {
        const dropPercent = ((h[len - 3].availBitrate - h[len - 1].availBitrate) / h[len - 3].availBitrate) * 100;
        if (dropPercent >= 15) { // Drops by at least 15% overall
          isDegradingTrend = true;
          trendReason = `Bitrate declining consecutively by ${dropPercent.toFixed(0)}% (${h[len - 3].availBitrate.toFixed(0)}k -> ${h[len - 1].availBitrate.toFixed(0)}k)`;
        }
      }
    }

    // Check for critical thresholds (forces step down)
    const isCritical = 
      rtt > 400 || 
      packetLoss > 8 || 
      jitter > 80 || 
      videoFps < 10 ||
      qualityLimitationReason === "cpu" || // Force step down if CPU limited
      (availBitrate !== 999999 && availBitrate < (this.currentProfile.maxBitrate / 1000) * 0.7);

    // Check for warning thresholds (pre-emptive step down)
    const isWarning = 
      rtt > 250 || 
      packetLoss > 3 || 
      jitter > 40 || 
      qualityLimitationReason === "bandwidth" || // Pre-emptive step down on network limits
      videoFps < 18;

    if (isCritical || isWarning || isDegradingTrend) {
      this.consecutiveHealthyTicks = 0; // Reset step-up progress
      
      if (this.currentProfile.index > 0) {
        const nextProfile = PROFILE_ORDER[this.currentProfile.index - 1];
        const reason = isCritical ? "Critical threshold crossed" : isWarning ? "Warning threshold crossed" : `Predictive trend: ${trendReason}`;
        console.warn(`${this.label} [AdaptiveQuality] Stepping DOWN: ${this.currentProfile.label} -> ${nextProfile.label} (${reason})`);
        this.lastStepDownTime = now; // Record the step-down time for cooldown hysteresis
        await this.applyProfile(nextProfile);
      }
      return;
    }

    // Network is healthy — evaluate step up
    const isHealthy = 
      rtt < 100 && 
      packetLoss < 1 && 
      jitter < 20 && 
      videoFps >= 25;

    // Apply step-up hysteresis: verify network has been stable since cooldown ended
    const isCooldownActive = (now - this.lastStepDownTime) < this.STEP_UP_COOLDOWN_MS;

    if (isHealthy && !isCooldownActive) {
      if (this.currentProfile.index < PROFILE_ORDER.length - 1) {
        const nextHigherProfile = PROFILE_ORDER[this.currentProfile.index + 1];

        // Mobile Battery Optimization: Cap mobile devices at GOOD (720p) to prevent heat/battery exhaustion
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && nextHigherProfile.index > QUALITY_PROFILES.GOOD.index) {
          // Do not step up past GOOD on mobile; reset ticks and return
          this.consecutiveHealthyTicks = 0;
          return;
        }

        // Hardware Encoder Optimization: Cap software-only encoding devices at FAIR to prevent CPU thrashing
        if (!this.hasHardwareEncoder && nextHigherProfile.index > QUALITY_PROFILES.FAIR.index) {
          // Do not step up past FAIR on software-only devices; reset ticks and return
          this.consecutiveHealthyTicks = 0;
          return;
        }

        // User Preference Optimization: Cap quality profiles based on manual preferences
        let maxAllowedIndex = QUALITY_PROFILES.EXCELLENT.index;
        if (this.qualityPreference === "Data Saver") {
          maxAllowedIndex = QUALITY_PROFILES.POOR.index;
        } else if (this.qualityPreference === "Balanced") {
          maxAllowedIndex = QUALITY_PROFILES.FAIR.index;
        }

        if (nextHigherProfile.index > maxAllowedIndex) {
          // Do not step up past the user-selected quality cap; reset ticks and return
          this.consecutiveHealthyTicks = 0;
          return;
        }
        
        // Ensure the network's estimated outgoing bitrate can support the higher profile
        const hasBandwidth = availBitrate === 999999 || availBitrate > (nextHigherProfile.maxBitrate / 1000) * 1.2;

        if (hasBandwidth) {
          this.consecutiveHealthyTicks++;
          if (this.consecutiveHealthyTicks >= this.TICKS_TO_STEP_UP) {
            this.consecutiveHealthyTicks = 0;
            console.log(`${this.label} [AdaptiveQuality] Network stable for ${this.TICKS_TO_STEP_UP} ticks — Stepping UP: ${this.currentProfile.label} -> ${nextHigherProfile.label}`);
            await this.applyProfile(nextHigherProfile);
          }
        } else {
          this.consecutiveHealthyTicks = 0;
        }
      }
    } else {
      this.consecutiveHealthyTicks = 0;
    }
  }

  /**
   * Applies the configuration parameters of a profile to the tracks and connection senders.
   * 
   * @param {object} profile - The target quality profile
   */
  async applyProfile(profile) {
    // Ignore duplicate profile changes or concurrent adjustments
    if (this._isAdapting || this.currentProfile.label === profile.label) {
      return;
    }
    
    const prevProfile = this.currentProfile;
    this._isAdapting = true;
    this.currentProfile = profile;
    this.lastAdjustmentTime = Date.now();

    try {
      // 1. Apply constraints to camera video track (capture level)
      const videoTrack = this.localStream?.getVideoTracks()[0];
      if (videoTrack) {
        await applyTrackConstraintsSafely(videoTrack, {
          width: { ideal: profile.width },
          height: { ideal: profile.height },
          frameRate: { ideal: profile.frameRate }
        });
      }

      // 2. Set maxBitrate and resolution scaling on connection encoder (network level)
      const videoSender = this.peer?.getSenders().find(s => s.track?.kind === "video");
      if (videoSender) {
        await applySenderParametersSafely(videoSender, {
          maxBitrate: profile.maxBitrate,
          scaleResolutionDownBy: profile.scaleResolutionDownBy
        });
      }

      // 3. Record structured quality adaptation telemetry
      if (this.roomId) {
        const browser = detectBrowser();
        const ua = navigator.userAgent;
        const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" :
                   /Android/.test(ua) ? "Android" :
                   /Windows/.test(ua) ? "Windows" :
                   /Macintosh/.test(ua) ? "macOS" :
                   /Linux/.test(ua) ? "Linux" : "Unknown OS";

        callTelemetry.recordQualityAdaptation(this.roomId, {
          previousProfile: prevProfile.label,
          newProfile: profile.label,
          bitrateKbps: profile.maxBitrate / 1000,
          rttMs: this.lastRtt,
          packetLossPercent: this.lastLoss,
          jitterMs: this.lastJitter,
          frameRate: this.lastFps,
          browser: browser.name + (browser.isIOS ? " (iOS)" : ""),
          os
        });
      }
    } finally {
      // Allow encoder and camera hardware 3 seconds to stabilize before releasing lock
      setTimeout(() => {
        this._isAdapting = false;
        console.log(`${this.label} [AdaptiveQuality] Quality transition stabilized. Cooldown released.`);
      }, this.ADJUST_DEBOUNCE_MS);
    }
  }
}
