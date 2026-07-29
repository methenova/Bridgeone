import { supabase } from "@/config/supabase";
import { RTC_CONFIGURATION, fetchTurnConfig } from "./constants";
import { VideoProvider } from "./videoProvider";

/**
 * Tests the connectivity and latency of a single TURN server config.
 * Restricts ICE transport policy to relay to force TURN connection testing.
 * 
 * @param {object} turnConfig - The ICE server configuration
 * @param {number} timeoutMs - Timeout limit for the probe
 * @returns {Promise<{url: string, healthy: boolean, rtt: number}>}
 */
export async function testTurnServerHealth(turnConfig, timeoutMs = 2000) {
    return new Promise((resolve) => {
        let pc = null;
        const timer = setTimeout(() => {
            if (pc) {
                try { pc.close(); } catch (e) {}
            }
            resolve({ url: turnConfig.urls, healthy: false, rtt: timeoutMs });
        }, timeoutMs);

        const startTime = Date.now();
        try {
            pc = new RTCPeerConnection({
                iceServers: [turnConfig],
                iceTransportPolicy: "relay"
            });

            pc.onicecandidate = (event) => {
                if (event.candidate && event.candidate.type === "relay") {
                    const rtt = Date.now() - startTime;
                    clearTimeout(timer);
                    try { pc.close(); } catch (e) {}
                    resolve({ url: turnConfig.urls, healthy: true, rtt });
                }
            };

            // Trigger candidate gathering by generating a local offer
            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .catch(() => {});
        } catch (err) {
            clearTimeout(timer);
            if (pc) {
                try { pc.close(); } catch (e) {}
            }
            resolve({ url: turnConfig.urls, healthy: false, rtt: timeoutMs });
        }
    });
}

/**
 * Probes all TURN servers concurrently, prioritizing healthy and low-latency ones.
 * 
 * @param {Array} baseServers - List of ICE servers
 * @returns {Promise<Array>} Prioritized list of ICE servers
 */
export async function getOptimizedIceServers(baseServers) {
    if (!baseServers || baseServers.length === 0) return [];

    const stunServers = baseServers.filter((s) => {
        if (!s.urls) return false;
        if (Array.isArray(s.urls)) {
            return s.urls.some(url => url.startsWith("stun:"));
        }
        return s.urls.startsWith("stun:");
    });

    const turnServers = baseServers.filter((s) => {
        if (!s.urls) return false;
        if (Array.isArray(s.urls)) {
            return s.urls.some(url => url.startsWith("turn:") || url.startsWith("turns:"));
        }
        return s.urls.startsWith("turn:") || s.urls.startsWith("turns:");
    });

    if (turnServers.length === 0) {
        return baseServers;
    }

    console.log("[TURN Failover] Testing availability of TURN relays:", turnServers.map((s) => s.urls));
    
    try {
        const results = await Promise.all(turnServers.map(s => testTurnServerHealth(s, 2000)));

        const sortedTurns = [...turnServers].sort((a, b) => {
            const resA = results.find(r => r.url === a.urls) || { healthy: false, rtt: 9999 };
            const resB = results.find(r => r.url === b.urls) || { healthy: false, rtt: 9999 };

            if (resA.healthy && !resB.healthy) return -1;
            if (!resA.healthy && resB.healthy) return 1;
            return resA.rtt - resB.rtt;
        });

        console.log("[TURN Failover] Prioritized TURN relay configuration:", sortedTurns.map((s) => s.urls));
        return [...stunServers, ...sortedTurns];
    } catch (err) {
        console.warn("[TURN Failover] Health checking failed, falling back to base configuration:", err.message);
        return baseServers;
    }
}

export async function createPeer() {
    const config = await fetchTurnConfig();
    if (config && config.iceServers) {
        config.iceServers = await getOptimizedIceServers(config.iceServers);
    }
    return new RTCPeerConnection(config);
}

export async function cleanOldRooms(roomCodePrefix) {
    try {
        // Get room ids for this room_key prefix (e.g. call_shopId_userId)
        const { data: rooms } = await supabase
            .from("video_rooms")
            .select("id")
            .like("room_key", `${roomCodePrefix}%`);

        if (rooms && rooms.length > 0) {
            const ids = rooms.map((r) => r.id);
            // Delete candidates for these rooms
            await supabase.from("video_candidates").delete().in("room_id", ids);
            // Delete the rooms themselves
            await supabase.from("video_rooms").delete().in("id", ids);
        }
    } catch (err) {
        console.warn("[webrtcService] cleanOldRooms failed:", err.message);
    }
}

export async function createRoom(roomCode, shopId, sellerId, offer) {
    return VideoProvider.createRoom(roomCode, shopId, sellerId, { offer });
}

export async function updateAnswer(roomCode, answer) {
    return VideoProvider.joinRoom(roomCode, null, { answer });
}

export async function getRoom(roomCode) {
    const { data } = await VideoProvider.joinRoom(roomCode, null);
    return data;
}

export async function deleteRoom(roomId) {
    return VideoProvider.endRoom(roomId);
}


// SCALE-2: Cache the Supabase auth session for the lifetime of the page.
// addCandidate() is called once per ICE candidate — without caching, at 1000
// concurrent sessions × 10 candidates each, this produces 10,000 auth round-trips
// during a mass recovery event. The session is stable for hours (JWT TTL),
// so caching it as a module-level Promise is safe. The Promise is shared across
// all concurrent first calls so only one network request is ever in flight.
let _sessionCache = null;
async function _getSessionCached() {
    if (!_sessionCache) {
        _sessionCache = supabase.auth.getSession().then(({ data }) => data?.session ?? null);
    }
    return _sessionCache;
}

// Invalidate the cache on sign-in/sign-out so the next addCandidate() re-fetches.
supabase.auth.onAuthStateChange(() => { _sessionCache = null; });

export async function addCandidate(roomId, sender, candidate) {
    const session = await _getSessionCached();
    if (!session) {
        const apiKey = window.BridgeOneShopApiKey || window.BridgeOneConfig?.widgetKey || "";
        const shopId = window.BridgeOneShopId || window.BridgeOneConfig?.shopId || "";
        return supabase.functions.invoke("guest-gateway", {
            body: {
                action: "add_candidate",
                shopId,
                apiKey,
                roomId,
                sender,
                candidate,
            }
        });
    }

    // Map sender to enum: "visitor" or "business_member"
    const senderType = (sender === "seller" || sender === "business_member")
        ? "business_member"
        : "visitor";

    return supabase.from("video_candidates").insert({
        room_id: roomId,
        sender_type: senderType,
        candidate,
    });
}

export function optimizeSdp(sdp) {
    if (!sdp) return sdp;
    let lines = sdp.split("\r\n");

    // Find Opus payload type
    let opusPayloadType = null;
    let opusRtpmapIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("a=rtpmap:") && line.toLowerCase().includes("opus/48000")) {
            const match = line.match(/a=rtpmap:(\d+)\s+opus/i);
            if (match) {
                opusPayloadType = match[1];
                opusRtpmapIndex = i;
                break;
            }
        }
    }

    if (opusPayloadType) {
        const fmtpPrefix = `a=fmtp:${opusPayloadType}`;
        const fmtpIndex = lines.findIndex((l) => l.startsWith(fmtpPrefix));
        const fmtpValue = `${fmtpPrefix} maxaveragebitrate=128000;dtx=1;useinbandfec=1`;

        if (fmtpIndex !== -1) {
            // Replace the existing fmtp line in-place
            lines[fmtpIndex] = fmtpValue;
        } else if (opusRtpmapIndex !== -1) {
            // BC-5 FIX: Insert the fmtp line immediately AFTER the a=rtpmap line
            // for the Opus codec, keeping it within the correct m=audio section.
            // Firefox enforces strict SDP attribute ordering per RFC 4566 §6 and
            // will silently discard or reject fmtp lines placed after the m=video
            // section or after a=end-of-candidates. The previous lines.push()
            // fallback could append the line at the very end of the SDP, outside
            // the audio section, causing Firefox to ignore the Opus parameters.
            lines.splice(opusRtpmapIndex + 1, 0, fmtpValue);
        }
    }

    return lines.join("\r\n");
}

/**
 * SEC-4 FIX: Validate and sanitise a remote SDP before passing it to
 * setRemoteDescription(). Defends against SDP injection attacks where a
 * malicious or corrupted SDP is stored in the video_rooms DB row (possible
 * if the video_rooms INSERT RLS is ever bypassed or the DB is compromised).
 *
 * Checks:
 *   - type must be "offer" or "answer" (no exotic types)
 *   - sdp must be a non-empty string
 *   - must start with "v=" (RFC 4566 §5)
 *   - must contain at least one m= section (media description)
 *   - must contain a=ice-ufrag and a=ice-pwd (valid ICE description)
 *   - total SDP length bounded at 64 KB (prevents memory exhaustion)
 *   - strips inline a=candidate lines (redundant with trickle ICE and a
 *     known injection vector for routing media through attacker-controlled relays)
 *
 * @param {{ type: string, sdp: string }} desc - RTCSessionDescriptionInit
 * @returns {{ type: string, sdp: string } | null} Sanitised desc, or null if invalid.
 */
export function validateSdp(desc) {
    if (!desc || typeof desc !== "object") return null;
    const { type, sdp } = desc;

    // Type guard
    if (type !== "offer" && type !== "answer") {
        console.error("[validateSdp] Rejected: invalid type:", type);
        return null;
    }

    // SDP must be a non-empty string
    if (!sdp || typeof sdp !== "string" || sdp.trim().length === 0) {
        console.error("[validateSdp] Rejected: empty or non-string SDP");
        return null;
    }

    // Size guard — 64 KB is ample for any legitimate SDP
    if (sdp.length > 65536) {
        console.error("[validateSdp] Rejected: SDP exceeds 64 KB:", sdp.length);
        return null;
    }

    // Must start with v= (RFC 4566 §5 — session version field is first)
    if (!sdp.trimStart().startsWith("v=")) {
        console.error("[validateSdp] Rejected: SDP does not start with v=");
        return null;
    }

    // Must contain at least one m= section
    if (!/^m=/m.test(sdp)) {
        console.error("[validateSdp] Rejected: SDP contains no m= section");
        return null;
    }

    // Must contain ICE credentials (a=ice-ufrag and a=ice-pwd)
    if (!/^a=ice-ufrag:/m.test(sdp) || !/^a=ice-pwd:/m.test(sdp)) {
        console.error("[validateSdp] Rejected: SDP missing ICE credentials");
        return null;
    }

    // Strip inline a=candidate lines — these are a known injection vector.
    // Legitimate ICE candidates are delivered via trickle ICE (video_candidates table),
    // never embedded in the SDP body itself in this signaling architecture.
    const sanitisedSdp = sdp
        .split("\r\n")
        .filter((line) => !line.startsWith("a=candidate:"))
        .join("\r\n");

    return { type, sdp: sanitisedSdp };
}