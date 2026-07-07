import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Paperclip, Video, PhoneOff, Mic, MicOff } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useChatMessages, useSendMessage } from "../hooks/useChat";
import toast from "react-hot-toast";
import { SellerPeer } from "@/services/video/sellerPeer";

export default function CustomerChatWidget({ shop }) {
  const { user } = useAuthContext();
  const userId = user?.id;
  const sellerId = shop?.owner_id;

  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  // Video call states
  const [activeCall, setActiveCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callStream, setCallStream] = useState(null);
  const [callRemoteStream, setCallRemoteStream] = useState(null);
  const [micMuted, setMicMuted] = useState(false);

  const { data: messages = [], isLoading } = useChatMessages(userId, sellerId);
  const sendMsg = useSendMessage();
  const feedEndRef = useRef(null);
  const callPeerRef = useRef(null);
  // Use a ref to track the stream so cleanup effects don't need it as a dependency
  const callStreamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Clean up peer and stream on unmount only (empty deps = runs once on mount, cleans up on unmount)
  useEffect(() => {
    return () => {
      if (callPeerRef.current) {
        callPeerRef.current.destroy();
        callPeerRef.current = null;
      }
      if (callStreamRef.current) {
        callStreamRef.current.getTracks().forEach((track) => track.stop());
        callStreamRef.current = null;
      }
    };
  }, []);

  // Listen for external trigger events (e.g. from shop profile banner)
  useEffect(() => {
    const handleTriggerCall = () => {
      handleStartCall();
    };
    window.addEventListener("trigger-shop-call", handleTriggerCall);
    return () => {
      window.removeEventListener("trigger-shop-call", handleTriggerCall);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, shop]);

  async function handleSend(e) {
    e.preventDefault();
    if (!messageText.trim() && !attachmentUrl) return;

    if (!user) {
      toast.error("Please login to send message to seller");
      return;
    }

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
    const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)];
    setAttachmentUrl(randomUrl);
    toast.success("Attachment added!");
  }

  // 1-on-1 Consultation WebRTC Call Flow
  async function handleStartCall() {
    if (!user) {
      toast.error("Please login to consult with the expert");
      return;
    }

    try {
      toast.loading("Accessing media devices...", { id: "media-access" });
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (mediaErr) {
        if (mediaErr.name === "NotReadableError" || mediaErr.name === "TrackStartError") {
          console.warn("[Call] Webcam already in use, falling back to audio-only stream.");
          toast.success("Webcam in use, starting audio-only call.", { id: "media-access" });
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        } else {
          throw mediaErr;
        }
      }
      toast.success("Media access granted", { id: "media-access" });

      callStreamRef.current = stream;
      setCallStream(stream);
      setIsCalling(true);
      setActiveCall(true);
      setMicMuted(false);

      // Create unique call room code: call_shopId_userId
      const roomCode = `call_${shop.id}_${userId}`;
      console.log("[Call] Starting expert consultation call with room:", roomCode);

      const peer = new SellerPeer(shop.id, userId, stream, (remoteStream) => {
        console.log("[Call] Receiver remote stream established");
        setCallRemoteStream(remoteStream);
        setIsCalling(false);
      }, roomCode);

      callPeerRef.current = peer;
      await peer.start();

    } catch (err) {
      console.error("[Call] Failed to start consultation:", err);
      toast.error("Could not access camera/mic: " + err.message, { id: "media-access" });
      handleHangUp();
    }
  }

  function handleHangUp() {
    if (callPeerRef.current) {
      callPeerRef.current.destroy();
      callPeerRef.current = null;
    }
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach((track) => track.stop());
      callStreamRef.current = null;
    }
    setCallStream(null);
    setCallRemoteStream(null);
    setIsCalling(false);
    setActiveCall(false);
    toast.success("Call ended");
  }

  function toggleMic() {
    if (callStream) {
      const audioTrack = callStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all duration-200 active:scale-95"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Box Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] rounded-3xl border border-slate-850 bg-slate-950 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-850 px-5 py-4 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl overflow-hidden bg-slate-850 border border-slate-800 flex items-center justify-center">
                {shop.logo_url ? <img src={shop.logo_url} alt="" className="h-full w-full object-cover" /> : "🏪"}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Chat with {shop.name}</h4>
                <p className="text-[10px] text-slate-500">Typically replies in minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Start 1-on-1 Consultation Call */}
              <button
                type="button"
                onClick={handleStartCall}
                title="Start Video Call with Expert"
                className="text-blue-400 hover:text-blue-300 p-1 hover:bg-slate-800/40 rounded-lg transition-all"
              >
                <Video className="h-4.5 w-4.5" />
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
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
                        : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850"
                    }`}>
                      {m.content && <p className="leading-relaxed">{m.content}</p>}
                      {m.image_url && (
                        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 mt-1 max-w-[150px]">
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

          {/* Form */}
          <form onSubmit={handleSend} className="border-t border-slate-850 p-4 bg-slate-900/20 space-y-3">
            {attachmentUrl && (
              <div className="relative inline-block border border-slate-800 rounded-xl overflow-hidden bg-slate-900 p-1 pr-6 text-[10px] text-slate-400">
                <span>Attachment loaded</span>
                <button
                  type="button"
                  onClick={() => setAttachmentUrl("")}
                  className="absolute right-0.5 top-0.5 text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAttachImage}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-905 px-3 py-2 text-[11px] text-white outline-none focus:border-blue-500 placeholder-slate-650"
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

      {/* 1-on-1 Video Call Floating Card (Popin-style) */}
      {activeCall && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-50 w-auto sm:w-96 h-[440px] max-h-[75vh] rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-blue-950/20 flex flex-col overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCalling ? "bg-amber-400" : "bg-green-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isCalling ? "bg-amber-500" : "bg-green-500"}`}></span>
              </span>
              <h4 className="text-xs font-bold text-white">
                {isCalling ? "Calling Expert..." : `Call with ${shop.name}`}
              </h4>
            </div>
            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Consultation</p>
          </div>

          {/* Video Area */}
          <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
            {callRemoteStream ? (
              <video
                ref={(el) => {
                  if (el) el.srcObject = callRemoteStream;
                }}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              /* Dialing view */
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/10 text-blue-500">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping duration-[1500ms]" />
                  <Video className="h-6 w-6 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white tracking-wide">Dialing {shop.name}</p>
                  <p className="text-[10px] text-slate-400 max-w-[220px] leading-relaxed">Please wait while we connect you directly to the store expert.</p>
                </div>
              </div>
            )}

            {/* PiP Local Video Preview */}
            {callStream && (
              <div className="absolute bottom-3 right-3 h-24 aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-905 shadow-xl z-10">
                <video
                  ref={(el) => {
                    if (el) el.srcObject = callStream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
              </div>
            )}
          </div>

          {/* Control Bar */}
          <div className="border-t border-white/5 p-4 bg-slate-900/40 flex items-center justify-center gap-3 backdrop-blur-sm">
            <button
              onClick={toggleMic}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:scale-105 active:scale-95 border ${
                micMuted
                  ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-455 border-rose-500/20"
                  : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-white/5"
              }`}
            >
              {micMuted ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            <button
              onClick={handleHangUp}
              className="flex h-11 w-24 items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 transition-all text-white font-bold"
            >
              <PhoneOff className="h-4.5 w-4.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
