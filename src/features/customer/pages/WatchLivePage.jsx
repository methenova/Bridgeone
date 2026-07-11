import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Radio, Eye, Send, Heart, ArrowLeft, Mic, MicOff, X } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import { Container } from "@/components/common/Container";
import { useShopDetail } from "@/features/customer/hooks/useMarketplaceShops";
import { useAuthContext } from "@/context/AuthContext";
import useCartStore from "@/store/cartStore";
import { ViewerPeer } from "@/services/video/viewerPeer";

export default function WatchLivePage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const addItem = useCartStore((s) => s.addItem);

  const { data: shop, isLoading: shopLoading } = useShopDetail(shopId);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [pinnedProduct, setPinnedProduct] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [hearts, setHearts] = useState([]);

  const channelRef = useRef(null);

  // WebRTC Stream state
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const videoRef = useRef(null);
  const viewerPeerRef = useRef(null);

  // Speak request states
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [viewerLocalStream, setViewerLocalStream] = useState(null);
  const [speakerMicMuted, setSpeakerMicMuted] = useState(false);

  async function initViewerPeer() {
    if (viewerPeerRef.current) {
      viewerPeerRef.current.destroy();
      viewerPeerRef.current = null;
    }
    setRemoteStream(null);
    setStreamError(null);
    setIsConnecting(true);

    try {
      console.log("[WatchLivePage] Initializing ViewerPeer...");
      const peer = new ViewerPeer(shopId, (stream) => {
        console.log("[WatchLivePage] Remote stream callback triggered");
        setRemoteStream(stream);
      });
      viewerPeerRef.current = peer;
      await peer.start();
      setIsConnecting(false);
    } catch (err) {
      console.error("[WatchLivePage] Failed to initialize WebRTC connection:", err);
      setStreamError(err.message);
      setIsConnecting(false);
    }
  }

  function cleanupViewerPeer() {
    if (viewerPeerRef.current) {
      viewerPeerRef.current.destroy();
      viewerPeerRef.current = null;
    }
    if (viewerLocalStream) {
      viewerLocalStream.getTracks().forEach((track) => track.stop());
      setViewerLocalStream(null);
    }
    setRemoteStream(null);
    setIsSpeaker(false);
    setIsRequestPending(false);
  }

  // Subscribe to WebRTC room lifecycle events and initial connection
  useEffect(() => {
    if (!shopId) return;

    // Try initial connection
    initViewerPeer();

    // Listen to video rooms inserts/deletes to update connection state
    const roomChannel = supabase
      .channel(`room-lifecycle-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_rooms",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          console.log("[WatchLivePage] New room inserted:", payload.new);
          initViewerPeer();
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
          if (payload.old && payload.old.shop_id === shopId) {
            console.log("[WatchLivePage] Active room deleted, stopping stream...");
            cleanupViewerPeer();
            setStreamError("Seller went offline");
          }
        }
      )
      .subscribe();

    return () => {
      cleanupViewerPeer();
      roomChannel.unsubscribe();
    };
  }, [shopId]);

  // Set remote stream source
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Subscribe to real-time stream broadcast events
  useEffect(() => {
    if (!shopId) return;

    const channel = supabase.channel(`live:${shopId}`, {
      config: { broadcast: { self: true } },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        setComments((prev) => [...prev, payload]);
      })
      .on("broadcast", { event: "pin" }, ({ payload }) => {
        setPinnedProduct(payload.product);
      })
      .on("broadcast", { event: "reaction" }, () => {
        triggerFloatingHeart();
      })
      .on("broadcast", { event: "approve_join" }, async ({ payload }) => {
        if (payload.viewerId === user?.id) {
          toast.success("Host approved your request to speak! Connecting camera/mic...", { duration: 4000 });
          setIsRequestPending(false);
          setIsSpeaker(true);
          
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            setViewerLocalStream(stream);
            
            if (viewerPeerRef.current) {
              await viewerPeerRef.current.addLocalStream(stream);
            }
          } catch (err) {
            console.error("[WatchLivePage] Failed to capture media for speaker:", err);
            toast.error("Failed to capture local camera/mic: " + err.message);
            setIsSpeaker(false);
          }
        }
      })
      .subscribe();

    // Set initial mock viewers
    setViewers(Math.floor(Math.random() * 40) + 15);

    return () => {
      channel.unsubscribe();
    };
  }, [shopId, user]);

  function triggerFloatingHeart() {
    const id = Math.random();
    setHearts((prev) => [...prev, { id, left: Math.floor(Math.random() * 40) + 30 }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  }

  function handleSendComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    const payload = {
      id: Math.random().toString(),
      sender: user?.email ? user.email.split("@")[0] : "Guest",
      text: commentText.trim(),
    };

    channelRef.current?.send({
      type: "broadcast",
      event: "chat",
      payload,
    });

    setCommentText("");
  }

  function handleRequestSpeak() {
    if (isSpeaker || isRequestPending) return;

    if (!user) {
      toast.error("Please login to request to speak");
      return;
    }

    const senderName = user?.email ? user.email.split("@")[0] : "Guest";
    channelRef.current?.send({
      type: "broadcast",
      event: "request_to_join",
      payload: {
        senderId: user.id,
        senderName,
      },
    });

    setIsRequestPending(true);
    toast.success("Request to speak sent to host!");
  }

  function toggleSpeakerMic() {
    if (viewerLocalStream) {
      const audioTrack = viewerLocalStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setSpeakerMicMuted(!audioTrack.enabled);
      }
    }
  }

  function handleLeaveStage() {
    if (viewerLocalStream) {
      viewerLocalStream.getTracks().forEach((track) => track.stop());
      setViewerLocalStream(null);
    }
    setIsSpeaker(false);
    setIsRequestPending(false);
    toast.success("You left the stage");
    
    // Reset connection to watch-only
    initViewerPeer();
  }

  function handleSendReaction() {
    channelRef.current?.send({
      type: "broadcast",
      event: "reaction",
      payload: {},
    });
  }

  function handleBuyNow() {
    if (!pinnedProduct) return;
    addItem(pinnedProduct);
    toast.success(`${pinnedProduct.name} added to cart!`);
    navigate("/checkout");
  }

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 text-center">
        <p className="text-xl text-slate-900">Shop not found</p>
        <Link to="/shops" className="mt-4 inline-block text-blue-400 underline">
          Browse Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Container>
        
        {/* Back navigation */}
        <Link
          to={`/shops/${shopId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        {/* Page Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200 flex items-center justify-center">
              {shop.logo_url ? <img src={shop.logo_url} alt="" className="h-full w-full object-cover" /> : "🏪"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {shop.name} Live Stream
                <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase animate-pulse">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{shop.city} · {shop.categories?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white shadow-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Eye className="h-4 w-4 text-blue-400" /> {viewers} watching
          </div>
        </div>

        {/* Video stream panel & Chat split */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Stream Player View */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xl flex items-center justify-center">
              
              {/* Real WebRTC video player */}
              {remoteStream ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  {/* PiP Local video feed when viewer is a speaker */}
                  {isSpeaker && viewerLocalStream && (
                    <div className="absolute bottom-4 right-4 h-28 aspect-video rounded-2xl overflow-hidden border-2 border-green-500 bg-white shadow-sm shadow-2xl z-20 animate-fade-in group">
                      <video
                        ref={(el) => {
                          if (el) el.srcObject = viewerLocalStream;
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover scale-x-[-1]"
                      />
                      
                      {/* Floating Speaker Controls (visible on hover) */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={toggleSpeakerMic}
                          className={`p-1.5 rounded-lg transition-colors ${
                            speakerMicMuted
                              ? "bg-red-655 text-slate-900"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-700"
                          }`}
                          title={speakerMicMuted ? "Unmute Mic" : "Mute Mic"}
                        >
                          {speakerMicMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleLeaveStage}
                          className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                          title="Stop Speaking"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="absolute top-1.5 left-1.5 bg-green-600 text-[8px] font-bold text-white px-2 py-0.5 rounded-full">
                        You
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Dynamic visualization canvas representing the active stream or connection status */
                <div className="flex flex-col items-center gap-4 text-center">
                  {isConnecting ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                  ) : (
                    <div className="flex items-end gap-1.5 h-16">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="w-2.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest animate-pulse">
                    {isConnecting
                      ? "Connecting to Live Stream..."
                      : streamError
                      ? streamError
                      : "Live Stream Broadcast Connection"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {isConnecting
                      ? "Establishing peer connection..."
                      : "Video streaming fallback active."}
                  </p>
                </div>
              )}

              {/* Floating Emojis Reaction Layer */}
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

              {/* Pinned Product Overlay Card (Interactive) */}
              {pinnedProduct && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 shadow-sm border border-slate-200 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-4 z-15">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {pinnedProduct.thumbnail_url && (
                        <img src={pinnedProduct.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Featured Product</p>
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{pinnedProduct.name}</p>
                      <p className="text-xs text-slate-700 font-semibold">₹{Number(pinnedProduct.price).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleBuyNow}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors active:scale-95 shrink-0"
                  >
                    Buy Now
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Chat Feed Panel */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col h-[400px] lg:h-auto">
            {/* Header */}
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Live Comments</h3>
              
              <div className="flex gap-2">
                {/* Request to Speak Button */}
                <button
                  type="button"
                  onClick={handleRequestSpeak}
                  title="Request to Speak"
                  className={`flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-xl transition-all active:scale-90 text-[10px] font-bold ${
                    isSpeaker
                      ? "bg-green-600 text-white"
                      : isRequestPending
                      ? "bg-yellow-600/20 text-yellow-500 cursor-default"
                      : "bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  {isSpeaker ? "Speaking" : isRequestPending ? "Pending..." : "Speak"}
                </button>

                {/* Emojis reaction trigger button */}
                <button
                  onClick={handleSendReaction}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                >
                  <Heart className="h-4.5 w-4.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-none">
              {comments.map((c) => (
                <div key={c.id} className="text-xs leading-relaxed">
                  <span className="font-bold text-slate-500">{c.sender}</span>
                  <span className="text-slate-700 ml-1.5">{c.text}</span>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
                  <Radio className="h-8 w-8 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold">Start the conversation</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Send a chat comment below.</p>
                </div>
              )}
            </div>

            {/* Chat submit form */}
            <form onSubmit={handleSendComment} className="border-t border-slate-200 p-4 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 placeholder-slate-650"
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

      </Container>
    </div>
  );
}
