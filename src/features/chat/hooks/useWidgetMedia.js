import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Custom Hook for managing WebRTC Audio/Video Media Devices in the Chat Widget.
 */
export function useWidgetMedia() {
  const [localStream, setLocalStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const localStreamRef = useRef(null);

  const initMediaStream = useCallback(async () => {
    // Guard: mediaDevices is undefined in insecure contexts (non-HTTPS) or restricted iframes
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new DOMException(
        "Media devices are unavailable. Please ensure this page is served over HTTPS.",
        "NotSupportedError"
      );
    }

    let mediaStream = null;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (mediaErr) {
      console.warn("[WidgetMedia] Webcam blocked, trying audio only:", mediaErr);
      toast.success("Starting audio-only consultation", { id: "widget-media" });
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    }

    localStreamRef.current = mediaStream;
    setLocalStream(mediaStream);
    setCamEnabled(mediaStream.getVideoTracks().length > 0);
    setMicEnabled(mediaStream.getAudioTracks().length > 0);
    toast.success("Devices ready", { id: "widget-media" });
    return mediaStream;
  }, []);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((t) => { t.enabled = nextState; });
        setMicEnabled(nextState);
      }
    }
  }, []);

  const toggleCam = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((t) => { t.enabled = nextState; });
        setCamEnabled(nextState);
      }
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  return {
    localStream,
    setLocalStream,
    micEnabled,
    camEnabled,
    setCamEnabled,
    setMicEnabled,
    initMediaStream,
    toggleMic,
    toggleCam,
    stopMediaStream
  };
}
