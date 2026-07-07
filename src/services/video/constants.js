export const RTC_CONFIGURATION = {
    iceServers: [
        // STUN servers — same network / open NAT
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            ],
        },
        // TURN servers — different networks (Open Relay Project — free)
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ],
};

export const ROOM_STATUS = {
    WAITING: "waiting",
    LIVE: "live",
    ENDED: "ended",
};