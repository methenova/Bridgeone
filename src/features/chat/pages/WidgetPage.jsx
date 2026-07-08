import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Video, VideoOff, PhoneOff, Mic, MicOff, Calendar, User, Mail, Phone, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import { SellerPeer } from "@/services/video/sellerPeer";

export default function WidgetPage() {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Widget flow states: 'form' | 'calling' | 'connected' | 'offline' | 'callback-submitted'
  const [flowState, setFlowState] = useState("form");

  // Caller identity form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Offline callback form
  const [callbackTime, setCallbackTime] = useState("");

  // WebRTC Stream states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [iceState, setIceState] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const currentCallLogIdRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // 1. Fetch Shop details & availability
  useEffect(() => {
    if (!shopId) return;

    async function loadShop() {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("id, name, logo_url, widget_color, is_online")
          .eq("id", shopId)
          .single();

        if (error) throw error;
        setShop(data);
        if (!data.is_online) {
          setFlowState("offline");
        }
      } catch (err) {
        console.error("[Widget] Failed to load shop:", err);
        toast.error("Error loading merchant widget");
      } finally {
        setLoading(false);
      }
    }

    loadShop();

    // Subscribe to shop status changes dynamically
    const shopChannel = supabase
      .channel(`widget-shop-${shopId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shops", filter: `id=eq.${shopId}` },
        (payload) => {
          const updatedShop = payload.new;
          setShop((prev) => ({ ...prev, ...updatedShop }));
          if (updatedShop.is_online) {
            setFlowState((curr) => (curr === "offline" ? "form" : curr));
          } else {
            // Only force offline state if they aren't actively in a call
            setFlowState((curr) => (curr !== "calling" && curr !== "connected" ? "offline" : curr));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shopChannel);
    };
  }, [shopId]);

  // 2. Attach video elements on state changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, flowState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, flowState]);

  // 3. Track call duration
  useEffect(() => {
    if (flowState === "connected") {
      callStartTimeRef.current = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(callTimerRef.current);
  }, [flowState]);

  // 4. Handle Starting Call
  async function handleStartCall(e) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setFlowState("calling");
    toast.loading("Accessing media devices...", { id: "widget-media" });

    let mediaStream = null;
    try {
      // Prompt for camera/mic
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaErr) {
        console.warn("[Widget] Webcam blocked, trying audio only:", mediaErr);
        toast.success("Starting audio-only consultation", { id: "widget-media" });
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      }
      setLocalStream(mediaStream);
      setCamEnabled(mediaStream.getVideoTracks().length > 0);
      toast.success("Devices ready", { id: "widget-media" });
    } catch (err) {
      console.error("[Widget] Media access denied:", err);
      toast.error("Could not access camera or microphone", { id: "widget-media" });
      setFlowState("form");
      return;
    }

    try {
      // 1. Create a Call Log row first (defaults to status 'missed')
      const { data: log, error: logErr } = await supabase
        .from("call_logs")
        .insert({
          shop_id: shopId,
          customer_name: name.trim(),
          customer_email: email.trim() || null,
          customer_phone: phone.trim() || null,
          status: "missed"
        })
        .select()
        .single();

      if (logErr) throw logErr;
      currentCallLogIdRef.current = log.id;

      // 2. Setup Unique Room Code
      const roomCode = `call_${shopId}_guest_${Math.random().toString(36).substring(2, 9)}`;

      // 3. Instantiate SellerPeer (Host of Room)
      const peer = new SellerPeer(
        shopId,
        log.id, // Set the log ID as the caller identifier
        mediaStream,
        // onRemoteStream callback
        (remStream) => {
          console.log("[Widget] Remote stream received");
          setRemoteStream(remStream);
          setFlowState("connected");
        },
        roomCode,
        // onConnectionStateChange callback
        (state) => {
          console.log("[Widget] ICE state:", state);
          setIceState(state);
          if (state === "failed") {
            toast.error("Call connection lost");
            handleHangUp();
          }
        }
      );

      peer.onRoomDeleted = () => {
        console.log("[Widget] Call terminated by seller");
        toast.info("Call ended by seller");
        handleHangUp();
      };

      peerRef.current = peer;
      await peer.start();

    } catch (err) {
      console.error("[Widget] Failed to initialize peer connection:", err);
      toast.error("Call failed to initialize");
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
      setFlowState("form");
    }
  }

  // 5. Handle Hanging Up Call
  async function handleHangUp() {
    // Stop local video tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    // Save final call duration & status in DB
    const logId = currentCallLogIdRef.current;
    if (logId) {
      const finalDuration = callStartTimeRef.current 
        ? Math.round((Date.now() - callStartTimeRef.current) / 1000) 
        : 0;

      try {
        await supabase
          .from("call_logs")
          .update({
            duration: finalDuration,
            status: finalDuration > 0 ? "completed" : "missed"
          })
          .eq("id", logId);
      } catch (err) {
        console.warn("[Widget] Failed to update call log duration:", err);
      }
      currentCallLogIdRef.current = null;
    }

    // Destroy peer session
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Notify parent frame loader to collapse the widget iframe
    window.parent.postMessage("close-widget", "*");

    // Reset flow back to start form
    setFlowState(shop?.is_online ? "form" : "offline");
    setName("");
    setEmail("");
    setPhone("");
    setCallbackTime("");
  }

  // 6. Handle Offline Callback Request
  async function handleScheduleCallback(e) {
    e.preventDefault();
    if (!name.trim() || !callbackTime) {
      toast.error("Please enter your name and callback date/time");
      return;
    }

    try {
      const { error } = await supabase
        .from("callback_requests")
        .insert({
          shop_id: shopId,
          customer_name: name.trim(),
          customer_email: email.trim() || null,
          customer_phone: phone.trim() || null,
          scheduled_time: new Date(callbackTime).toISOString(),
          status: "pending"
        });

      if (error) throw error;
      setFlowState("callback-submitted");
      toast.success("Callback request submitted!");
    } catch (err) {
      console.error("[Widget] Callback submission error:", err);
      toast.error("Failed to request callback. Please retry.");
    }
  }

  // 7. Toggle Mic/Cam controls
  function toggleMic() {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  }

  function toggleCamera() {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamEnabled(videoTrack.enabled);
      }
    }
  }

  // Formatting helpers
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const primaryColor = shop?.widget_color || "#2563eb";

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-blue-500" />
        <span className="mt-3 text-xs uppercase tracking-widest font-bold">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans border border-slate-900 shadow-2xl relative select-none">
      
      {/* Widget Header */}
      <header className="flex items-center justify-between border-b border-slate-900 px-5 py-4 bg-slate-900/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-slate-800 overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
            {shop?.logo_url ? (
              <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Video className="h-4.5 w-4.5 text-slate-500" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">{shop?.name || "Live Consultation"}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${shop?.is_online ? "bg-green-500" : "bg-slate-500"}`} />
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                {shop?.is_online ? "Online Now" : "Offline"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleHangUp}
          className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main Body Flow */}
      <main className="flex-1 overflow-y-auto p-5 flex flex-col relative min-h-0 bg-slate-950">
        
        {/* State A: Calling Form */}
        {flowState === "form" && (
          <form onSubmit={handleStartCall} className="my-auto space-y-5 flex flex-col justify-center">
            <div className="text-center space-y-1.5 mb-2">
              <h2 className="text-lg font-extrabold text-white tracking-wide">Talk to an Expert</h2>
              <p className="text-xs text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                Connect via video consultation call and discuss details live.
              </p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="Email Address (Optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Video className="h-4.5 w-4.5" />
              <span>Start Video Call</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* State B: Dialing/Calling Screen */}
        {flowState === "calling" && (
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
              <div className="absolute inset-2 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.5s" }} />
              <div 
                style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full border"
              >
                <Video style={{ color: primaryColor }} className="h-8 w-8 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-white tracking-wide">Calling Zara Shop...</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {iceState ? `ICE State: ${iceState}` : "Ringing..."}
              </p>
            </div>

            {/* Local Pip Preview (dialing screen) */}
            {localStream && (
              <div className="h-40 w-30 rounded-2xl overflow-hidden border border-slate-900 bg-slate-900/60 shadow-2xl relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            )}

            <button
              onClick={handleHangUp}
              className="rounded-full bg-red-600 hover:bg-red-500 px-6 py-3 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              <PhoneOff className="h-4 w-4" /> Cancel Call
            </button>
          </div>
        )}

        {/* State C: Active/Connected Video Call */}
        {flowState === "connected" && (
          <div className="absolute inset-0 flex flex-col bg-slate-950">
            {/* Full-width Remote Video */}
            <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden min-h-0">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-blue-500" />
                  <p className="text-xs text-slate-500">Awaiting expert stream...</p>
                </div>
              )}

              {/* Float Call Duration Overlay */}
              <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-mono font-bold tabular-nums text-white flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span>{formatDuration(callDuration)}</span>
              </div>

              {/* PiP View (Local Stream) */}
              {localStream && (
                <div className="absolute top-4 right-4 h-28 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl z-20">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${camEnabled ? "opacity-100" : "opacity-0"}`}
                  />
                  {!camEnabled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-600 gap-1.5">
                      <VideoOff className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )}

              {/* Call Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-35 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-2xl">
                {/* Toggle Mic */}
                <button
                  onClick={toggleMic}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 border ${
                    micMuted
                      ? "bg-rose-500/25 text-rose-400 border-rose-500/30 hover:bg-rose-500/35"
                      : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                  }`}
                >
                  {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Toggle Camera */}
                <button
                  onClick={toggleCamera}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 border ${
                    !camEnabled
                      ? "bg-rose-500/25 text-rose-400 border-rose-500/30 hover:bg-rose-500/35"
                      : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                  }`}
                >
                  {camEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>

                <div className="h-4 w-px bg-white/25 mx-0.5" />

                {/* Hang Up */}
                <button
                  onClick={handleHangUp}
                  className="flex h-9 px-4 items-center justify-center gap-1.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors text-white font-bold text-[11px] shadow-lg shadow-red-600/30"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                  <span>End</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* State D: Offline Callback Scheduler */}
        {flowState === "offline" && (
          <form onSubmit={handleScheduleCallback} className="my-auto space-y-5 flex flex-col justify-center">
            <div className="text-center space-y-1.5 mb-2">
              <h2 className="text-lg font-extrabold text-white tracking-wide">Leave a Message</h2>
              <p className="text-xs text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                We are currently offline. Leave your details below to schedule a callback!
              </p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
                />
              </div>

              {/* Scheduled Time */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Calendar className="h-4.5 w-4.5" />
                </span>
                <input
                  required
                  type="datetime-local"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-800 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Calendar className="h-4.5 w-4.5" />
              <span>Schedule Callback</span>
            </button>
          </form>
        )}

        {/* State E: Callback Submitted Success Screen */}
        {flowState === "callback-submitted" && (
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-5 p-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-extrabold text-white tracking-wide">Callback Scheduled</h2>
              <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mx-auto">
                Thank you! We've received your request and our agent will reach out at your requested time.
              </p>
            </div>
            <button
              onClick={handleHangUp}
              className="rounded-xl border border-slate-900 hover:border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold px-6 py-2.5 text-slate-300 hover:text-white transition-colors"
            >
              Close Widget
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
