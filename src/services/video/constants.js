// BridgeOne Custom TURN Server Configuration (Self-Hosted Coturn)
const SERVER_IP = "103.181.22.70";
const TURN_USERNAME = "bridgeoneuser";
const TURN_PASSWORD = "bridgeonepass123";

export const RTC_CONFIGURATION = {
    iceServers: [
        // Google STUN servers
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            ],
        },
        // Self-hosted STUN server
        {
            urls: `stun:${SERVER_IP}:3478`,
        },
        // Self-hosted TURN servers (UDP and TCP)
        {
            urls: `turn:${SERVER_IP}:3478`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD,
        },
        {
            urls: `turn:${SERVER_IP}:3478?transport=tcp`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD,
        },
    ],
};

/**
 * Fetch TURN configuration.
 * Returns the stable self-hosted TURN configuration directly.
 */
export async function fetchTurnConfig() {
    // Return our custom self-hosted TURN configuration directly (avoids third-party API dependencies)
    return RTC_CONFIGURATION;
}

export const ROOM_STATUS = {
    WAITING: "waiting",
    LIVE: "connected",
    ENDED: "ended",
};