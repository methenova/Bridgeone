import {
  Star,
  MapPin,
  Phone,
  Clock3,
  BadgeCheck,
} from "lucide-react";

import { shopData } from "../data/shopData";
import VideoCallButton from "./VideoCallButton";

export default function ShopInfo() {
  const shop = shopData[0];

  return (
    <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">

      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h2 className="text-4xl font-bold text-white">
            {shop.name}
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            {shop.description}
          </p>

          <div className="mt-8 grid gap-4 text-slate-300 sm:grid-cols-2">

            <div className="flex items-center gap-3">
              <Star className="text-yellow-400" />
              {shop.rating} ({shop.reviews} Reviews)
            </div>

            <div className="flex items-center gap-3">
              <MapPin />
              {shop.city}
            </div>

            <div className="flex items-center gap-3">
              <Clock3 />
              {shop.openTime} - {shop.closeTime}
            </div>

            <div className="flex items-center gap-3">
              <Phone />
              {shop.phone}
            </div>

            {shop.verified && (
              <div className="flex items-center gap-3 text-green-400">
                <BadgeCheck />
                Verified Seller
              </div>
            )}

          </div>

        </div>

        <VideoCallButton />

      </div>

    </section>
  );
}