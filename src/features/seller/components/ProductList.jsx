import { useState, useMemo } from "react";
import { Pencil, Trash2, Star, ToggleLeft, ToggleRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import { useDeleteProduct, useUpdateProduct } from "../hooks/useProducts";
import ProductStatusBadge from "./ProductStatusBadge";
import InventoryBadge from "./InventoryBadge";
import ProductSkeleton from "./ProductSkeleton";
import ProductEmptyState from "./ProductEmptyState";

export default function ProductList({
  products = [],
  isLoading = false,
  isFiltered = false,
  selectedIds = [],
  onSelectChange,
  onEdit,
  onAddProduct,
}) {
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  // ── Select all (current page only) ───────────────────────────
  const allSelected =
    products.length > 0 &&
    products.every((p) => selectedIds.includes(p.id));

  const someSelected =
    products.some((p) => selectedIds.includes(p.id)) && !allSelected;

  function handleSelectAll(e) {
    if (e.target.checked) {
      const allIds = products.map((p) => p.id);
      onSelectChange([
        ...new Set([...selectedIds, ...allIds]),
      ]);
    } else {
      const pageIds = new Set(products.map((p) => p.id));
      onSelectChange(selectedIds.filter((id) => !pageIds.has(id)));
    }
  }

  function handleSelectOne(id, checked) {
    if (checked) {
      onSelectChange([...selectedIds, id]);
    } else {
      onSelectChange(selectedIds.filter((sid) => sid !== id));
    }
  }

  // ── Column sort ───────────────────────────────────────────────
  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortedProducts = useMemo(() => {
    if (!sortField) return products;
    return [...products].sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, sortField, sortDir]);

  // ── Delete ───────────────────────────────────────────────────
  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await deleteProduct.mutateAsync(product.id);
  }

  // ── Toggle status ─────────────────────────────────────────────
  async function handleToggleStatus(product) {
    await updateProduct.mutateAsync({
      id: product.id,
      values: { is_active: !product.is_active },
    });
  }

  // ── Sort icon ────────────────────────────────────────────────
  function SortIcon({ field }) {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-600" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 text-blue-600 font-semibold" />
      : <ArrowDown className="h-3.5 w-3.5 text-blue-600 font-semibold" />;
  }

  // ── States ───────────────────────────────────────────────────
  if (isLoading) return <ProductSkeleton rows={8} />;

  if (!products.length) {
    return (
      <ProductEmptyState isFiltered={isFiltered} onAddProduct={onAddProduct} />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="min-w-full">

          {/* ── Header ──────────────────────────────────────── */}
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>

              {/* Checkbox */}
              <th className="w-12 px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
              </th>

              {/* Product */}
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Product
                  <SortIcon field="name" />
                </button>
              </th>

              {/* Category */}
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">
                Category
              </th>

              {/* Price */}
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort("price")}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Price
                  <SortIcon field="price" />
                </button>
              </th>

              {/* Stock */}
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort("stock")}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Stock
                  <SortIcon field="stock" />
                </button>
              </th>

              {/* Status */}
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">
                Status
              </th>

              {/* Actions */}
              <th className="px-4 py-4 text-right text-sm font-semibold text-slate-600">
                Actions
              </th>

            </tr>
          </thead>

          {/* ── Body ────────────────────────────────────────── */}
          <tbody className="divide-y divide-slate-200">
            {sortedProducts.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              const isDeleting =
                deleteProduct.isPending &&
                deleteProduct.variables === product.id;
              const isTogglingStatus =
                updateProduct.isPending &&
                updateProduct.variables?.id === product.id;

              const primaryImage = product.product_images?.find(
                (img) => img.is_primary
              );
              const thumbnail =
                primaryImage?.url ||
                product.thumbnail_url ||
                product.product_images?.[0]?.url;

              return (
                <tr
                  key={product.id}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-blue-600/5"
                      : "hover:bg-slate-100/50"
                  } ${isDeleting ? "opacity-50" : ""}`}
                >

                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 accent-blue-600"
                    />
                  </td>

                  {/* Product image + name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-600">
                            <span className="text-xl">📦</span>
                          </div>
                        )}
                        {/* Image count badge */}
                        {product.product_images?.length > 0 && (
                          <div className="absolute bottom-0 right-0 rounded-tl-md bg-slate-50/80 px-1 text-[10px] text-slate-600">
                            {product.product_images.length}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {product.sku}
                        </p>
                        {(product.featured || product.is_featured) && (
                          <div className="mt-1 flex items-center gap-1 text-amber-600 font-semibold">
                            <Star className="h-3 w-3 fill-amber-400" />
                            <span className="text-[10px] font-medium">Featured</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {product.categories?.name || "—"}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4">
                    <div className="space-y-0.5">
                      {product.discount_price ? (
                        <>
                          <p className="font-semibold text-slate-900">
                            ₹{Number(product.discount_price).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 line-through">
                            ₹{Number(product.price).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-slate-900">
                          ₹{Number(product.price).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-4">
                    <InventoryBadge stock={product.stock} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <ProductStatusBadge
                        status={product.is_active ? "active" : "inactive"}
                      />
                      {/* Inline toggle */}
                      <button
                        onClick={() => handleToggleStatus(product)}
                        disabled={isTogglingStatus}
                        title={product.is_active ? "Deactivate" : "Activate"}
                        className="text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
                      >
                        {product.is_active ? (
                          <ToggleRight className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">

                      <button
                        onClick={() => onEdit(product)}
                        title="Edit product"
                        className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-blue-500 hover:bg-blue-550/10 hover:text-blue-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(product)}
                        disabled={isDeleting}
                        title="Delete product"
                        className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-red-500 hover:bg-red-550/10 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
}