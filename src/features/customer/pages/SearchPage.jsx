import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Container } from "@/components/common/Container";
import { useMarketplaceProducts } from "../hooks/useMarketplaceProducts";
import ProductCard from "@/features/product/components/ProductCard";
import ProductPagination from "@/features/seller/components/ProductPagination";

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || 1);

  const { data: productData, isLoading } = useMarketplaceProducts({
    search: query,
    page,
    limit: 12,
  });

  const products = productData?.products ?? [];
  const total = productData?.total ?? 0;
  const totalPages = productData?.totalPages ?? 1;

  function setPage(p) {
    const params = new URLSearchParams(searchParams);
    params.set("page", p);
    setSearchParams(params);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>

        {/* Header */}
        <div className="mb-8">
          {query ? (
            <>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <Search className="h-4 w-4" />
                Search results
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                &ldquo;{query}&rdquo;
              </h1>
              <p className="mt-1 text-slate-500">
                {total.toLocaleString()} product{total !== 1 ? "s" : ""} found
              </p>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-slate-900">Search Products</h1>
          )}
        </div>

        {!query ? (
          <div className="py-24 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <p className="text-slate-500">Use the search bar above to find products</p>
          </div>
        ) : isLoading ? (
          <SearchSkeleton />
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-xl font-semibold text-slate-900">No results for &ldquo;{query}&rdquo;</p>
            <p className="mt-2 text-sm text-slate-500">
              Try different keywords or browse all products
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-10">
                <ProductPagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={12}
                  onPageChange={setPage}
                  onLimitChange={() => {}}
                />
              </div>
            )}
          </>
        )}

      </Container>
    </div>
  );
}
