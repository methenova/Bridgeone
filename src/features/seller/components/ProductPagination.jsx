import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function ProductPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}) {
  if (totalPages <= 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build visible page numbers with ellipsis
  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }

    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Left: showing X of Y */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {from}–{to}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900">
            {total.toLocaleString()}
          </span>{" "}
          products
        </p>

        {/* Per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          {pageNumbers.map((num, i) =>
            num === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 w-8 items-center justify-center text-sm text-slate-500"
              >
                ···
              </span>
            ) : (
              <button
                key={num}
                onClick={() => onPageChange(num)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  num === page
                    ? "bg-blue-600 text-white"
                    : "border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"
                )}
              >
                {num}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
