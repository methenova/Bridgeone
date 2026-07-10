import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, AlertTriangle } from "lucide-react";

import { useAuthContext } from "@/context/AuthContext";
import useSellerShop from "../hooks/useSellerShop";

import {
  useProducts,
  useCategories,
  useBulkDeleteProducts,
  useBulkUpdateStatus,
} from "../hooks/useProducts";

import ProductFilters from "../components/ProductFilters";
import ProductList from "../components/ProductList";
import ProductPagination from "../components/ProductPagination";
import BulkActionBar from "../components/BulkActionBar";
import ProductForm from "../components/ProductForm";

// ─────────────────────────────────────────────────────────────
// No Shop State
// ─────────────────────────────────────────────────────────────
function NoShopWarning() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/50">
        <AlertTriangle className="h-8 w-8 text-amber-600 font-semibold" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900">No Shop Found</h3>
      <p className="mb-6 max-w-sm text-sm text-slate-500">
        You need to create your shop before you can manage products. Head to the
        My Shop section to get started.
      </p>
      <a
        href="/seller/shop"
        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
      >
        Create My Shop
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Product Form Drawer
// ─────────────────────────────────────────────────────────────
function ProductDrawer({ isOpen, product, shopId, shopName, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
          >
            {/* Drawer header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {product ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {product
                    ? "Update product details and images"
                    : "Fill in the details to add a product"}
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ProductForm
                shopId={shopId}
                shopName={shopName}
                product={product}
                onSuccess={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Products Page
// ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  useAuthContext(); // ensures auth context is available
  const { shop, loading: shopLoading } = useSellerShop();

  // ── Filters state ──────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    status: "",
    stockFilter: "",
    sortBy: "created_at",
    sortOrder: "desc",
    page: 1,
    limit: 12,
  });

  function updateFilters(updates) {
    setFilters((prev) => ({ ...prev, ...updates }));
  }

  // ── Data ────────────────────────────────────────────────────
  const shopId = shop?.id;

  const {
    data: productData,
    isLoading: productsLoading,
    isFetching,
  } = useProducts(shopId, filters);

  const { data: categories = [] } = useCategories();

  const products = productData?.products ?? [];
  const totalProducts = productData?.total ?? 0;
  const totalPages = productData?.totalPages ?? 1;

  // ── Selection ───────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);

  function clearSelection() {
    setSelectedIds([]);
  }

  // ── Bulk mutations ─────────────────────────────────────────
  const bulkDelete = useBulkDeleteProducts();
  const bulkStatus = useBulkUpdateStatus();

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.length} products? This cannot be undone.`))
      return;
    await bulkDelete.mutateAsync(selectedIds);
    clearSelection();
  }

  async function handleBulkActivate() {
    await bulkStatus.mutateAsync({ ids: selectedIds, is_active: true });
    clearSelection();
  }

  async function handleBulkDeactivate() {
    await bulkStatus.mutateAsync({ ids: selectedIds, is_active: false });
    clearSelection();
  }

  // ── Drawer (add / edit) ────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  function openAddDrawer() {
    setEditingProduct(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(product) {
    setEditingProduct(product);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingProduct(null);
  }

  // ── Shop loading ────────────────────────────────────────────
  if (shopLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center pb-4">
          <div className="h-6 w-36 bg-slate-100 rounded-md" />
          <div className="h-10 w-28 bg-slate-100 rounded-md" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
          <div className="h-10 bg-slate-50 rounded-xl" />
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="h-12 bg-slate-50/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return <NoShopWarning />;
  }

  const isFiltered =
    !!(filters.search || filters.categoryId || filters.status || filters.stockFilter);

  const isBulkBusy = bulkDelete.isPending || bulkStatus.isPending;

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">
            Manage your product catalog · {shop.name}
          </p>
        </div>

        <button
          onClick={openAddDrawer}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <ProductFilters
        categories={categories}
        filters={filters}
        onChange={updateFilters}
        totalProducts={totalProducts}
      />

      {/* ── Products Table ────────────────────────────────────── */}
      <div className={isFetching && !productsLoading ? "opacity-70 transition-opacity" : ""}>
        <ProductList
          products={products}
          isLoading={productsLoading}
          isFiltered={isFiltered}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          onEdit={openEditDrawer}
          onAddProduct={openAddDrawer}
        />
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      {!productsLoading && totalProducts > 0 && (
        <ProductPagination
          page={filters.page}
          totalPages={totalPages}
          total={totalProducts}
          limit={filters.limit}
          onPageChange={(p) => updateFilters({ page: p })}
          onLimitChange={(l) => updateFilters({ limit: l, page: 1 })}
        />
      )}

      {/* ── Bulk Action Bar ───────────────────────────────────── */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onDelete={handleBulkDelete}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onClear={clearSelection}
        isLoading={isBulkBusy}
      />

      {/* ── Product Form Drawer ───────────────────────────────── */}
      <ProductDrawer
        isOpen={drawerOpen}
        product={editingProduct}
        shopId={shopId}
        shopName={shop.name}
        onClose={closeDrawer}
      />

    </div>
  );
}