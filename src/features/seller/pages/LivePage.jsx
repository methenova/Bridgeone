import { useState, useEffect, useRef } from "react";
import { Radio, Video, VideoOff, ShoppingBag, Eye, Send, StopCircle, Phone, PhoneOff, Mic, MicOff, Check, X } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";
import { useProducts } from "../hooks/useProducts";
import { useAuthContext } from "@/context/AuthContext";
import { SellerPeer } from "@/services/video/sellerPeer";
import { ViewerPeer } from "@/services/video/viewerPeer";

export default function LivePage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;
  const { user } = useAuthContext();

  // Products for pinning
  const { data: productData } = useProducts(shopId, { limit: 50 });
  const products = productData?.products ?? [];

  // Stream state
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [pinnedProduct, setPinnedProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [viewers, setViewers] = useState(0);
  const [hearts, setHearts] = useState([]); // floating animations

  // Consultation states (1-on-1 Call)
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(false);
  const [callRemoteStream, setCallRemoteStream] = useState(null);
  const [callMicMuted, setCallMicMuted] = useState(false);
  const [callCamEnabled, setCallCamEnabled] = useState(true);     // camera on/off for consultation
  const [consultationDuration, setConsultationDuration] = useState(0);  // seconds
  const [consultationIceState, setConsultationIceState] = useState(null); // RTCIceConnectionState

  // Viewer Speaker join states
  const [joinRequests, setJoinRequests] = useState([]);
  const [connectedViewerStream, setConnectedViewerStream] = useState(null);

  const videoRef = useRef(null);
  const channelRef = useRef(null);
  const sellerPeerRef = useRef(null);
  const viewerPeerRef = useRef(null);         // Ref for 1-on-1 consultation peer
  const incomingCallRef = useRef(null);        // Ref mirror of incomingCall for stable callbacks
  const isAcceptingRef = useRef(false);        // Guard against duplicate handleAcceptCall executions
  const consultationStreamRef = useRef(null);  // The stream used in consultation (may differ from live stream)
  const consultationOwnedStream = useRef(false); // true if we acquired stream for consultation (not live)
  const consultationTimerRef = useRef(null);   // Interval for call duration counter

  // Load available camera devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedVideo(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Error loading camera devices", err);
      }
    }
    getDevices();
  }, []);

  // Clean up WebRTC peers and consultation timer on unmount
  useEffect(() => {
    return () => {
      if (sellerPeerRef.current) sellerPeerRef.current.destroy();
      if (viewerPeerRef.current) viewerPeerRef.current.destroy();
      clearInterval(consultationTimerRef.current);
      if (consultationOwnedStream.current && consultationStreamRef.current) {
        consultationStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Keep incomingCallRef in sync with state (for stable callbacks that don't need re-subscribe)
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // Subscribe to incoming 1-on-1 consultation video call rooms
  // NOTE: incomingCall removed from deps intentionally — use incomingCallRef inside callbacks
  // to avoid re-subscribing (which caused duplicate INSERT events firing handleAcceptCall 3x)
  useEffect(() => {
    if (!shopId) return;

    console.log("[LivePage] Listening for incoming video calls for shop ID:", shopId);
    const callChannel = supabase
      .channel(`shop-calls-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_rooms",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          const room = payload.new;
          // An incoming call starts with 'call_'
          if (room.room_code.startsWith("call_") && room.status === "live") {
            // Ignore if we already have this call pending
            if (incomingCallRef.current?.id === room.id) return;
            console.log("[LivePage] Incoming call room detected:", room);
            setIncomingCall(room);
            toast.success("Incoming video consultation request!", { duration: 6000 });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "video_rooms",
        },
        (payload) => {
          // Use ref so this callback always sees the latest incomingCall
          if (incomingCallRef.current && payload.old.id === incomingCallRef.current.id) {
            console.log("[LivePage] Incoming call cancelled by caller");
            setIncomingCall(null);
            incomingCallRef.current = null;
            toast.dismiss();
          }
        }
      )
      .subscribe();

    return () => {
      callChannel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  // Request webcam stream when live starts
  async function startStream() {
    const constraints = {
      video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
      audio: true,
    };
    let mediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (mediaErr) {
      if (mediaErr.name === "NotReadableError" || mediaErr.name === "TrackStartError") {
        console.warn("[LivePage] Webcam already in use, falling back to audio-only stream.");
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
      } else {
        throw mediaErr;
      }
    }
    setStream(mediaStream);
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
    return mediaStream;
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  // Handle Supabase Realtime broadcast channels
  useEffect(() => {
    if (!shopId) return;

    // Connect to live channel
    const channel = supabase.channel(`live:${shopId}`, {
      config: { broadcast: { self: true } },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        setComments((prev) => [...prev, payload]);
      })
      .on("broadcast", { event: "reaction" }, () => {
        triggerFloatingHeart();
      })
      .on("broadcast", { event: "request_to_join" }, ({ payload }) => {
        console.log("[LivePage] Viewer request to join stream received:", payload);
        // Avoid duplicate requests
        setJoinRequests((prev) => {
          if (prev.some((r) => r.senderId === payload.senderId)) return prev;
          return [...prev, payload];
        });
        toast(`${payload.senderName} wants to join as speaker!`, { icon: "🎤" });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [shopId]);

  // Simulate viewer counts changing
  useEffect(() => {
    if (!isLive) {
      setViewers(0);
      return;
    }
    setViewers(Math.floor(Math.random() * 50) + 15);
    const timer = setInterval(() => {
      setViewers((v) => Math.max(10, v + Math.floor(Math.random() * 7) - 3));
    }, 5000);

    return () => clearInterval(timer);
  }, [isLive]);

  async function handleToggleLive() {
    if (isLive) {
      // End live
      if (sellerPeerRef.current) {
        await sellerPeerRef.current.destroy();
        sellerPeerRef.current = null;
      }
      stopStream();
      setIsLive(false);
      setPinnedProduct(null);
      setConnectedViewerStream(null);
      await supabase.from("shops").update({ is_live: false }).eq("id", shopId);
      toast.success("Stream ended");
    } else {
      // Go live
      try {
        const mediaStream = await startStream();
        
        console.log("[LivePage] Initializing SellerPeer for shop:", shopId);
        const peer = new SellerPeer(shopId, user?.id, mediaStream);
        sellerPeerRef.current = peer;
        await peer.start();

        setIsLive(true);
        await supabase.from("shops").update({ is_live: true }).eq("id", shopId);
        toast.success("You are now live!");
      } catch (err) {
        console.error("Failed to start live stream:", err);
        toast.error("Failed to start live stream: " + err.message);
        if (sellerPeerRef.current) {
          await sellerPeerRef.current.destroy();
          sellerPeerRef.current = null;
        }
        stopStream();
      }
    }
  }

  // Answer 1-on-1 video call from Customer
  async function handleAcceptCall() {
    if (!incomingCall) return;
    // Guard: prevent double-execution if button clicked rapidly or effect fires twice
    if (isAcceptingRef.current) return;
    isAcceptingRef.current = true;

    try {
      console.log("[LivePage] Accept call room code:", incomingCall.room_code);

      // Obtain media (reuse live stream if available, else acquire new)
      let callStream = stream;
      if (!callStream) {
        toast.loading("Activating camera for call...", { id: "call-media" });
        try {
          callStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (mediaErr) {
          if (mediaErr.name === "NotReadableError" || mediaErr.name === "TrackStartError") {
            console.warn("[LivePage] Webcam busy, falling back to audio-only.");
            toast.success("Webcam in use, starting audio-only consultation.", { id: "call-media" });
            callStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } else {
            throw mediaErr;
          }
        }
        setStream(callStream);
        if (videoRef.current) videoRef.current.srcObject = callStream;
        toast.success("Media activated", { id: "call-media" });
        consultationOwnedStream.current = true;  // Mark: we own this stream, stop it when call ends
      } else {
        consultationOwnedStream.current = false; // Reusing live stream
      }

      consultationStreamRef.current = callStream;

      // Destroy any stale consultation peer
      if (viewerPeerRef.current) {
        console.log("[LivePage] Cleaning up stale ViewerPeer before accepting new call");
        viewerPeerRef.current.destroy();
        viewerPeerRef.current = null;
      }

      // ViewerPeer answers the customer's offer, sending seller's stream back
      const peer = new ViewerPeer(
        incomingCall.room_code,
        (remoteStream) => {
          console.log("[LivePage] Received customer call stream");
          setCallRemoteStream(remoteStream);
        },
        callStream,
        // ICE state callback
        (iceState) => {
          console.log("[LivePage] Consultation ICE state:", iceState);
          setConsultationIceState(iceState);
          if (iceState === "connected" || iceState === "completed") {
            if (!consultationTimerRef.current) {
              consultationTimerRef.current = setInterval(() => {
                setConsultationDuration((d) => d + 1);
              }, 1000);
            }
          }
        }
      );

      viewerPeerRef.current = peer;
      await peer.start();

      setActiveConsultation(true);
      setIncomingCall(null);
      incomingCallRef.current = null;
      setCallMicMuted(false);
      setCallCamEnabled(callStream.getVideoTracks().length > 0);
      setConsultationDuration(0);
      setConsultationIceState(null);
      toast.success("Consultation started!");

    } catch (err) {
      console.error("[LivePage] Call acceptance failed:", err);
      toast.error("Answer call failed: " + err.message, { id: "call-media" });
      handleDeclineCall();
    } finally {
      isAcceptingRef.current = false;
    }
  }

  async function handleDeclineCall() {
    // Destroy peer
    if (viewerPeerRef.current) {
      viewerPeerRef.current.destroy();
      viewerPeerRef.current = null;
    }

    // Stop timer
    clearInterval(consultationTimerRef.current);
    consultationTimerRef.current = null;

    // Delete the room using incomingCallRef (avoids stale state closure bug)
    const callToEnd = incomingCallRef.current;
    if (callToEnd) {
      console.log("[LivePage] Ending/declining call room ID:", callToEnd.id);
      await supabase.from("video_rooms").delete().eq("id", callToEnd.id);
    }

    // If we acquired a new stream just for this consultation, release it
    if (consultationOwnedStream.current && consultationStreamRef.current) {
      consultationStreamRef.current.getTracks().forEach((t) => t.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      consultationOwnedStream.current = false;
    }
    consultationStreamRef.current = null;

    setIncomingCall(null);
    incomingCallRef.current = null;
    setActiveConsultation(false);
    setCallRemoteStream(null);
    setCallMicMuted(false);
    setCallCamEnabled(true);
    setConsultationDuration(0);
    setConsultationIceState(null);
    toast.success("Call ended");
  }

  function toggleCallMic() {
    // Toggle audio on the consultation stream specifically
    const consultStream = consultationStreamRef.current;
    if (consultStream) {
      const audioTrack = consultStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallMicMuted(!audioTrack.enabled);
      }
    }
  }

  function toggleCallCamera() {
    // Toggle video on the consultation stream
    const consultStream = consultationStreamRef.current;
    if (consultStream) {
      const videoTrack = consultStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallCamEnabled(videoTrack.enabled);
      }
    }
  }

  // Handle viewer requesting to join the live stream (Speak request)
  function handleApproveSpeak(req) {
    console.log("[LivePage] Approving speak request for viewer:", req.senderId);
    
    // 1. Notify the viewer via realtime broadcast channel
    channelRef.current?.send({
      type: "broadcast",
      event: "approve_join",
      payload: { viewerId: req.senderId },
    });

    // 2. Remove request from list
    setJoinRequests((prev) => prev.filter((r) => r.senderId !== req.senderId));
    toast.success(`Approved speaking request for ${req.senderName}`);

    // 3. Attach remote track callback and trigger WebRTC renegotiation on the main seller peer
    if (sellerPeerRef.current) {
      sellerPeerRef.current.onRemoteStream = (remoteStream) => {
        console.log("[LivePage] Connected remote speaker stream");
        setConnectedViewerStream(remoteStream);
      };

      // Delay briefly to allow the viewer to attach media and renegotiate
      setTimeout(async () => {
        try {
          await sellerPeerRef.current.renegotiate();
        } catch (e) {
          console.error("[LivePage] Renegotiation error during speak approval:", e);
        }
      }, 2000);
    }
  }

  function handleDeclineSpeak(req) {
    setJoinRequests((prev) => prev.filter((r) => r.senderId !== req.senderId));
  }

  async function handlePinProduct(prod) {
    if (pinnedProduct?.id === prod.id) {
      setPinnedProduct(null);
      channelRef.current?.send({
        type: "broadcast",
        event: "pin",
        payload: { product: null },
      });
      toast.success("Product unpinned");
    } else {
      setPinnedProduct(prod);
      channelRef.current?.send({
        type: "broadcast",
        event: "pin",
        payload: { product: prod },
      });
      toast.success(`${prod.name} pinned to stream!`);
    }
  }

  function handleSendComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    const payload = {
      id: Math.random().toString(),
      sender: "Shop Owner",
      text: commentText.trim(),
    };

    channelRef.current?.send({
      type: "broadcast",
      event: "chat",
      payload,
    });

    setCommentText("");
  }

  function triggerFloatingHeart() {
    const id = Math.random();
    setHearts((prev) => [...prev, { id, left: Math.floor(Math.random() * 40) + 30 }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  }

  if (shopLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          ⚠️
        </div>
        <h3 className="text-xl font-semibold text-white">No Shop Found</h3>
        <p className="mt-2 text-slate-400 max-w-sm">
          Please create a shop first to activate live video selling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Radio className={isLive ? "text-red-500 animate-pulse" : "text-slate-400"} />
            Live Selling
          </h1>
          <p className="mt-1 text-slate-400">Stream video, pin items, and chat with shoppers in real time.</p>
        </div>
        <button
          onClick={handleToggleLive}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
            isLive
              ? "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/10"
              : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/10"
          }`}
        >
          {isLive ? <StopCircle className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          {isLive ? "End Stream" : "Go Live"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle: Live Video + Pinned Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl border border-slate-900 bg-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Real video preview */}
            {stream ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
                {connectedViewerStream && (
                  <div className="absolute bottom-4 right-4 h-32 aspect-video rounded-2xl overflow-hidden border-2 border-blue-500 bg-slate-955 shadow-2xl z-20 animate-fade-in">
                    <video
                      ref={(el) => {
                        if (el) el.srcObject = connectedViewerStream;
                      }}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-blue-600/90 text-[8px] font-bold text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                      Speaker
                    </div>
                  </div>
                )}
              </div>
            ) : isLive ? (
              /* Fallback visualizer when camera permission denied but live stream is active */
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-end gap-1.5 h-16">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 bg-blue-500 rounded-full animate-bounce"
                      style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Broadcasting fallbacks</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <Video className="h-12 w-12" />
                <p className="text-sm font-semibold">Camera is offline</p>
              </div>
            )}

            {/* Float Emojis Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {hearts.map((h) => (
                <div
                  key={h.id}
                  className="absolute bottom-4 flex flex-col items-center text-red-500 text-3xl animate-float-heart"
                  style={{ left: `${h.left}%` }}
                >
                  ❤️
                </div>
              ))}
            </div>

            {/* Stream Stats Overlay */}
            {isLive && (
              <div className="absolute left-4 top-4 flex items-center gap-3 z-15">
                <span className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white uppercase animate-pulse">
                  Live
                </span>
                <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-slate-300">
                  <Eye className="h-3.5 w-3.5" /> {viewers}
                </span>
              </div>
            )}

            {/* Pinned Product Overlay Card */}
            {pinnedProduct && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-4 z-15">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                    {pinnedProduct.thumbnail_url && (
                      <img src={pinnedProduct.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Pinned Product</p>
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{pinnedProduct.name}</p>
                    <p className="text-xs text-slate-300 font-semibold">₹{Number(pinnedProduct.price).toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800/80 px-2.5 py-1 rounded-xl">
                  Pinned Live
                </span>
              </div>
            )}
          </div>

          {/* Join requests queue widget */}
          {joinRequests.length > 0 && (
            <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 animate-pulse">
                🎤 Speak Requests Queue ({joinRequests.length})
              </h4>
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div key={req.senderId} className="flex items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <span className="font-semibold text-white truncate max-w-[120px]">{req.senderName}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproveSpeak(req)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
                        title="Approve to Speak"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeclineSpeak(req)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-850 text-slate-400 hover:text-white transition-colors"
                        title="Dismiss Request"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device selectors */}
          {!isLive && videoDevices.length > 1 && (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
              <Video className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Select Camera:</span>
              <select
                value={selectedVideo}
                onChange={(e) => setSelectedVideo(e.target.value)}
                className="rounded-xl border border-slate-880 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none"
              >
                {videoDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Comments Chat Feed */}
        <div className="rounded-3xl border border-slate-900 bg-slate-900/20 flex flex-col h-[400px] lg:h-auto">
          {/* Header */}
          <div className="border-b border-slate-900 px-5 py-4">
            <h3 className="text-sm font-bold text-white">Live Stream Chat</h3>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-none">
            {comments.map((c) => (
              <div key={c.id} className="text-xs leading-relaxed">
                <span className="font-bold text-blue-400">{c.sender}</span>
                <span className="text-slate-300 ml-1.5">{c.text}</span>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
                <Radio className="h-8 w-8 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold">Stream chat is silent</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Comments from viewers will appear here.</p>
              </div>
            )}
          </div>

          {/* Comment sender form */}
          <form onSubmit={handleSendComment} className="border-t border-slate-900 p-4 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Send live chat comment..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-white outline-none focus:border-blue-500 placeholder-slate-600"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Pinned Product Selector Feed */}
      <div className="rounded-3xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
          <ShoppingBag className="h-4 w-4 text-blue-400" />
          Stream Products Showcase
        </h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => {
            const isPinned = pinnedProduct?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handlePinProduct(p)}
                className={`cursor-pointer rounded-2xl border p-3 flex flex-col items-center text-center transition-all ${
                  isPinned
                    ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30"
                    : "border-slate-850 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-850 border border-slate-800 mb-3 flex items-center justify-center shrink-0">
                  {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" /> : "📦"}
                </div>
                <p className="line-clamp-1 text-xs font-semibold text-white w-full">{p.name}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">₹{Number(p.price).toLocaleString()}</p>
                
                <button
                  onClick={(e) => { e.stopPropagation(); handlePinProduct(p); }}
                  className={`mt-3 w-full rounded-lg py-1.5 text-[10px] font-bold transition-all ${
                    isPinned
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {isPinned ? "Pinned" : "Pin Product"}
                </button>
              </div>
            );
          })}
          {products.length === 0 && (
            <p className="text-xs text-slate-500 py-6 col-span-full text-center">Add products to your shop first.</p>
          )}
        </div>
      </div>

      {/* 1-on-1 Incoming Call Dialog */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-850 bg-slate-950 p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/10 text-blue-500 animate-bounce">
              <Phone className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Incoming Consultation Call</h3>
              <p className="text-xs text-slate-400">A customer is requesting a 1-on-1 video call consultation.</p>
            </div>
            <div className="flex w-full gap-3">
              <button
                onClick={handleDeclineCall}
                className="flex-1 rounded-xl bg-slate-900 border border-slate-800 py-3 text-xs font-bold text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptCall}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/10 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-on-1 Consultation Call Overlay Modal */}
      {activeConsultation && (() => {
        const isConsultConnected = consultationIceState === "connected" || consultationIceState === "completed";
        const consultStatusColor = isConsultConnected ? "green" : (!consultationIceState || consultationIceState === "new" || consultationIceState === "checking") ? "amber" : "red";
        const formatDur = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-2xl h-[480px] sm:h-auto sm:aspect-video rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">

              {/* Status Badge (top-left) */}
              <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${consultStatusColor === "green" ? "bg-green-400" : consultStatusColor === "red" ? "bg-red-400" : "bg-amber-400"}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${consultStatusColor === "green" ? "bg-green-500" : consultStatusColor === "red" ? "bg-red-500" : "bg-amber-500"}`} />
                </span>
                <span>1-on-1 Consultation</span>
                {isConsultConnected && consultationDuration > 0 && (
                  <span className="font-mono tabular-nums text-slate-300 ml-1">{formatDur(consultationDuration)}</span>
                )}
              </div>

              {/* Remote/Main Video Panel */}
              <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {callRemoteStream ? (
                  <video
                    ref={(el) => { if (el) el.srcObject = callRemoteStream; }}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30">
                        <Video className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-300">Waiting for customer stream...</p>
                      <p className="text-xs text-slate-500">Establishing bidirectional secure connection</p>
                    </div>
                  </div>
                )}

                {/* PiP — Seller's own camera */}
                {consultationStreamRef.current && (
                  <div className="absolute bottom-4 right-4 h-28 aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl z-10">
                    <video
                      ref={(el) => { if (el) el.srcObject = consultationStreamRef.current; }}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-cover scale-x-[-1] transition-opacity ${callCamEnabled ? "opacity-100" : "opacity-0"}`}
                    />
                    {!callCamEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                        <VideoOff className="h-5 w-5 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1.5 text-[7px] font-bold text-white/60 uppercase tracking-wide">You</div>
                  </div>
                )}
              </div>

              {/* Controls Bar */}
              <div className="border-t border-slate-800 px-6 py-4 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center gap-3 z-20">
                {/* Mic toggle */}
                <button
                  onClick={toggleCallMic}
                  title={callMicMuted ? "Unmute" : "Mute mic"}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:scale-105 active:scale-95 border ${
                    callMicMuted
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/20 hover:bg-rose-500/30"
                      : "bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700"
                  }`}
                >
                  {callMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Camera toggle */}
                <button
                  onClick={toggleCallCamera}
                  title={callCamEnabled ? "Turn off camera" : "Turn on camera"}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:scale-105 active:scale-95 border ${
                    !callCamEnabled
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/20 hover:bg-rose-500/30"
                      : "bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700"
                  }`}
                >
                  {callCamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>

                {/* End call */}
                <button
                  onClick={handleDeclineCall}
                  title="End consultation"
                  className="flex h-11 px-6 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 transition-all text-white font-bold text-xs"
                >
                  <PhoneOff className="h-4.5 w-4.5" />
                  <span>End Call</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
