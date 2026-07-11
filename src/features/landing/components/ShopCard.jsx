import { Star, Eye, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function ShopCard({ shop }) {
  const name = shop.name || shop.shop_name || "Unknown Shop";
  const category = shop.categories?.name || shop.category || "General";
  const isLive = !!(shop.is_live || shop.live);
  const rating = shop.rating || 4.8;
  const viewers = shop.viewers || (isLive ? Math.floor(Math.random() * 150) + 10 : 0);
  const location = shop.city ? `${shop.city}, ${shop.state}` : "Local Shop";

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10">

      {/* Banner / Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {shop.banner_url || shop.logo_url ? (
          <img
            src={shop.banner_url || shop.logo_url}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700 text-6xl">
            🏪
          </div>
        )}

        {isLive && (
          <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            {category}
          </span>
          <h3 className="line-clamp-1 text-xl font-bold text-slate-900 mt-0.5">
            {name}
          </h3>
        </div>

        <p className="line-clamp-2 text-sm text-slate-500 mb-4">
          {shop.description || "Welcome to our shop! Discover our latest products and live updates."}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="h-4 w-4 fill-amber-400" />
              {rating}
            </div>

            {isLive && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Eye className="h-4 w-4" />
                <span>{viewers} watching</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>

          <Link
            to={`/shops/${shop.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            Visit Shop
          </Link>
        </div>

      </div>

    </div>
  );
}