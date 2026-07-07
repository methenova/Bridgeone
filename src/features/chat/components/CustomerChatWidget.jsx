import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, Paperclip, Video, VideoOff, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useChatMessages, useSendMessage } from "../hooks/useChat";
import toast from "react-hot-toast";
import { SellerPeer } from "@/services/video/sellerPeer";

// Formats seconds as MM:SS
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Maps RTCIceConnectionState to a human-readable label + color
function getConnectionLabel(iceState) {
  if (!iceState || iceState === "new") return { label: "Calling...", color: "amber" };
  if (iceState === "checking") return { label: "Connecting...", color: "amber" };
  if (iceState === "connected" || iceState === "completed") return { label: "Connected", color: "green" };
  if (iceState === "disconnected") return { label: "Reconnecting...", color: "amber" };
  if (iceState === "failed") return { label: "Connection failed", color: "red" };
  if (iceState === "closed") return { label: "Call ended", color: "red" };
  return { label: "Calling...", color: "amber" };
}

export default function CustomerChatWidget({ shop }) {
  const { user } = useAuthContext();
  const userId = user?.id;
  const sellerId = shop?.owner_id;

  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  // ── Video call states ──────────────────────────────────────────────────────
  const [activeCall, setActiveCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);         // true until remote stream arrives
  const [callStream, setCallStream] = useState(null);         // local stream
  const [callRemoteStream, setCallRemoteStream] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);         // camera on/off
  const [callDuration, setCallDuration] = useState(0);        // seconds since connected
  const [iceState, setIceState] = useState(null);             // RTCIceConnectionState

  const { data: messages = [], isLoading } = useChatMessages(userId, sellerId);
  const sendMsg = useSendMessage();
  const feedEndRef = useRef(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const callPeerRef = useRef(null);
  const callStreamRef = useRef(null);       // mirrors callStream state without causing dep issues
  const isStartingRef = useRef(false);      // synchronous guard (set BEFORE any await)
  const callTimerRef = useRef(null);        // interval for call duration counter

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // ── Cleanup on component unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (callPeerRef.current) {
        callPeerRef.current.destroy();
        callPeerRef.current = null;
      }
      if (callStreamRef.current) {
        callStreamRef.current.getTracks().forEach((t) => t.stop());
        callStreamRef.current = null;
      }
      clearInterval(callTimerRef.current);
    };
  }, []);

  // ── External call trigger (e.g. from shop profile banner) ─────────────────
  useEffect(() => {
    const handler = () => handleStartCall();
    window.addEventListener("trigger-shop-call", handler);
    return () => window.removeEventListener("trigger-shop-call", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, shop]);

  // ── Start duration timer when ICE connects ─────────────────────────────────
  useEffect(() => {
    if (iceState === "connected" || iceState === "completed") {
      if (!callTimerRef.current) {
        callTimerRef.current = setInterval(() => {
          setCallDuration((d) => d + 1);
        }, 1000);
      }
    }
  }, [iceState]);

  // ── Message send ───────────────────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault();
    if (!messageText.trim() && !attachmentUrl) return;
    if (!user) { toast.error("Please login to send message to seller"); return; }
    try {
      await sendMsg.mutateAsync({
        senderId: userId,
        receiverId: sellerId,
        shopId: shop.id,
        content: messageText.trim(),
        imageUrl: attachmentUrl,
      });
      setMessageText("");
      setAttachmentUrl("");
    } catch {
      toast.error("Message log saved locally.");
    }
  }

  function handleAttachImage() {
    const mockUrls = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    ];
    setAttachmentUrl(mockUrls[Math.floor(Math.random() * mockUrls.length)]);
    toast.success("Attachment added!");
  }

  // ── Start 1-on-1 call ──────────────────────────────────────────────────────
  async function handleStartCall() {
    if (!user) { toast.error("Please login to consult with the expert"); return; }

    // Triple guard: state + ref + synchronous lock (blocks during async getUserMedia wait)
    if (activeCall || callPeerRef.current || isStartingRef.current) {
      console.warn("[Call] Call already active or starting — ignoring duplicate trigger");
      return;
    }
    isStartingRef.current = true; // Set BEFORE any await — the true lock

    try {
      toast.loading("Accessing camera & microphone...", { id: "media-access" });

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaErr) {
        if (mediaErr.name === "NotReadableError" || mediaErr.name === "TrackStartError") {
          console.warn("[Call] Webcam busy — falling back to audio-only.");
          toast.success("Webcam in use, starting audio-only call.", { id: "media-access" });
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } else {
          throw mediaErr;
        }
      }
      toast.success("Camera & mic ready", { id: "media-access" });

      callStreamRef.current = stream;
      setCallStream(stream);
      setIsCalling(true);
      setActiveCall(true);
      setMicMuted(false);
      setCamEnabled(stream.getVideoTracks().length > 0);
      setIceState(null);
      setCallDuration(0);

      const roomCode = `call_${shop.id}_${userId}`;
      console.log("[Call] Starting consultation call. Room:", roomCode);

      const peer = new SellerPeer(
        shop.id,
        userId,
        stream,
        // onRemoteStream: remote (seller) stream received
        (remoteStream) => {
          console.log("[Call] Remote stream established");
          setCallRemoteStream(remoteStream);
          setIsCalling(false);
        },
        roomCode,
        // onConnectionStateChange: ICE state updates
        (state) => {
          console.log("[Call] ICE state:", state);
          setIceState(state);
          if (state === "failed") {
            toast.error("Call connection failed. Please retry.");
            handleHangUp();
          }
        }
      );

      callPeerRef.current = peer;
      await peer.start();

    } catch (err) {
      console.error("[Call] Failed to start consultation:", err);
      toast.error("Could not start call: " + err.message, { id: "media-access" });
      handleHangUp();
    } finally {
      isStartingRef.current = false; // Release lock (allows retry on failure)
    }
  }

  // ── Hang up ────────────────────────────────────────────────────────────────
  const handleHangUp = useCallback(() => {
    if (callPeerRef.current) {
      callPeerRef.current.destroy();
      callPeerRef.current = null;
    }
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach((t) => t.stop());
      callStreamRef.current = null;
    }
    clearInterval(callTimerRef.current);
    callTimerRef.current = null;

    setCallStream(null);
    setCallRemoteStream(null);
    setIsCalling(false);
    setActiveCall(false);
    setCamEnabled(true);
    setMicMuted(false);
    setIceState(null);
    setCallDuration(0);
    toast.success("Call ended");
  }, []);

  // ── Mic toggle ─────────────────────────────────────────────────────────────
  function toggleMic() {
    const stream = callStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  }

  // ── Camera toggle ──────────────────────────────────────────────────────────
  function toggleCamera() {
    const stream = callStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamEnabled(videoTrack.enabled);
      }
    }
  }

  // ── Derived UI state ───────────────────────────────────────────────────────
  const isCallActive = activeCall || isStartingRef.current;
  const { label: connLabel, color: connColor } = getConnectionLabel(iceState);
  const isConnected = iceState === "connected" || iceState === "completed";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-40">

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all duration-200 active:scale-95"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Box */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                {shop.logo_url ? <img src={shop.logo_url} alt="" className="h-full w-full object-cover" /> : "🏪"}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Chat with {shop.name}</h4>
                <p className="text-[10px] text-slate-500">Typically replies in minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Video call button — disabled while call is active */}
              <button
                type="button"
                onClick={handleStartCall}
                disabled={isCallActive}
                title={isCallActive ? "Call in progress" : "Start Video Consultation"}
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  isCallActive
                    ? "bg-slate-800/60 text-slate-600 cursor-not-allowed"
                    : "text-blue-400 hover:text-blue-300 hover:bg-slate-800/40 active:scale-95"
                }`}
              >
                {isStartingRef.current && !activeCall ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {/* Active indicator dot */}
                {isCallActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-slate-900" />
                )}
              </button>

              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-none">
            {isLoading ? (
              <p className="text-center text-[10px] text-slate-500 animate-pulse py-8">Loading history...</p>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
                <MessageSquare className="h-8 w-8 mb-1.5 stroke-[1.5]" />
                <p className="text-[11px] font-semibold text-slate-400">No messages yet</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Ask the seller about products, pricing, or shipping.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isOwn = m.sender_id === userId;
                return (
                  <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3 text-[11px] space-y-1 ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800"
                    }`}>
                      {m.content && <p className="leading-relaxed">{m.content}</p>}
                      {m.image_url && (
                        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 mt-1 max-w-[150px]">
                          <img src={m.image_url} alt="" className="object-cover w-full h-auto" />
                        </div>
                      )}
                      <span className={`block text-[8px] text-right mt-1 ${isOwn ? "text-blue-200" : "text-slate-500"}`}>
                        {new Date(m.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Message Form */}
          <form onSubmit={handleSend} className="border-t border-slate-800 p-4 bg-slate-900/20 space-y-3">
            {attachmentUrl && (
              <div className="relative inline-flex items-center border border-slate-700 rounded-xl bg-slate-900 px-2 py-1 text-[10px] text-slate-400 gap-2">
                <span>Attachment ready</span>
                <button type="button" onClick={() => setAttachmentUrl("")} className="text-slate-500 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAttachImage}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] text-white outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 1-on-1 Video Call Floating Card ───────────────────────────────── */}
      {activeCall && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-50 w-auto sm:w-96 h-[460px] max-h-[78vh] rounded-3xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-blue-950/30 flex flex-col overflow-hidden animate-slide-up">

          {/* Call Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              {/* Status indicator */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connColor === "green" ? "bg-green-400" :
                  connColor === "red" ? "bg-red-400" : "bg-amber-400"
                }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  connColor === "green" ? "bg-green-500" :
                  connColor === "red" ? "bg-red-500" : "bg-amber-500"
                }`} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {isConnected ? `In call with ${shop.name}` : connLabel}
                </h4>
                {isConnected && (
                  <p className="text-[10px] text-slate-400 font-mono tabular-nums">{formatDuration(callDuration)}</p>
                )}
              </div>
            </div>
            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Consultation</span>
          </div>

          {/* Video Area */}
          <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
            {callRemoteStream ? (
              <video
                ref={(el) => { if (el) el.srcObject = callRemoteStream; }}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              // Dialing animation
              <div className="flex flex-col items-center gap-5 text-center p-6">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-2 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.5s" }} />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30">
                    <Video className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-white">
                    {isCalling ? `Calling ${shop.name}...` : connLabel}
                  </p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                    Connecting you directly to the store expert
                  </p>
                </div>
              </div>
            )}

            {/* PiP — Local Camera Preview */}
            {callStream && (
              <div className="absolute bottom-3 right-3 h-24 aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-xl z-10">
                <video
                  ref={(el) => { if (el) el.srcObject = callStream; }}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${camEnabled ? "opacity-100" : "opacity-0"}`}
                />
                {!camEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <VideoOff className="h-5 w-5 text-slate-500" />
                  </div>
                )}
                <div className="absolute bottom-1 left-1 text-[7px] font-bold text-white/60 uppercase tracking-wide">You</div>
              </div>
            )}
          </div>

          {/* Control Bar */}
          <div className="border-t border-white/5 px-5 py-4 bg-slate-900/50 flex items-center justify-center gap-3 backdrop-blur-sm">
            {/* Mic */}
            <button
              onClick={toggleMic}
              title={micMuted ? "Unmute" : "Mute"}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:scale-105 active:scale-95 border ${
                micMuted
                  ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/20"
                  : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-white/5"
              }`}
            >
              {micMuted ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            {/* Camera */}
            <button
              onClick={toggleCamera}
              title={camEnabled ? "Turn off camera" : "Turn on camera"}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:scale-105 active:scale-95 border ${
                !camEnabled
                  ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/20"
                  : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-white/5"
              }`}
            >
              {camEnabled ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
            </button>

            {/* Hang up */}
            <button
              onClick={handleHangUp}
              title="End call"
              className="flex h-11 w-24 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 transition-all text-white font-bold text-xs"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
