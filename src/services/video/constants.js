export const RTC_CONFIGURATION = {
    iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            ],
        },
    ],
};

export const ROOM_STATUS = {
    WAITING: "waiting",
    LIVE: "live",
    ENDED: "ended",
};