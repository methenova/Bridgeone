import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import toast from "react-hot-toast";

import useCartStore from "@/store/cartStore";
import useWishlistStore from "@/store/wishlistStore";
import { useToggleWishlist } from "@/features/customer/hooks/useWishlist";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

/**
 * Primary product card for the marketplace.
 * Works in both logged-in and guest states.
 */
export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) => s.isInCart);
  const toggleWishlist = useToggleWishlist();
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ||
    product.product_images?.[0]?.url ||
    product.thumbnail_url;

  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)
    : null;

  const displayPrice = hasDiscount
    ? Number(product.discount_price)
    : Number(product.price);

  const inCart = isInCart(product.id);

  function handleAddToCart(e) {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  }

  function handleWishlist(e) {
    e.preventDefault();
    toggleWishlist.mutate(product.id);
  }

  const isOutOfStock = Number(product.stock) === 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-800">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-slate-600">
              📦
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discountPercent && (
            <span className="rounded-lg bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{discountPercent}%
            </span>
          )}
          {(product.featured || product.is_featured) && (
            <span className="rounded-lg bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              ⭐ Featured
            </span>
          )}
          {isOutOfStock && (
            <span className="rounded-lg bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <div className="absolute right-3 top-3">
          <WishlistButton
            isWishlisted={isWishlisted}
            isLoading={toggleWishlist.isPending}
            onClick={handleWishlist}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">

        {/* Category */}
        {product.categories?.name && (
          <span className="text-xs font-medium text-blue-400">
            {product.categories.name}
          </span>
        )}

        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {product.name}
        </h3>

        {/* Shop */}
        {product.shops?.name && (
          <p className="text-xs text-slate-500">
            {product.shops.name}
          </p>
        )}

        {/* Rating placeholder */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
            />
          ))}
          <span className="ml-1 text-xs text-slate-500">(0)</span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-end justify-between pt-2">
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

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95 ${
            isOutOfStock
              ? "cursor-not-allowed bg-slate-800 text-slate-500"
              : inCart
              ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? "Out of Stock" : inCart ? "In Cart" : "Add to Cart"}
        </button>

      </div>
    </Link>
  );
}