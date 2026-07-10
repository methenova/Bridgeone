import { Package, SlidersHorizontal, ArrowRight, HelpCircle } from "lucide-react";

export default function ProductEmptyState({ isFiltered = false, onAddProduct }) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-150 bg-white shadow-sm hover:shadow-md transition-all duration-300 py-16 px-6 text-center max-w-lg mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 shadow-xs">
          <SlidersHorizontal className="h-6 w-6" />
        </div>

        <h3 className="mb-1.5 text-base font-bold text-slate-900">
          No matches found
        </h3>

        <p className="mb-4 max-w-xs text-xs text-slate-500 leading-relaxed">
          We couldn't find any products matching your active filters. Try adjusting your search term, category, or status queries.
        </p>

        <p className="text-[10px] text-slate-400 font-medium">
          Tip: clear all active selectors to view your entire catalog collection.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 transition-colors py-20 px-8 text-center max-w-xl mx-auto">
      {/* Premium CSS Illustration */}
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600 shadow-sm animate-bounce-subtle">
        <Package className="h-9 w-9 stroke-[1.6]" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-md shadow-blue-600/30">＋</span>
      </div>

      <h3 className="mb-2 text-lg font-bold text-slate-900">
        Your Product Catalog is Empty
      </h3>

      <p className="mb-6 max-w-sm text-xs text-slate-500 leading-relaxed">
        Start building your display inventory. Add products manually or sync directly from Shopify to showcase items during live consultations and streams.
      </p>

      {onAddProduct && (
        <div className="space-y-4">
          <button
            onClick={onAddProduct}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Package className="h-4 w-4" />
            <span>Add Your First Product</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Need help? Read our <a href="#" className="text-blue-600 hover:underline">catalog setup guide</a></span>
          </div>
        </div>
      )}
    </div>
  );
}
