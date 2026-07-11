import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ShopCard({ shop }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-blue-500">

      {/* Image */}
      <img
        src={
        shop.logo_url ||
            `https://placehold.co/800x500/1e293b/ffffff?text=${encodeURIComponent(
                shop.shop_name
            )}`
        }
        alt={shop.shop_name}
        className="h-56 w-full object-cover"
      />

      {/* Content */}
      <div className="flex flex-col p-6">

        <div className="mb-4 flex items-start justify-between">

          <h3 className="text-2xl font-bold text-slate-900">
            {shop.shop_name}
          </h3>

          {shop.is_live && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
              LIVE
            </span>
          )}

        </div>

        <p className="mb-4 text-slate-500">
          {shop.categories?.name}
        </p>

        <div className="mb-5 flex items-center justify-between">

          <div className="flex items-center gap-2 text-yellow-400">
            <Star className="h-5 w-5 fill-yellow-400" />
            <span className="font-semibold">4.8</span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="h-5 w-5" />
            {shop.city}
          </div>

        </div>

        <p className="mb-6 line-clamp-2 text-sm text-slate-500">
          {shop.description}
        </p>

        <div className="mt-6">
          <Button asChild className="w-full">
            <Link to={`/shops/${shop.id}`}>
              Visit Shop
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}