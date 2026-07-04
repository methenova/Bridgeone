import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductCard({ product }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500">

      {/* Product Image */}
      <img
        src={
          product.image_url ||
          `https://placehold.co/600x600/1e293b/ffffff?text=${encodeURIComponent(
            product.product_name
          )}`
        }
        alt={product.product_name}
        className="h-60 w-full object-cover"
      />

      <div className="space-y-4 p-5">

        {/* Product Name */}
        <h3 className="line-clamp-2 text-lg font-semibold text-white">
          {product.product_name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-3">

          <span className="text-2xl font-bold text-blue-400">
            ₹{product.sale_price}
          </span>

          {product.mrp && (
            <span className="text-sm text-slate-500 line-through">
              ₹{product.mrp}
            </span>
          )}

        </div>

        {/* Stock */}
        <p className="text-sm text-slate-400">
          Stock : {product.stock_quantity}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">

          <Button className="flex-1">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy Now
          </Button>

          <Button
            variant="outline"
            size="icon"
          >
            <Heart className="h-5 w-5" />
          </Button>

        </div>

      </div>

    </div>
  );
}