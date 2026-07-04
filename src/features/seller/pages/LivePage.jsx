import { useState, useEffect, useRef } from "react";
import { Radio, Video, ShoppingBag, Eye, Send, StopCircle } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import useSellerShop from "../hooks/useSellerShop";
import { useProducts } from "../hooks/useProducts";

export default function LivePage() {
  const { shop, loading: shopLoading } = useSellerShop();
  const shopId = shop?.id;

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

  const videoRef = useRef(null);
  const channelRef = useRef(null);

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

  // Request webcam stream when live starts
  async function startStream() {
    try {
      const constraints = {
        video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
        audio: true,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      toast.error("Webcam access denied. Streaming visual fallback active.");
    }
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
      stopStream();
      setIsLive(false);
      setPinnedProduct(null);
      await supabase.from("shops").update({ is_live: false }).eq("id", shopId);
      toast.success("Stream ended");
    } else {
      // Go live
      await startStream();
      setIsLive(true);
      await supabase.from("shops").update({ is_live: true }).eq("id", shopId);
      toast.success("You are now live!");
    }
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
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
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

          {/* Device selectors */}
          {!isLive && videoDevices.length > 1 && (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
              <Video className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Select Camera:</span>
              <select
                value={selectedVideo}
                onChange={(e) => setSelectedVideo(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none"
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
    </div>
  );
}
