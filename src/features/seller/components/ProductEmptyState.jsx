import { Package, SlidersHorizontal } from "lucide-react";

export default function ProductEmptyState({ isFiltered = false, onAddProduct }) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
          <SlidersHorizontal className="h-8 w-8 text-slate-500" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          No products match your filters
        </h3>

        <p className="mb-6 max-w-xs text-sm text-slate-500">
          Try adjusting your search term, category, or status filter to find what you're looking for.
        </p>

        <p className="text-sm text-slate-500">
          Clear filters to see all products
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-blue-500/20">
        <Package className="h-10 w-10 text-blue-600 font-semibold" />
      </div>

      <h3 className="mb-2 text-xl font-semibold text-slate-900">
        No products yet
      </h3>

      <p className="mb-8 max-w-sm text-sm text-slate-500">
        Start building your product catalog. Add your first product and it will appear here.
      </p>

      {onAddProduct && (
        <button
          onClick={onAddProduct}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <Package className="h-4 w-4" />
          Add Your First Product
        </button>
      )}
    </div>
  );
}
