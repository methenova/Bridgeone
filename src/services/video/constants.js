// Metered.ca TURN server configuration
const METERED_DOMAIN = "digimirai.metered.live";
const METERED_API_KEY = "e8581c6cacd4626e2b067ad5c26c18d12267";

// Static TURN credentials (created via Metered.ca API)
const TURN_USERNAME = "e1c7f977ab3db1021b560100";
const TURN_PASSWORD = "+i+Hu90i1E1lpSk3";

export const RTC_CONFIGURATION = {
    iceServers: [
        // STUN servers
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            ],
        },
        // TURN servers with Metered.ca credentials
        {
            urls: `turn:${METERED_DOMAIN}:80`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD,
        },
        {
            urls: `turn:${METERED_DOMAIN}:80?transport=tcp`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD,
        },
        {
            urls: `turn:${METERED_DOMAIN}:443?transport=tcp`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD,
        },
        {
            urls: `turns:${METERED_DOMAIN}:443?transport=tcp`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD,
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
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                    ],
                },
                ...iceServers,
            ],
        };
    } catch (err) {
        console.warn("[TURN] Failed to fetch dynamic credentials, using static fallback:", err.message);
        return RTC_CONFIGURATION;
    }
}

export const ROOM_STATUS = {
    WAITING: "waiting",
    LIVE: "live",
    ENDED: "ended",
};