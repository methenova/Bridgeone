import { useShopContext } from "@/context/ShopContext";

export default function ShopFilters() {
  const {
    search,
    setSearch,
    category,
    setCategory,
    city,
    setCity,
    categories = [],
    cities = [],
  } = useShopContext();

  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row">

      {/* Search */}
      <input
        type="text"
        placeholder="Search shops..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-blue-500"
      />

      {/* Category */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
      >
        {categories.map((item) => (
          <option key={item} value={item}>
            {item === "All" ? "All Categories" : item}
          </option>
        ))}
      </select>

      {/* City */}
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
      >
        {cities.map((item) => (
          <option key={item} value={item}>
            {item === "All" ? "All Cities" : item}
          </option>
        ))}
      </select>

    </div>
  );
}