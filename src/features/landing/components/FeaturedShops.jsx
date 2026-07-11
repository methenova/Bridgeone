import { Container } from "@/components/common/Container";
import { useFeaturedShops } from "@/features/customer/hooks/useMarketplaceShops";
import ShopCard from "./ShopCard";
import { shopData } from "./shopData";

export default function FeaturedShops() {
  const { data: dbShops = [], isLoading } = useFeaturedShops(4);

  // If DB query loaded and has shops, show them. Otherwise fallback to mock shops.
  const shopsToShow = dbShops.length > 0 ? dbShops : shopData;

  return (
    <section className="bg-slate-50 py-24 border-t border-slate-200">

      <Container>

        <div className="mb-16 text-center">

          <h2 className="text-4xl font-bold text-slate-900">
            Featured Live Shops
          </h2>

          <p className="mt-4 text-slate-500">
            Join live sessions and interact directly with trusted shop owners.
          </p>

        </div>

        {isLoading && dbShops.length === 0 ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="h-48 animate-pulse bg-slate-100" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {shopsToShow.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
              />
            ))}
          </div>
        )}

      </Container>

    </section>
  );
}