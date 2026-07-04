import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Radio, Eye, Send, Heart, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/config/supabase";
import { Container } from "@/components/common/Container";
import { useShopDetail } from "@/features/customer/hooks/useMarketplaceShops";
import { useAuthContext } from "@/context/AuthContext";
import useCartStore from "@/store/cartStore";

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
      .subscribe();

    // Set initial mock viewers
    setViewers(Math.floor(Math.random() * 40) + 15);

    return () => {
      channel.unsubscribe();
    };
  }, [shopId]);

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-950 py-20 text-center">
        <p className="text-xl text-white">Shop not found</p>
        <Link to="/shops" className="mt-4 inline-block text-blue-400 underline">
          Browse Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <Container>
        
        {/* Back navigation */}
        <Link
          to={`/shops/${shopId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        {/* Page Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {shop.logo_url ? <img src={shop.logo_url} alt="" className="h-full w-full object-cover" /> : "🏪"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {shop.name} Live Stream
                <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase animate-pulse">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{shop.city} · {shop.categories?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
            <Eye className="h-4 w-4 text-blue-400" /> {viewers} watching
          </div>
        </div>

        {/* Video stream panel & Chat split */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Stream Player View */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-3xl border border-slate-900 bg-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
              
              {/* Dynamic visualization canvas representing the active stream */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-end gap-1.5 h-16">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 bg-blue-500 rounded-full animate-bounce"
                      style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest animate-pulse">
                  Live Stream Broadcast Connection
                </p>
                <p className="text-[10px] text-slate-500">Video streaming fallback active.</p>
              </div>

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
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-4 z-15">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      {pinnedProduct.thumbnail_url && (
                        <img src={pinnedProduct.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Featured Product</p>
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">{pinnedProduct.name}</p>
                      <p className="text-xs text-slate-300 font-semibold">₹{Number(pinnedProduct.price).toLocaleString()}</p>
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
          <div className="rounded-3xl border border-slate-900 bg-slate-900/20 flex flex-col h-[400px] lg:h-auto">
            {/* Header */}
            <div className="border-b border-slate-900 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Live Comments</h3>
              
              {/* Emojis reaction trigger button */}
              <button
                onClick={handleSendReaction}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
              >
                <Heart className="h-4.5 w-4.5 fill-current" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-none">
              {comments.map((c) => (
                <div key={c.id} className="text-xs leading-relaxed">
                  <span className="font-bold text-slate-400">{c.sender}</span>
                  <span className="text-slate-300 ml-1.5">{c.text}</span>
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
            <form onSubmit={handleSendComment} className="border-t border-slate-900 p-4 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-white outline-none focus:border-blue-500 placeholder-slate-650"
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
