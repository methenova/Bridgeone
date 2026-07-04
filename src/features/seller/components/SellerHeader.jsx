import { Bell, Search } from "lucide-react";

export default function SellerHeader() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-8">

      {/* Left */}

      <div>
        <h1 className="text-2xl font-bold text-white">
          Seller Dashboard
        </h1>

        <p className="text-sm text-slate-400">
          Manage your shop and products
        </p>
      </div>

      {/* Center */}

      <div className="hidden w-full max-w-md lg:block">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-10 pr-4 text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            S
          </div>

          <div className="hidden md:block">
            <p className="font-semibold text-white">
              Seller
            </p>

            <p className="text-sm text-slate-400">
              Online
            </p>
          </div>

        </div>

      </div>

    </header>
  );
}