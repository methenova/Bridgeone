import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  Share2, 
  ExternalLink, 
  Mail, 
  Send,
  Sparkles
} from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";

import { getProductShareUrl, recordProductShare } from "../services/share.service";

export default function ProductShareModal({ isOpen, product, shopId, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);

  const shareUrl = product ? getProductShareUrl(product) : "";
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  // Generate QR Code on product load
  useEffect(() => {
    if (!shareUrl) return;

    let isMounted = true;
    async function generateQr() {
      try {
        setLoadingQr(true);
        const dataUrl = await QRCode.toDataURL(shareUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        if (isMounted) setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("[ProductShareModal] QR generation error:", err);
      } finally {
        if (isMounted) setLoadingQr(false);
      }
    }

    generateQr();

    return () => {
      isMounted = false;
    };
  }, [shareUrl]);

  if (!isOpen || !product) return null;

  const primaryImage = product.product_images?.find((img) => img.is_primary);
  const thumbnail = primaryImage?.url || product.thumbnail_url || product.product_images?.[0]?.url;

  // Copy link handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Product share link copied to clipboard!");
      recordProductShare({ shopId: shopId || product.shop_id, productId: product.id });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Failed to copy link.");
    }
  };

  // Download QR Code handler
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${product.slug || product.name || "product"}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  // Native share handler
  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: product.name,
        text: `Check out ${product.name} on our store!`,
        url: shareUrl,
      });
      recordProductShare({ shopId: shopId || product.shop_id, productId: product.id });
      toast.success("Product shared!");
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error("Sharing failed.");
      }
    }
  };

  // Social share links
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`Check out ${product.name} on our store!`);

  const socialLinks = [
    {
      name: "WhatsApp",
      url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    },
    {
      name: "Twitter / X",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      color: "bg-slate-900 text-white border-slate-900 hover:bg-slate-800",
    },
    {
      name: "Email",
      url: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodedText}%20${encodedUrl}`,
      color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {thumbnail ? (
                  <img src={thumbnail} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">
                    📦
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 truncate max-w-[240px]">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  SKU: {product.sku} • ₹{Number(product.price).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Share Link Copy */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Public Product Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-800 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1 shadow-sm">
              {loadingQr ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="Product QR Code" className="h-full w-full object-contain" />
              ) : (
                <QrCode className="h-8 w-8 text-slate-400" />
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h4 className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-600" /> Instant QR Code
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Scan with any smartphone camera to view live product card and start consultation.
              </p>
              <button
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Download QR Code PNG
              </button>
            </div>
          </div>

          {/* Social Quick Links & Native Share */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Share via Social Channels
              </span>
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> More options...
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordProductShare({ shopId: shopId || product.shop_id, productId: product.id })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${social.color}`}
                >
                  {social.name}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
