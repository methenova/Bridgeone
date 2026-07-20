import { useState, useEffect, useRef } from "react";
import { Radio, Video, VideoOff, ShoppingBag, Eye, Send, StopCircle, Phone, PhoneOff, Mic, MicOff, Check, X, MonitorUp, Maximize, Minimize, Clock, MessageSquare } from "lucide-react";
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

  console.log("[LivePage] Render - shopId:", shopId, "shopLoading:", shopLoading, "user:", user?.email);

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

  // Stream controls & duration states
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamMicMuted, setStreamMicMuted] = useState(false);
  const [streamCamMuted, setStreamCamMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isLive) {
      setStreamDuration(0);
      interval = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setStreamDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  function formatDuration(sec) {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ].filter(Boolean).join(":");
  }

  function handleToggleStreamMic() {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = streamMicMuted;
      });
    }
    setStreamMicMuted(!streamMicMuted);
    toast.success(streamMicMuted ? "Microphone enabled" : "Microphone muted");
  }

  function handleToggleStreamCam() {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = streamCamMuted;
      });
    }
    setStreamCamMuted(!streamCamMuted);
    toast.success(streamCamMuted ? "Camera enabled" : "Camera muted");
  }

  function handleToggleStreamScreenShare() {
    toast.error("Screen sharing placeholder - coming soon!");
  }

  function handleToggleFullscreen() {
    const container = document.getElementById("stream-container");
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  }

  // Handle fullscreen state change from browser controls
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Consultation states (1-on-1 Call)
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(false);
  const [callRemoteStream, setCallRemoteStream] = useState(null);
  const [callMicMuted, setCallMicMuted] = useState(false);
  const [callCamEnabled, setCallCamEnabled] = useState(true);     // camera on/off for consultation
  const [consultationDuration, setConsultationDuration] = useState(0);  // seconds
  const [consultationIceState, setConsultationIceState] = useState(null); // RTCIceConnectionState
  const [callerDetails, setCallerDetails] = useState(null);

  // Custom Call Center states
  const [callNotes, setCallNotes] = useState("");
  const [activeCallTab, setActiveCallTab] = useState("info"); // "info" | "products" | "queue"
  const [agentsList, setAgentsList] = useState([]);
  const [activeCallLogId, setActiveCallLogId] = useState(null);

  // Auto-update agent presence status
  async function updateAgentStatus(newStatus) {
    if (!shopId || !user?.id) return;
    try {
      const isOnline = ["Available", "Busy", "In Call", "Away", "Break", "Meeting"].includes(newStatus);
      await supabase
        .from("shop_agents")
        .update({ status: newStatus, is_online: isOnline })
        .eq("shop_id", shopId)
        .eq("profile_id", user.id);
    } catch (err) {
      console.warn("Failed to automatically update agent status:", err);
    }
  }

  // Fetch agents for call transfers
  useEffect(() => {
    if (activeConsultation && shopId) {
      supabase.from("shop_agents")
        .select(`
          *,
          profiles:profile_id ( full_name )
        `)
        .eq("shop_id", shopId)
        .then(({ data }) => {
          setAgentsList(data || []);
        });
    }
  }, [activeConsultation, shopId]);

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
  const callRemoteVideoRef = useRef(null);     // Ref for remote video element (prevents blink on re-render)
  const callLocalVideoRef = useRef(null);      // Ref for local PiP video element
  const activeCallRoomIdRef = useRef(null);    // Track active call room ID for deletion

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

  // Attach remote stream to video element only when it changes or modal mounts (prevents blinking)
  useEffect(() => {
    if (callRemoteVideoRef.current && callRemoteStream) {
      if (callRemoteVideoRef.current.srcObject !== callRemoteStream) {
        callRemoteVideoRef.current.srcObject = callRemoteStream;
      }
    }
  }, [callRemoteStream, activeConsultation]);

  // Attach local consultation stream to PiP video element
  useEffect(() => {
    if (callLocalVideoRef.current && consultationStreamRef.current) {
      if (callLocalVideoRef.current.srcObject !== consultationStreamRef.current) {
        callLocalVideoRef.current.srcObject = consultationStreamRef.current;
      }
    }
  }, [activeConsultation]);

  // Fetch caller details on incoming call
  useEffect(() => {
    if (!incomingCall) return;

    async function fetchCaller() {
      try {
        // Parse the call log ID embedded in the room code (e.g. call_shopId_logId_random)
        const parts = incomingCall.room_code.split("_");
        const callLogId = parts.length >= 3 ? parts[2] : null;

        if (!callLogId) return;

        const { data, error } = await supabase
          .from("call_logs")
          .select("customer_name, customer_email, customer_phone")
          .eq("id", callLogId)
          .maybeSingle();

        if (error) throw error;
        if (data) setCallerDetails(data);
      } catch (err) {
        console.warn("Failed to fetch caller details:", err);
      }
    }
    fetchCaller();
  }, [incomingCall]);

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

  // Subscribe to both Broadcast events (Chat/Reactions) and Postgres Changes (1-on-1 Call Consultation)
  // under a single unified Supabase channel to avoid socket-level collisions and ensure clean state.
  useEffect(() => {
    if (!shopId) return;

    console.log("[LivePage] Initializing unified Realtime channel for shop ID:", shopId);

    const channel = supabase.channel(`live:${shopId}`, {
      config: { broadcast: { self: true } },
    });

    channelRef.current = channel;

    channel
      // 1. Broadcast Chat Events
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        setComments((prev) => [...prev, payload]);
      })
      // 2. Broadcast Reaction/Heart Events
      .on("broadcast", { event: "reaction" }, () => {
        triggerFloatingHeart();
      })
      // 3. Broadcast Join requests (Shopper wants to speak)
      .on("broadcast", { event: "request_to_join" }, ({ payload }) => {
        console.log("[LivePage] Viewer request to join stream received:", payload);
        setJoinRequests((prev) => {
          if (prev.some((r) => r.senderId === payload.senderId)) return prev;
          return [...prev, payload];
        });
        toast(`${payload.senderName} wants to join as speaker!`, { icon: "🎤" });
      })
      // 3.5. Broadcast Incoming Call ( shopper calling the seller directly for instant popup )
      .on("broadcast", { event: "incoming_call" }, ({ payload }) => {
        const room = payload.room;
        const roomCode = room?.room_key || room?.room_code || "";
        if (room && room.shop_id === shopId && roomCode.startsWith("call_") && (room.status === "waiting" || room.status === "ringing" || room.status === "connected")) {
          if (incomingCallRef.current?.id === room.id) return;
          console.log("[LivePage] Incoming call broadcast received:", room);
          setIncomingCall(room);
          toast.success("Incoming video consultation request!", { duration: 6000 });
        }
      })
      // 4. Postgres INSERT: Detect new incoming consultation calls
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_rooms",
        },
        (payload) => {
          const room = payload.new;
          const roomCode = room?.room_key || room?.room_code || "";
          // Filter by shop_id in JS for robustness
          if (room.shop_id === shopId && roomCode.startsWith("call_") && (room.status === "waiting" || room.status === "ringing" || room.status === "connected")) {
            // Ignore if we already have this call pending
            if (incomingCallRef.current?.id === room.id) return;
            console.log("[LivePage] Incoming call room detected:", room);
            setIncomingCall(room);
            toast.success("Incoming video consultation request!", { duration: 6000 });
          }
        }
      )
      // 5. Postgres DELETE: Detect caller hung up before accept
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
            toast.info("Call cancelled by customer");
            setIncomingCall(null);
          }
        }
      )
      .subscribe();
  }, [shopId]);

  // Secondary Fallback: Poll DB every 3s for any incoming calls that were missed by Realtime
  useEffect(() => {
    if (!shopId) return;

    const pollInterval = setInterval(async () => {
      if (incomingCallRef.current || isAcceptingRef.current) return;

      try {
        const { data: rooms, error } = await supabase
          .from("video_rooms")
          .select("*")
          .eq("shop_id", shopId)
          .in("status", ["waiting", "ringing", "connected"]);

        if (error) throw error;

        if (rooms && rooms.length > 0) {
          // Find the active incoming call (starts with 'call_')
          const callRoom = rooms.find((r) => {
            const roomCode = r.room_key || r.room_code || "";
            if (!roomCode.startsWith("call_")) return false;
            // Ignore if already answered by an agent
            if (r.answer) return false;
            // Filter out calls created more than 60 seconds ago to avoid stale triggers
            const createdTime = new Date(r.created_at).getTime();
            const now = Date.now();
            return (now - createdTime) < 60000;
          });

          if (callRoom) {
            // Avoid duplicate triggers
            if (incomingCallRef.current?.id === callRoom.id) return;
            console.log("[LivePage] Incoming call room detected via polling fallback:", callRoom);
            setIncomingCall(callRoom);
            toast.success("Incoming video consultation request!", { duration: 6000 });
          }
        }
      } catch (err) {
        console.warn("[LivePage] Consultation polling fallback skipped:", err.message);
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [shopId, activeConsultation]);

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

    // Cache the active call room ID so we can clean it up when hanging up
    activeCallRoomIdRef.current = incomingCall.id;

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
      const targetRoomCode = incomingCall.room_key || incomingCall.room_code;
      const peer = new ViewerPeer(
        targetRoomCode,
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

      peer.onRoomDeleted = () => {
        console.log("[LivePage] Room deleted by customer — ending call");
        toast.info("Call ended by customer");
        handleDeclineCall();
      };

      viewerPeerRef.current = peer;
      await peer.start();

      setActiveConsultation(true);
      
      // Link the current agent to this call log
      try {
        const parts = (targetRoomCode || "").split("_");
        const callLogId = parts.length >= 3 ? parts[2] : null;

        if (callLogId) {
          await supabase
            .from("call_logs")
            .update({ agent_id: user.id })
            .eq("id", callLogId);
          setActiveCallLogId(callLogId);
        }
      } catch (logErr) {
        console.warn("Failed to associate agent with call log:", logErr);
      }

      setIncomingCall(null);
      incomingCallRef.current = null;
      setCallMicMuted(false);
      setCallCamEnabled(callStream.getVideoTracks().length > 0);
      setConsultationDuration(0);
      setConsultationIceState(null);
      
      // Auto transition presence to In Call
      await updateAgentStatus("In Call");
      
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
    // If this was an active consultation (call was answered), mark the call_log as completed
    // before destroying the room. This is a safety net so the customer side doesn't accidentally
    // mark it as "missed" due to race conditions.
    if (activeConsultation && activeCallLogId) {
      try {
        await supabase
          .from("call_logs")
          .update({ status: "completed", duration: consultationDuration })
          .eq("id", activeCallLogId);
      } catch (err) {
        console.warn("[LivePage] Failed to mark call as completed:", err);
      }
    }

    // Destroy peer
    if (viewerPeerRef.current) {
      viewerPeerRef.current.destroy();
      viewerPeerRef.current = null;
    }

    // Stop timer
    clearInterval(consultationTimerRef.current);
    consultationTimerRef.current = null;

    // Delete the room using activeCallRoomIdRef or incomingCallRef (avoids stale state closure bug)
    const roomIdToEnd = activeCallRoomIdRef.current || (incomingCallRef.current ? incomingCallRef.current.id : null);
    if (roomIdToEnd) {
      console.log("[LivePage] Ending/declining call room ID:", roomIdToEnd);
      await supabase.from("video_rooms").delete().eq("id", roomIdToEnd);
      activeCallRoomIdRef.current = null;
    }

    // If we acquired a new stream just for this consultation, release it
    if (consultationOwnedStream.current && consultationStreamRef.current) {
      consultationStreamRef.current.getTracks().forEach((t) => t.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      consultationOwnedStream.current = false;
    }
    consultationStreamRef.current = null;

    setActiveCallLogId(null);
    setCallNotes("");
    setIncomingCall(null);
    incomingCallRef.current = null;
    setActiveConsultation(false);
    setCallRemoteStream(null);
    setCallMicMuted(false);
    setCallCamEnabled(true);
    setConsultationDuration(0);
    setConsultationIceState(null);
    
    // Auto transition presence back to Available
    await updateAgentStatus("Available");
    
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

      // Dynamically record this shared product in the active call log database record
      if (activeCallLogId) {
        try {
          const { data: callLog } = await supabase
            .from("call_logs")
            .select("products_shared")
            .eq("id", activeCallLogId)
            .maybeSingle();

          const existingShared = callLog?.products_shared || [];
          if (!existingShared.includes(prod.name)) {
            const updatedShared = [...existingShared, prod.name];
            await supabase
              .from("call_logs")
              .update({ products_shared: updatedShared })
              .eq("id", activeCallLogId);
          }
        } catch (dbErr) {
          console.warn("Failed to append shared product to call log:", dbErr);
        }
      }
    }
  }

  function handleSendComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    const payload = {
      id: Math.random().toString(),
      sender: "Shop Owner",
      text: commentText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    channelRef.current?.send({
      type: "broadcast",
      event: "chat",
      payload,
    });

    setCommentText("");
  }

  function handleQuickReply(text) {
    const payload = {
      id: Math.random().toString(),
      sender: "Shop Owner",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    channelRef.current?.send({
      type: "broadcast",
      event: "chat",
      payload,
    });
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
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 font-semibold">
          ⚠️
        </div>
        <h3 className="text-xl font-semibold text-slate-900">No Shop Found</h3>
        <p className="mt-2 text-slate-500 max-w-sm">
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className={isLive ? "text-red-500 animate-pulse" : "text-slate-500"} />
            Live Selling
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 font-semibold tracking-wide">Stream video, pin items, and chat with shoppers in real time.</p>
        </div>
        <button
          onClick={handleToggleLive}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all shadow-lg active:scale-95 ${
            isLive
              ? "bg-red-600 text-white hover:bg-red-500 shadow-red-600/20"
              : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20"
          }`}
        >
          {isLive ? <StopCircle className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          {isLive ? "End Stream" : "Go Live"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle: Live Video + Pinned Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div id="stream-container" className="relative aspect-video rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-xl flex items-center justify-center group/stream ring-1 ring-slate-200">
            {/* Real video preview */}
            {stream ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${streamCamMuted ? "opacity-0" : "opacity-100"}`}
                />
                {streamCamMuted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-2">
                    <VideoOff className="h-10 w-10 text-slate-605" />
                    <p className="text-sm font-semibold">Camera Feed Paused</p>
                  </div>
                )}
                {connectedViewerStream && (
                  <div className="absolute bottom-4 right-4 h-32 aspect-video rounded-2xl overflow-hidden border-2 border-blue-500 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 shadow-2xl z-20 animate-fade-in">
                    <video
                      ref={(el) => {
                        if (el) el.srcObject = connectedViewerStream;
                      }}
                      autoPlay
                      playsInline className="h-full w-full object-cover"
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
                      key={i} className="w-2.5 bg-blue-500 rounded-full animate-bounce"
                      style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-blue-600 font-semibold font-bold uppercase tracking-widest">Broadcasting fallbacks</p>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 relative overflow-hidden">
                {/* Decorative background grid/gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06)_0%,transparent_75%)]" />
                
                {/* Center Setup Panel */}
                <div className="relative z-10 bg-white shadow-xl rounded-2xl border border-slate-200 p-8 flex flex-col items-center max-w-sm w-full mx-4 space-y-6 text-center">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Broadcaster Ready</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Stream Standby</h3>
                    <p className="text-[10px] text-slate-500 leading-normal">Configure devices and check devices status before launching.</p>
                  </div>

                  {/* Status List */}
                  <div className="grid grid-cols-3 gap-2.5 w-full text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center gap-2">
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Camera Ready</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center gap-2">
                      <Mic className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Microphone Ready</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center gap-2">
                      <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      <span>Internet Status</span>
                    </div>
                  </div>

                  {/* Device selector inline */}
                  {videoDevices.length > 0 && (
                    <div className="w-full space-y-1.5 text-left">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Camera Source</label>
                      <select
                        value={selectedVideo}
                        onChange={(e) => setSelectedVideo(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-100/80 px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer"
                      >
                        {videoDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId} className="bg-white shadow-sm text-slate-900">
                            {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Go Live Action */}
                  <button
                    onClick={handleToggleLive} className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] py-3 text-xs font-bold text-white uppercase tracking-wider transition-all duration-150 shadow-lg shadow-blue-600/30 cursor-pointer shadow-blue-500/10"
                  >
                    <Video className="h-4 w-4" />
                    <span>Start Stream</span>
                  </button>
                </div>
              </div>
            )}

            {/* Float Emojis Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {hearts.map((h) => (
                <div
                  key={h.id} className="absolute bottom-4 flex flex-col items-center text-red-500 text-3xl animate-float-heart"
                  style={{ left: `${h.left}%` }}
                >
                  ❤️
                </div>
              ))}
            </div>

            {/* Active Live Stream Badges Overlay */}
            {isLive && (
              <div className="absolute left-4 top-4 flex items-center gap-2.5 z-20">
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold text-white uppercase animate-pulse shadow-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  <span>Live</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/95 shadow-sm backdrop-blur-sm border border-slate-200 px-3 py-1 text-[10px] font-mono font-bold text-slate-900">
                  <Clock className="h-3.5 w-3.5 text-red-400" />
                  <span>{formatDuration(streamDuration)}</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/95 shadow-sm backdrop-blur-sm border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-700">
                  <Eye className="h-3.5 w-3.5 text-blue-400" />
                  <span>{viewers}</span>
                </span>
              </div>
            )}

            {/* Floating Broadcaster Controls Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3.5 bg-white/90 shadow-2xl backdrop-blur-md px-6 py-3 rounded-full border border-white/20 transition-all duration-300 opacity-0 translate-y-4 group-hover/stream:opacity-100 group-hover/stream:translate-y-0">
              <button
                onClick={handleToggleStreamMic}
                title={streamMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 border ${
                  streamMicMuted
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"
                    : "bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
                }`}
              >
                {streamMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                onClick={handleToggleStreamCam}
                title={streamCamMuted ? "Start Camera" : "Stop Camera"}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 border ${
                  streamCamMuted
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"
                    : "bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
                }`}
              >
                {streamCamMuted ? <VideoOff size={16} /> : <Video size={16} />}
              </button>

              <button
                onClick={handleToggleStreamScreenShare}
                title="Share Screen" className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 border bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
              >
                <MonitorUp size={16} />
              </button>

              <div className="h-4 w-px bg-white/15 my-auto mx-1" />

              <button
                onClick={handleToggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 border bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>

            {/* Pinned Product Overlay Card */}
            {pinnedProduct && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 shadow-sm border border-slate-200 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-4 z-15">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                    {pinnedProduct.thumbnail_url && (
                      <img src={pinnedProduct.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Pinned Product</p>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{pinnedProduct.name}</p>
                    <p className="text-xs text-slate-600 font-semibold">₹{Number(pinnedProduct.price).toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-55/80 px-2.5 py-1 rounded-2xl">
                  Pinned Live
                </span>
              </div>
            )}
          </div>

          {/* Join requests queue widget */}
          {joinRequests.length > 0 && (
            <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-600 font-semibold flex items-center gap-1.5 animate-pulse">
                🎤 Speak Requests Queue ({joinRequests.length})
              </h4>
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div key={req.senderId} className="flex items-center justify-between gap-3 bg-white/60 shadow-sm p-2.5 rounded-2xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-900 truncate max-w-[120px]">{req.senderName}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproveSpeak(req)} className="flex h-7 w-7 items-center justify-center rounded-2xl bg-green-600 text-white hover:bg-green-500 transition-colors"
                        title="Approve to Speak"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeclineSpeak(req)} className="flex h-7 w-7 items-center justify-center rounded-2xl bg-slate-850 text-slate-500 hover:text-slate-900 transition-colors"
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

          {/* Removed duplicate selectors */}
        </div>

        {/* Right: Comments Chat Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[400px] lg:h-auto overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 px-5 py-4 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Live Chat</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{comments.length} messages</span>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none bg-slate-50/30">
            {comments.map((c) => {
              const isMe = c.sender === "Shop Owner" || c.sender === "Seller" || c.sender === "Merchant";
              const timeStr = c.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={c.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
                  {/* Sender name & Time */}
                  <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-slate-500">
                    <span className={isMe ? "text-blue-600" : "text-slate-500"}>{c.sender}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-405 font-mono">{timeStr}</span>
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed border ${
                    isMe 
                      ? "bg-blue-600 text-white border-blue-500 rounded-tr-none" 
                      : "bg-white text-slate-800 border-slate-100 rounded-tl-none"
                  }`}>
                    {c.text}
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 border border-blue-100/50 text-blue-600">
                  <MessageSquare className="h-6 w-6 stroke-[1.6]" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white shadow-sm shadow-blue-600/20">💬</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Welcome to Stream Chat</p>
                  <p className="text-[10px] text-slate-505 max-w-[200px] leading-relaxed mx-auto">Broadcasting video is active. Comments from shoppers will stream in here.</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies Row */}
          <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
            {[
              "👋 Wave Hello", 
              "🛍️ View Pinned", 
              "👍 Thanks for joining!", 
              "💬 Drop any questions!"
            ].map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleQuickReply(reply)} className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-150 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 rounded-full px-3 py-1.5 transition-all shrink-0 cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Comment sender form */}
          <form onSubmit={handleSendComment} className="border-t border-slate-100 p-3 bg-white flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type message to stream..." className="flex-1 rounded-xl border border-slate-200 bg-white shadow-xs px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 placeholder-slate-400"
            />
            <button
              type="submit" className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shrink-0 shadow-sm shadow-blue-600/10 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Pinned Product Selector Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShoppingBag className="h-4 w-4 text-blue-600 font-semibold" />
          Stream Products Showcase
        </h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => {
            const isPinned = pinnedProduct?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handlePinProduct(p)}
                className={`group relative cursor-pointer rounded-2xl border p-3 flex flex-col transition-all duration-300 ${
                  isPinned
                    ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
                }`}
              >
                {/* Image Showcase Container */}
                <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 mb-3 flex items-center justify-center shrink-0">
                  {p.thumbnail_url ? (
                    <img 
                      src={p.thumbnail_url} 
                      alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}

                  {/* Featured Badge Overlay */}
                  {p.is_featured && (
                    <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                      ★ Featured
                    </span>
                  )}

                  {/* Stock Badge Overlay */}
                  <span className={`absolute bottom-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-xs border ${
                    p.stock > 0 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                      : "bg-red-50 border-red-100 text-red-700"
                  }`}>
                    {p.stock > 0 ? `${p.stock} In Stock` : "Out of Stock"}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col text-left space-y-1">
                  <p className="line-clamp-1 text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</p>
                  
                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-black text-slate-900">₹{Number(p.price).toLocaleString()}</p>
                    {p.discount_price && Number(p.discount_price) > 0 && (
                      <p className="text-[9px] text-slate-500 line-through">₹{Number(p.discount_price).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                
                {/* Action button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePinProduct(p); }}
                  className={`mt-3 w-full rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isPinned
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/10"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {isPinned ? "Pinned Live" : "Pin Product"}
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
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-100/50 text-blue-500 animate-bounce">
              <Phone className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {callerDetails?.customer_name || "Incoming Consultation Call"}
              </h3>
              <p className="text-xs text-slate-500">
                {callerDetails 
                  ? `${callerDetails.customer_name} is requesting a 1-on-1 video call consultation.` 
                  : "A customer is requesting a 1-on-1 video call consultation."}
              </p>
              {callerDetails?.customer_email && (
                <p className="text-[10px] text-slate-500 font-mono mt-1">{callerDetails.customer_email}</p>
              )}
            </div>
            <div className="flex w-full gap-3">
              <button
                onClick={handleDeclineCall} className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptCall} className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl flex flex-col md:flex-row">
              
              {/* Left Panel: Remote Video Stream (Main Feed) */}
              <div className="flex-1 bg-slate-50 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
                
                {/* Status Badge (top-left) */}
                <div className="absolute left-6 top-6 z-20 flex items-center gap-2.5 rounded-full bg-black/60 backdrop-blur-md px-4 py-2 text-xs font-semibold text-slate-900 border border-white/10 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${consultStatusColor === "green" ? "bg-green-400" : consultStatusColor === "red" ? "bg-red-400" : "bg-amber-400"}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${consultStatusColor === "green" ? "bg-green-500" : consultStatusColor === "red" ? "bg-red-500" : "bg-amber-500"}`} />
                  </span>
                  <span>{callerDetails?.customer_name || "1-on-1 Consultation"}</span>
                  {isConsultConnected && consultationDuration > 0 && (
                    <span className="font-mono tabular-nums text-blue-600 font-semibold ml-1.5 border-l border-white/20 pl-2">{formatDur(consultationDuration)}</span>
                  )}
                </div>

                {callRemoteStream ? (
                  <video
                    ref={callRemoteVideoRef}
                    autoPlay
                    playsInline className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-5 text-center p-8">
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-blue-50 border border-blue-100/50 animate-ping" style={{ animationDuration: "1.5s" }} />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-100/50 border-blue-500/30">
                        <Video className="h-6 w-6 text-blue-600 font-semibold" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-slate-900 tracking-wide">Connecting Consultation Call...</p>
                      <p className="text-xs text-slate-500 font-medium">Establishing direct secure WebRTC connection</p>
                    </div>
                  </div>
                )}

                {/* PiP — Seller's own camera (Self View) */}
                {consultationStreamRef.current && (
                  <div className="absolute top-6 right-6 h-28 sm:h-36 aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 shadow-2xl z-20 hover:scale-105">
                    <video
                      ref={callLocalVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${callCamEnabled ? "opacity-100" : "opacity-0"}`}
                    />
                    {!callCamEnabled && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 text-slate-600 gap-1.5">
                        <VideoOff className="h-5 w-5" />
                        <span className="text-[8px] uppercase tracking-wider font-bold">Cam Off</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2.5 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-[8px] font-bold text-slate-700 uppercase tracking-wide">You</div>
                  </div>
                )}

                {/* Floating Controls Bar (FaceTime Style Overlay) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3.5 bg-black/60 backdrop-blur-md px-6 py-3.5 rounded-full border border-white/10 shadow-2xl shadow-black/80">
                  {/* Mic toggle */}
                  <button
                    onClick={toggleCallMic}
                    title={callMicMuted ? "Unmute Mic" : "Mute Mic"}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 border ${
                      callMicMuted
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"
                        : "bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
                    }`}
                  >
                    {callMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {/* Camera toggle */}
                  <button
                    onClick={toggleCallCamera}
                    title={callCamEnabled ? "Turn off Camera" : "Turn on Camera"}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 border ${
                      !callCamEnabled
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"
                        : "bg-white/10 text-slate-900 border-white/10 hover:bg-white/20"
                    }`}
                  >
                    {callCamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>

                  {/* Divider */}
                  <div className="h-6 w-px bg-white/20 mx-0.5" />

                  {/* End call */}
                  <button
                    onClick={handleDeclineCall}
                    title="End Call" className="flex h-11 px-6 items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 transition-all text-white font-bold text-xs shadow-lg shadow-red-600/30"
                  >
                    <PhoneOff className="h-4 w-4" />
                    <span>End Call</span>
                  </button>
                </div>
              </div>

              {/* Right Panel: Call Center Tabbed Tools (Info, Products, Queue) */}
              <div className="w-full md:w-[22rem] flex flex-col bg-slate-50 text-xs border-t md:border-t-0 border-l border-slate-200 h-1/2 md:h-full">
                
                {/* Tab select bar */}
                <div className="grid grid-cols-3 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-center">
                  <button 
                    onClick={() => setActiveCallTab("info")}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${activeCallTab === "info" ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    Info
                  </button>
                  <button 
                    onClick={() => setActiveCallTab("products")}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${activeCallTab === "products" ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    Recommend
                  </button>
                  <button 
                    onClick={() => setActiveCallTab("queue")}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${activeCallTab === "queue" ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    Queue
                  </button>
                </div>

                {/* Tab content area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none">
                  
                  {/* TAB 1: CUSTOMER INFO, NOTES, AND TRANSFERS */}
                  {activeCallTab === "info" && (
                    <div className="space-y-5">
                      {/* Customer Info Card */}
                      <div className="space-y-2.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Customer Details</span>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm">{callerDetails?.customer_name || "Guest Customer"}</p>
                          <p className="text-slate-500 font-mono text-[10px]">{callerDetails?.customer_email || "No email provided"}</p>
                          <p className="text-slate-455 font-mono text-[10px]">{callerDetails?.customer_phone || "No phone provided"}</p>
                        </div>
                      </div>

                      {/* Quick Notes Form */}
                      <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Quick Consultation Notes</span>
                        <textarea
                          rows={4}
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          placeholder="Jot down notes during consultation..." className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 resize-none text-xs leading-relaxed"
                        />
                        <button
                          onClick={async () => {
                            if (!activeCallLogId) {
                              toast.error("No active call log reference found");
                              return;
                            }
                            try {
                              const { error } = await supabase
                                .from("call_logs")
                                .update({ notes: callNotes })
                                .eq("id", activeCallLogId);
                              if (error) throw error;
                              toast.success("Consultation notes saved successfully!");
                            } catch (err) {
                              toast.error("Failed to save notes to database");
                            }
                          }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-all text-[10px] uppercase tracking-wider cursor-pointer shadow-lg shadow-blue-500/10"
                        >
                          Save Notes
                        </button>
                      </div>

                      {/* Transfer Call Select */}
                      <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Transfer Consultation</span>
                        <div className="flex gap-2">
                          <select className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 outline-none font-semibold text-xs focus:border-blue-500">
                            <option value="">-- Select Active Agent --</option>
                            {agentsList.map(a => (
                              <option key={a.id} value={a.id}>{a.profiles?.full_name || "Team Member"}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => toast.success("Transferring WebRTC peer credentials to team member...")} className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 font-bold text-[10px] uppercase tracking-wider shadow-sm cursor-pointer"
                          >
                            Transfer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRODUCT RECOMMENDATIONS */}
                  {activeCallTab === "products" && (
                    <div className="space-y-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select Product to Share</span>
                      <div className="space-y-2.5">
                        {products.map(p => {
                          const isPinned = pinnedProduct?.id === p.id;
                          return (
                            <div 
                              key={p.id}
                              onClick={() => handlePinProduct(p)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isPinned ? "border-blue-500 bg-blue-500/5" : "border-white/5 bg-slate-50 hover:border-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 border border-white/5 flex items-center justify-center shrink-0">
                                  {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" /> : "📦"}
                                </div>
                                <div className="max-w-[120px]">
                                  <p className="font-bold text-slate-900 truncate text-[10px]">{p.name}</p>
                                  <p className="text-[9px] text-slate-500 font-bold">₹{Number(p.price).toLocaleString()}</p>
                                </div>
                              </div>
                              <button
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                  isPinned ? "bg-blue-600 text-white" : "bg-white shadow-sm border border-white/10 text-slate-450 hover:text-white"
                                }`}
                              >
                                {isPinned ? "Pinned" : "Share"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: WAITING QUEUE & CALLS RECORD */}
                  {activeCallTab === "queue" && (
                    <div className="space-y-4">
                      {/* Queue Card */}
                      <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Call Queue</span>
                        <div className="py-4 text-center text-slate-600 font-bold text-[10px] uppercase">
                          No other callers in queue
                        </div>
                      </div>

                      {/* Connection Health status */}
                      <div className="space-y-2.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs">
                        <span className="text-[10px] font-sans text-slate-500 font-bold uppercase tracking-wider block">Connection status</span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">WebRTC ICE state</span>
                          <span className={`uppercase font-bold ${consultStatusColor === "green" ? "text-emerald-600" : "text-amber-600"}`}>
                            {consultationIceState || "New"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Consult duration</span>
                          <span className="text-slate-900 font-bold">{formatDur(consultationDuration)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
