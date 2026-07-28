export async function getLocalStream(deviceId = "") {
    const constraints = {
        video: deviceId
            ? {
                deviceId: {
                    exact: deviceId,
                },
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
            }
            : {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
            },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        },
    };

    return navigator.mediaDevices.getUserMedia(constraints);
}

export function stopStream(stream) {
    if (!stream) return;

    stream.getTracks().forEach((track) => track.stop());
}

export async function getVideoDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return devices.filter((d) => d.kind === "videoinput");
}