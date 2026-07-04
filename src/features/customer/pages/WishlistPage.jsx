import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Container } from "@/components/common/Container";
import { useWishlist, useToggleWishlist } from "../hooks/useWishlist";
import useCartStore from "@/store/cartStore";
import { useAuthContext } from "@/context/AuthContext";

function WishlistItemCard({ wishlistItem }) {
  const product = wishlistItem.products;
  const toggleWishlist = useToggleWishlist();
  const addItem = useCartStore((s) => s.addItem);

  if (!product) return null;

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ||
    product.product_images?.[0]?.url ||
    product.thumbnail_url;

  const displayPrice = product.discount_price
    ? Number(product.discount_price)
    : Number(product.price);

  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);

  function handleAddToCart() {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-slate-700">
      <Link to={`/products/${product.id}`} className="block overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden bg-slate-800">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-slate-600">📦</div>
          )}
        </div>
      </Link>

      {/* Remove from wishlist */}
      <button
        onClick={() => toggleWishlist.mutate(product.id)}
        disabled={toggleWishlist.isPending}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/80 text-red-400 backdrop-blur-sm transition-all hover:bg-red-500/20"
        title="Remove from wishlist"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categories?.name && (
          <span className="text-xs text-blue-400">{product.categories.name}</span>
        )}

        <Link to={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-white hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <span className="text-lg font-bold text-white">
              ₹{displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="ml-2 text-sm text-slate-500 line-through">
                ₹{Number(product.price).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={Number(product.stock) === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {Number(product.stock) === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { user } = useAuthContext();
  const { data: wishlistItems = [], isLoading } = useWishlist();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 py-20 text-center">
        <Heart className="mx-auto mb-4 h-16 w-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Your Wishlist</h2>
        <p className="mt-2 text-slate-400">Please log in to view your saved products</p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-500"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Wishlist</h1>
            <p className="mt-1 text-slate-400">
              {wishlistItems.length} saved product{wishlistItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <Link
              to="/products"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
            >
              Continue Shopping
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div className="aspect-[4/3] animate-pulse bg-slate-800" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart className="mb-4 h-16 w-16 text-slate-700" />
            <h3 className="text-xl font-semibold text-white">Nothing saved yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Browse products and tap the ♥ to save them here
            </p>
            <Link
              to="/products"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {wishlistItems.map((item) => (
              <WishlistItemCard key={item.id} wishlistItem={item} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
