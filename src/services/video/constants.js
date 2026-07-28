// STUN configuration fallback
export const STUN_SERVERS = [
    {
        urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
        ],
    }
];

// Available regional TURN servers
export const REGIONAL_TURN_SERVERS = {
    "us-east": [
        {
            urls: "turn:us-east.bridgeone.video:3478",
            username: "bridgeone_us_east",
            credential: "password_us_east_123"
        },
        {
            urls: "turn:us-east.bridgeone.video:3478?transport=tcp",
            username: "bridgeone_us_east",
            credential: "password_us_east_123"
        }
    ],
    "us-west": [
        {
            urls: "turn:us-west.bridgeone.video:3478",
            username: "bridgeone_us_west",
            credential: "password_us_west_123"
        }
    ],
    "eu-central": [
        {
            urls: "turn:eu-central.bridgeone.video:3478",
            username: "bridgeone_eu_central",
            credential: "password_eu_central_123"
        }
    ],
    "ap-south": [
        {
            urls: "turn:ap-south.bridgeone.video:3478",
            username: "bridgeone_ap_south",
            credential: "password_ap_south_123"
        }
    ]
};

import { supabase } from "@/config/supabase";

// Global switch to enable/disable TURN configuration
const ENABLE_TURN = true; 

export function getRegionalIceServers(region = "us-east") {
    const servers = [...STUN_SERVERS];

    if (ENABLE_TURN) {
        const turnServers = REGIONAL_TURN_SERVERS[region] || REGIONAL_TURN_SERVERS["us-east"];
        if (turnServers) {
            servers.push(...turnServers);
        }
    }

    return { iceServers: servers };
}

// SCALE-3: Cache TURN credentials per region. fetchTurnConfig() is called on
// every createPeer() — including every recreateConnection(). At 1000 concurrent
// recreations, 1000 simultaneous Edge Function invocations would saturate the
// cold-start pool. TURN short-lived tokens typically have 1h TTL; caching for
// 30 minutes is safe and reduces Edge Function invocations by ~99% during storms.
const _turnConfigCache = {};
const TURN_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function fetchTurnConfig(region = "us-east") {
    if (!ENABLE_TURN) {
        return {
            iceServers: STUN_SERVERS,
            iceCandidatePoolSize: 10,
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require"
        };
    }

    const now = Date.now();
    const cached = _turnConfigCache[region];
    if (cached && (now - cached.ts) < TURN_CACHE_TTL_MS) {
        return cached.config;
    }

    try {
        const promise = supabase.functions.invoke("get-turn-credentials", {
            body: { region }
        });
        // Store a pending entry immediately so concurrent calls share the same invocation.
        _turnConfigCache[region] = { ts: now, config: promise.then(({ data, error }) => {
            if (error) throw error;
            return {
                iceServers: data.iceServers,
                iceCandidatePoolSize: 10,
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
            };
        }).catch((err) => {
            // On failure, clear the cache so the next call retries.
            delete _turnConfigCache[region];
            console.warn("[TURN] Credential fetch failed, cleared cache:", err.message);
            return {
                iceServers: STUN_SERVERS,
                iceCandidatePoolSize: 10,
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
            };
        })};
        const config = await _turnConfigCache[region].config;
        _turnConfigCache[region] = { ts: now, config };
        return config;
    } catch (err) {
        console.warn("[TURN] Failed to fetch temporary credentials dynamically, falling back to STUN:", err.message);
        return {
            iceServers: STUN_SERVERS,
            iceCandidatePoolSize: 10,
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require"
        };
    }
}

export const RTC_CONFIGURATION = {
    iceServers: STUN_SERVERS,
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require"
};

export const ROOM_STATUS = {
    WAITING: "waiting",
    LIVE: "connected",
    ENDED: "ended",
};