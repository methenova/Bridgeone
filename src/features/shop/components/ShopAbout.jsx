import {
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";

export default function ShopAbout({ shop }) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm p-8">

      <h2 className="text-2xl font-bold text-slate-900">
        About Shop
      </h2>

      <p className="mt-5 leading-8 text-slate-500">
        {shop.description || "No description available."}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">

        <div className="flex items-center gap-4">
          <MapPin className="text-blue-500" size={22} />

          <div>
            <p className="text-sm text-slate-500">
              Address
            </p>

            <p className="text-slate-900">
              {shop.address}, {shop.city}, {shop.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Phone className="text-green-500" size={22} />

          <div>
            <p className="text-sm text-slate-500">
              Phone
            </p>

            <p className="text-slate-900">
              {shop.phone || "Not Available"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Mail className="text-red-500" size={22} />

          <div>
            <p className="text-sm text-slate-500">
              Email
            </p>

            <p className="text-slate-900">
              {shop.email || "Not Available"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Globe className="text-purple-500" size={22} />

          <div>
            <p className="text-sm text-slate-500">
              Country
            </p>

            <p className="text-slate-900">
              {shop.country}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}