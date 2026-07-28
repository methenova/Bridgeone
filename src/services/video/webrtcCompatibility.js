/**
 * webrtcCompatibility.js - Browser Compatibility Layer
 *
 * Detects Chrome, Edge, Firefox, Safari, and iOS Safari.
 * Evaluates and applies supported RTCRtpSender parameters and MediaTrack constraints
 * dynamically, gracefully skipping unsupported features to prevent runtime errors.
 */

/**
 * Detects the current browser and platform.
 * 
 * @returns {object} Browser description flags
 */
export function detectBrowser() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isChrome = /Chrome|CriOS/.test(ua) && !isEdge;
  const isSafari = /Safari/.test(ua) && !isChrome && !isEdge;

  return {
    name: isFirefox ? "Firefox" : isEdge ? "Edge" : isChrome ? "Chrome" : isSafari ? "Safari" : "Unknown",
    isIOS,
    isSafari,
    isFirefox,
    isChrome,
    isEdge
  };
}

/**
 * Filters and sanitises MediaTrackConstraints based on browser support.
 * 
 * @param {object} desired - The desired video constraints
 * @returns {object} Supported video constraints
 */
export function getSupportedVideoConstraints(desired) {
  if (!desired) return {};

  const supported = navigator.mediaDevices?.getSupportedConstraints?.() || {};
  const result = {};

  // Map and transfer constraints only if supported by the browser engine
  if (supported.width && desired.width) result.width = desired.width;
  if (supported.height && desired.height) result.height = desired.height;
  if (supported.frameRate && desired.frameRate) result.frameRate = desired.frameRate;
  if (supported.deviceId && desired.deviceId) result.deviceId = desired.deviceId;
  if (supported.facingMode && desired.facingMode) result.facingMode = desired.facingMode;

  return result;
}

/**
 * Resolves the closest supported width, height, and framerate based on track capabilities.
 * If capabilities are unsupported, returns desired constraints with ideal values.
 * 
 * @param {MediaStreamTrack} track - The video track
 * @param {object} desired - The desired { width, height, frameRate } constraints
 * @returns {object} Closest supported constraints matching track capabilities
 */
export function getClosestSupportedConstraints(track, desired) {
  if (!desired) return {};
  if (!track || typeof track.getCapabilities !== "function") {
    // If getCapabilities is not supported (e.g. Firefox), return ideal constraints as-is
    const fallback = {};
    if (desired.width) fallback.width = typeof desired.width === "object" ? desired.width : { ideal: desired.width };
    if (desired.height) fallback.height = typeof desired.height === "object" ? desired.height : { ideal: desired.height };
    if (desired.frameRate) fallback.frameRate = typeof desired.frameRate === "object" ? desired.frameRate : { ideal: desired.frameRate };
    return fallback;
  }

  try {
    const caps = track.getCapabilities();
    console.log("[Compatibility] Camera Capabilities:", JSON.stringify(caps));

    const result = {};

    const clamp = (val, range) => {
      if (!range) return val;
      const min = range.min !== undefined ? range.min : 0;
      const max = range.max !== undefined ? range.max : 999999;
      return Math.max(min, Math.min(max, val));
    };

    // Extract desired values (unpacking ideal/exact values if they are objects)
    const getDesiredValue = (item) => {
      if (item === null || item === undefined) return null;
      if (typeof item === "object") {
        return item.ideal !== undefined ? item.ideal : item.exact;
      }
      return item;
    };

    const targetWidth = getDesiredValue(desired.width);
    const targetHeight = getDesiredValue(desired.height);
    const targetFrameRate = getDesiredValue(desired.frameRate);

    if (targetWidth !== null) {
      result.width = { ideal: caps.width ? clamp(targetWidth, caps.width) : targetWidth };
    }
    if (targetHeight !== null) {
      result.height = { ideal: caps.height ? clamp(targetHeight, caps.height) : targetHeight };
    }
    if (targetFrameRate !== null) {
      result.frameRate = { ideal: caps.frameRate ? clamp(targetFrameRate, caps.frameRate) : targetFrameRate };
    }

    return result;
  } catch (err) {
    console.warn("[Compatibility] Failed to read track capabilities:", err.message);
    const fallback = {};
    if (desired.width) fallback.width = typeof desired.width === "object" ? desired.width : { ideal: desired.width };
    if (desired.height) fallback.height = typeof desired.height === "object" ? desired.height : { ideal: desired.height };
    if (desired.frameRate) fallback.frameRate = typeof desired.frameRate === "object" ? desired.frameRate : { ideal: desired.frameRate };
    return fallback;
  }
}

/**
 * Safely applies constraints to a MediaStreamTrack, falling back gracefully if it fails.
 * 
 * @param {MediaStreamTrack} track - The local media track
 * @param {object} constraints - Desired track constraints
 */
export async function applyTrackConstraintsSafely(track, constraints) {
  if (!track || track.readyState === "ended") return;

  const browser = detectBrowser();
  // 1. Resolve nearest valid constraints based on camera capabilities
  const clamped = getClosestSupportedConstraints(track, constraints);
  // 2. Filter resolved constraints based on what constraints properties the browser supports
  const supported = getSupportedVideoConstraints(clamped);

  try {
    console.log(`[Compatibility] Applying video constraints on ${browser.name}:`, JSON.stringify(supported));
    await track.applyConstraints(supported);
  } catch (err) {
    console.warn(`[Compatibility] applyConstraints failed for ${track.kind} track:`, err.message || err);

    // OverconstrainedError fallback: try applying ideal values or stripping constraints
    if (err.name === "OverconstrainedError" || err.name === "NotSupportedError") {
      try {
        console.log("[Compatibility] Falling back to minimum standard constraints...");
        // Fall back to ideal standard 640x480 resolution
        await track.applyConstraints({
          width: { ideal: 640 },
          height: { ideal: 480 }
        });
      } catch (fallbackErr) {
        console.warn("[Compatibility] Fallback constraints also failed:", fallbackErr.message);
      }
    }
  }
}

/**
 * Safely sets RTCRtpSender encoding parameters, filtering out unsupported parameters.
 * 
 * @param {RTCRtpSender} sender - The WebRTC track sender
 * @param {object} options - maxBitrate and scaleResolutionDownBy values
 */
export async function applySenderParametersSafely(sender, options = {}) {
  if (!sender || !sender.track) return;

  const browser = detectBrowser();
  
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }

    const encoding = params.encodings[0];

    // 1. Bitrate Capping: Supported globally
    if (options.maxBitrate !== undefined) {
      encoding.maxBitrate = options.maxBitrate;
    }

    // 2. Resolution Downscaling
    if (options.scaleResolutionDownBy !== undefined) {
      // Firefox does not support scaleResolutionDownBy for H.264/VP8 reliably;
      // it can throw errors or result in a silent failure depending on version.
      if (browser.isFirefox) {
        console.log("[Compatibility] Firefox detected — skipping scaleResolutionDownBy parameter.");
        delete encoding.scaleResolutionDownBy;
      } else {
        // Enforce valid scale factor (must be >= 1.0)
        encoding.scaleResolutionDownBy = Math.max(1.0, options.scaleResolutionDownBy);
      }
    }

    // Safari on iOS sometimes complains if we send empty encodings parameter updates
    await sender.setParameters(params);
    console.log(`[Compatibility] Successfully applied sender parameters on ${browser.name}.`);
  } catch (err) {
    console.warn(`[Compatibility] setParameters failed on ${browser.name}:`, err.message || err);
  }
}

/**
 * Detects whether hardware video encoding is supported by the platform/browser using WebCodecs.
 * 
 * @returns {Promise<boolean>} True if hardware accelerated encoding is supported
 */
export async function checkHardwareEncoderSupport() {
  if (typeof window.VideoEncoder === "undefined") {
    // If WebCodecs is not supported (e.g. Firefox), assume true as a fallback but do not cap aggressively.
    return true;
  }

  try {
    const h264Config = {
      codec: "avc1.42001f", // H.264 Baseline Profile (standard WebRTC codec)
      width: 1280,
      height: 720,
      bitrate: 1500000,
      framerate: 30,
      hardwareAcceleration: "prefer-hardware"
    };
    const result = await window.VideoEncoder.isConfigSupported(h264Config);
    return !!result.supported;
  } catch (err) {
    console.warn("[Compatibility] WebCodecs hardware check threw exception:", err.message);
    return true; // Fallback to true to avoid over-throttling healthy devices
  }
}
