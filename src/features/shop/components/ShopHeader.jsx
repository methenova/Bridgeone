import { MapPin, Star, CheckCircle } from "lucide-react";

export default function ShopHeader({ shop }) {
  return (
    <div className="mt-8 flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 lg:flex-row lg:items-center">

      <img
        src={
          shop.logo_url ||
          `https://placehold.co/200x200/1e293b/ffffff?text=${encodeURIComponent(
            shop.shop_name
          )}`
        }
        alt={shop.shop_name}
        className="h-28 w-28 rounded-3xl object-cover"
      />

      <div className="flex-1">

        <div className="flex items-center gap-3">

          <h1 className="text-3xl font-bold text-white">
            {shop.shop_name}
          </h1>

          {shop.is_verified && (
            <CheckCircle
              className="text-blue-500"
              size={24}
            />
          )}

        </div>

        <p className="mt-2 text-slate-400">
          {shop.categories?.name}
        </p>

        <div className="mt-5 flex flex-wrap gap-6">

          <div className="flex items-center gap-2 text-yellow-400">
            <Star className="fill-yellow-400" size={18} />
            <span>4.8</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <MapPin size={18} />
            {shop.city}
          </div>

          {shop.is_live && (
            <span className="rounded-full bg-red-600 px-4 py-1 text-sm font-semibold text-white">
              🔴 LIVE
            </span>
          )}

        </div>

      </div>

    </div>
  );
}