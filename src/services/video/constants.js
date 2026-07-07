// Metered.ca TURN server configuration
const METERED_DOMAIN = "digimirai.metered.live";
const METERED_API_KEY = "tlCVDQNIdmroTNQ0PHk4w3l-iYSrz_nOM0GFlwZBAnNOB7Jz";

// Base config with STUN only (TURN credentials are fetched dynamically)
export const RTC_CONFIGURATION = {
    iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            ],
        },
        // TURN servers with Metered.ca
        {
            urls: `turn:${METERED_DOMAIN}:80`,
            username: "guest",
            credential: "guest",
        },
        {
            urls: `turn:${METERED_DOMAIN}:80?transport=tcp`,
            username: "guest",
            credential: "guest",
        },
        {
            urls: `turn:${METERED_DOMAIN}:443?transport=tcp`,
            username: "guest",
            credential: "guest",
        },
        {
            urls: `turns:${METERED_DOMAIN}:443?transport=tcp`,
            username: "guest",
            credential: "guest",
        },
    ],
};

/**
 * Fetch fresh TURN credentials from Metered.ca API.
 * Returns a full RTCConfiguration with working iceServers.
 */
export async function fetchTurnConfig() {
    try {
        const response = await fetch(
            `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
        );
        if (!response.ok) throw new Error(`Metered API returned ${response.status}`);

        const iceServers = await response.json();
        console.log("[TURN] Fetched fresh credentials from Metered.ca:", iceServers.length, "servers");

        return {
            iceServers: [
                // Keep Google STUN
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                    ],
                },
                // Add Metered TURN servers with fresh credentials
                ...iceServers,
            ],
        };
    } catch (err) {
        console.warn("[TURN] Failed to fetch Metered credentials, using fallback:", err.message);
        return RTC_CONFIGURATION;
    }
}

export const ROOM_STATUS = {
    WAITING: "waiting",
    LIVE: "live",
    ENDED: "ended",
};