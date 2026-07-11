import { useShopContext } from "@/context/ShopContext";
import ShopCard from "./ShopCard";

export default function ShopGrid() {
  const {
    filteredShops,
    loading,
  } = useShopContext();

  if (loading) {
    return (
      <div className="text-center py-10 text-slate-900">
        Loading shops...
      </div>
    );
  }

  if (filteredShops.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No shops found.
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredShops.map((shop) => (
        <ShopCard
          key={shop.id}
          shop={shop}
        />
      ))}
    </div>
  );
}