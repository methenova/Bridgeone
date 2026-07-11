import { Container } from "@/components/common/Container";
import { useFeaturedProducts } from "@/features/customer/hooks/useMarketplaceProducts";
import ProductCard from "@/features/product/components/ProductCard";

export default function FeaturedProducts() {
  const { data: products = [], isLoading } = useFeaturedProducts(8);

  // If there are no featured products in the database, return null or empty state
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="bg-slate-50 py-24 border-t border-slate-200">
      <Container>
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            Featured Products
          </h2>
          <p className="mt-4 text-slate-500">
            Handpicked quality products from our top-selling shops.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[4/3] animate-pulse bg-slate-100" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
