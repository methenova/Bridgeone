import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Star, Store, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import toast from "react-hot-toast";

import { Container } from "@/components/common/Container";
import { useProductDetail, useRelatedProducts } from "../hooks/useMarketplaceProducts";
import useCartStore from "@/store/cartStore";
import useWishlistStore from "@/store/wishlistStore";
import useRecentlyViewedStore from "@/store/recentlyViewedStore";
import { useToggleWishlist } from "../hooks/useWishlist";
import ProductCard from "@/features/product/components/ProductCard";
import WishlistButton from "@/features/wishlist/components/WishlistButton";
import CustomerChatWidget from "@/features/chat/components/CustomerChatWidget";
import { useEffect } from "react";

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square animate-pulse rounded-3xl bg-slate-800" />
        <div className="flex gap-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-16 w-16 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-800" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-800" />
        <div className="h-6 w-1/4 animate-pulse rounded bg-slate-800" />
        <div className="h-20 animate-pulse rounded bg-slate-800" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useProductDetail(productId);
  const { data: relatedProducts = [] } = useRelatedProducts(productId, product?.category_id);

  const addItem = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) => s.isInCart);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product?.id));
  const toggleWishlist = useToggleWishlist();
  const addRecent = useRecentlyViewedStore((s) => s.addProduct);

  // Track recently viewed
  useEffect(() => {
    if (product) addRecent(product);
  }, [product, addRecent]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 py-10">
        <Container><ProductDetailSkeleton /></Container>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-950 py-20 text-center">
        <p className="text-xl text-white">Product not found</p>
        <Link to="/products" className="mt-4 inline-block text-blue-400 underline">
          Browse Products
        </Link>
      </div>
    );
  }

  const images = product.product_images?.length
    ? [...product.product_images].sort((a, b) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      })
    : product.thumbnail_url
    ? [{ url: product.thumbnail_url }]
    : [];

  const currentImageUrl = images[selectedImage]?.url;
  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)
    : null;
  const displayPrice = hasDiscount ? Number(product.discount_price) : Number(product.price);
  const isOutOfStock = Number(product.stock) === 0;
  const inCart = isInCart(product.id);

  function handleAddToCart() {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart!`);
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <Container>

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-white">Products</Link>
          {product.categories?.name && (
            <>
              <span>/</span>
              <Link
                to={`/products?category=${product.category_id}`}
                className="hover:text-white"
              >
                {product.categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="truncate text-slate-300">{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div className="grid gap-10 lg:grid-cols-2">

          {/* ── Left: Images ─────────────────────────────── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 aspect-square">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl text-slate-700">📦</div>
              )}

              {discountPercent && (
                <span className="absolute left-4 top-4 rounded-xl bg-red-500 px-3 py-1 text-sm font-bold text-white">
                  -{discountPercent}%
                </span>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((i) => Math.max(0, i - 1))}
                    disabled={selectedImage === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white backdrop-blur-sm disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((i) => Math.min(images.length - 1, i + 1))}
                    disabled={selectedImage === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white backdrop-blur-sm disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      i === selectedImage ? "border-blue-500" : "border-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Details ────────────────────────────── */}
          <div className="space-y-6">

            {/* Category */}
            {product.categories?.name && (
              <Link
                to={`/products?category=${product.category_id}`}
                className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
              >
                {product.categories.icon} {product.categories.name}
              </Link>
            )}

            {/* Name */}
            <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                ))}
              </div>
              <span className="text-sm text-slate-400">4.0 · 0 reviews</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold text-white">
                ₹{displayPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <div>
                  <span className="text-lg text-slate-500 line-through">
                    ₹{Number(product.price).toLocaleString()}
                  </span>
                  <span className="ml-2 text-sm font-semibold text-emerald-400">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className={`text-sm font-medium ${isOutOfStock ? "text-red-400" : "text-emerald-400"}`}>
              {isOutOfStock ? "❌ Out of Stock" : `✅ In Stock (${product.stock} available)`}
            </div>

            {/* Quantity + Add to Cart */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center text-slate-400 hover:text-white"
                  >
                    –
                  </button>
                  <span className="min-w-[2rem] text-center font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(Number(product.stock), q + 1))}
                    className="flex h-10 w-10 items-center justify-center text-slate-400 hover:text-white"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${
                    inCart
                      ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {inCart ? "In Cart" : "Add to Cart"}
                </button>

                <WishlistButton
                  isWishlisted={isWishlisted}
                  isLoading={toggleWishlist.isPending}
                  onClick={() => toggleWishlist.mutate(product.id)}
                  size="lg"
                />
              </div>
            )}

            {/* Shop */}
            {product.shops && (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                <Link
                  to={`/shops/${product.shops.id}`}
                  className="flex items-center gap-3 transition-colors hover:opacity-80"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                    {product.shops.logo_url ? (
                      <img src={product.shops.logo_url} alt={product.shops.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Store className="h-5 w-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{product.shops.name}</p>
                    <p className="text-xs text-slate-500">{product.shops.city} · Visit shop →</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("trigger-shop-call"))}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <Phone className="h-3.5 w-3.5 fill-current animate-pulse" />
                  Call Expert
                </button>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-white">About this product</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">
                  {product.description}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-white">Related Products</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

      </Container>
      {product.shops && <CustomerChatWidget shop={product.shops} />}
    </div>
  );
}
