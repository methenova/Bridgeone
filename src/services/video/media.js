export async function getLocalStream(deviceId = "") {
    const constraints = {
        video: deviceId
            ? {
                deviceId: {
                    exact: deviceId,
                },
            }
            : true,
        audio: true,
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