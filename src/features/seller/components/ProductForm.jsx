import { useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw, Wand2 } from "lucide-react";

import { productSchema } from "../validations/product.schema";
import {
  useCreateProduct,
  useUpdateProduct,
  useCategories,
} from "../hooks/useProducts";
import {
  useProductImages,
  useUploadProductImage,
  useDeleteProductImage,
  useSetPrimaryImage,
  useReorderProductImages,
} from "../hooks/useProductImages";
import { generateSlug, generateSku } from "../services/product.service";

import ProductImageUploader from "./ProductImageUploader";

const DEFAULT_VALUES = {
  name: "",
  slug: "",
  category_id: "",
  description: "",
  price: "",
  discount_price: "",
  stock: "",
  sku: "",
  thumbnail_url: "",
  is_active: true,
  is_featured: false,
};

export default function ProductForm({ shopId, shopName, product, onSuccess }) {
  const isEditing = !!product;
  const productId = product?.id;

  // ── Data ─────────────────────────────────────────────────────
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: existingImages = [] } = useProductImages(productId);

  // ── Mutations ─────────────────────────────────────────────────
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const uploadImage = useUploadProductImage(productId, shopId);
  const deleteImage = useDeleteProductImage(productId);
  const setPrimary = useSetPrimaryImage(productId);
  const reorderImages = useReorderProductImages(productId);

  // ── Form ──────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const watchedName = watch("name");
  const watchedPrice = watch("price");
  const watchedDiscountPrice = watch("discount_price");

  // Prefill when editing
  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        slug: product.slug || "",
        category_id: product.category_id || "",
        description: product.description || "",
        price: product.price ? String(product.price) : "",
        discount_price: product.discount_price ? String(product.discount_price) : "",
        stock: product.stock !== undefined ? String(product.stock) : "",
        sku: product.sku || "",
        thumbnail_url: product.thumbnail_url || "",
        is_active: product.is_active ?? true,
        is_featured: (product.featured || product.is_featured) ?? false,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [product, reset]);

  // Auto-generate slug from name (only for new products or when slug not manually edited)
  useEffect(() => {
    if (!isEditing && watchedName) {
      setValue("slug", generateSlug(watchedName), { shouldValidate: false });
    }
  }, [watchedName, isEditing, setValue]);

  // ── Computed ─────────────────────────────────────────────────
  const discountPercent =
    watchedPrice && watchedDiscountPrice && Number(watchedDiscountPrice) > 0
      ? Math.round(
          ((Number(watchedPrice) - Number(watchedDiscountPrice)) /
            Number(watchedPrice)) *
            100
        )
      : null;

  // ── Handlers ──────────────────────────────────────────────────
  const handleGenerateSku = useCallback(() => {
    setValue("sku", generateSku(shopName), { shouldValidate: true });
  }, [shopName, setValue]);

  const handleGenerateSlug = useCallback(() => {
    const name = watch("name");
    if (name) setValue("slug", generateSlug(name), { shouldValidate: true });
  }, [watch, setValue]);

  async function onSubmit(values) {
    const payload = {
      ...values,
      featured: values.is_featured,
      shop_id: shopId,
      price: Number(values.price),
      discount_price: values.discount_price ? Number(values.discount_price) : null,
      stock: Number(values.stock),
    };
    delete payload.is_featured;

    if (isEditing) {
      await updateProduct.mutateAsync({ id: productId, values: payload });
    } else {
      await createProduct.mutateAsync(payload);
    }

    if (!isEditing) reset(DEFAULT_VALUES);
    onSuccess?.();
  }

  // ── Image handlers ───────────────────────────────────────────
  async function handleImageUpload(file, sortOrder) {
    if (!productId) return;
    const isPrimary = existingImages.length === 0;
    await uploadImage.mutateAsync({ file, sortOrder, isPrimary });
  }

  async function handleImageDelete(imageId) {
    await deleteImage.mutateAsync({ imageId });
  }

  async function handleSetPrimary(imageId, imageUrl) {
    await setPrimary.mutateAsync({ imageId, imageUrl });
  }

  async function handleReorder(images) {
    await reorderImages.mutateAsync(images);
  }

  const isBusy = isSubmitting || createProduct.isPending || updateProduct.isPending;

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500";
  const errorClass = "mt-1.5 text-xs text-red-600 font-semibold";
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>

      {/* ═══════════════════════════════════════════════════════
          SECTION: Basic Information
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-100">
          Basic Information
        </h3>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Product Name */}
          <div className="md:col-span-2 space-y-1.5">
            <label className={labelClass}>
              Product Name <span className="text-red-650 font-semibold">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Classic Cotton T-Shirt"
              className={fieldClass}
            />
            {errors.name && (
              <p className={errorClass}>{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="md:col-span-2 space-y-1.5">
            <label className={labelClass}>URL Slug <span className="text-red-650 font-semibold">*</span></label>
            <div className="flex gap-2">
              <input
                {...register("slug")}
                placeholder="classic-cotton-t-shirt"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handleGenerateSlug}
                title="Regenerate slug"
                className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {errors.slug && (
              <p className={errorClass}>{errors.slug.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Category <span className="text-red-650 font-semibold">*</span>
            </label>
            <select
              {...register("category_id")}
              disabled={categoriesLoading}
              className={fieldClass}
            >
              <option value="">
                {categoriesLoading ? "Loading categories..." : "Select Category"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className={errorClass}>{errors.category_id.message}</p>
            )}
          </div>

          {/* SKU */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              SKU <span className="text-red-650 font-semibold">*</span>
            </label>
            <div className="flex gap-2">
              <input
                {...register("sku")}
                placeholder="e.g. SHOP-ABC123"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handleGenerateSku}
                title="Auto-generate SKU"
                className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600"
              >
                <Wand2 className="h-4 w-4" />
              </button>
            </div>
            {errors.sku && (
              <p className={errorClass}>{errors.sku.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe your product in detail..."
              className={fieldClass}
            />
            {errors.description && (
              <p className={errorClass}>{errors.description.message}</p>
            )}
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION: Pricing & Inventory
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-100">
          Pricing & Inventory
        </h3>

        <div className="grid gap-5 md:grid-cols-3">

          {/* Price */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Price (₹) <span className="text-red-650 font-semibold">*</span>
            </label>
            <input
              {...register("price")}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={fieldClass}
            />
            {errors.price && (
              <p className={errorClass}>{errors.price.message}</p>
            )}
          </div>

          {/* Discount Price */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Discount Price (₹)
              {discountPercent && discountPercent > 0 && (
                <span className="ml-2 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {discountPercent}% OFF
                </span>
              )}
            </label>
            <input
              {...register("discount_price")}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={fieldClass}
            />
            {errors.discount_price && (
              <p className={errorClass}>{errors.discount_price.message}</p>
            )}
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Stock Quantity <span className="text-red-650 font-semibold">*</span>
            </label>
            <input
              {...register("stock")}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className={fieldClass}
            />
            {errors.stock && (
              <p className={errorClass}>{errors.stock.message}</p>
            )}
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION: Product Settings
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-100">
          Product Settings
        </h3>

        <div className="flex flex-wrap gap-6">

          {/* Active status */}
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  <div
                    className={`h-6 w-11 rounded-full transition-colors ${
                      field.value ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      field.value ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Active</p>
                  <p className="text-xs text-slate-500">
                    Visible to customers on the marketplace
                  </p>
                </div>
              </label>
            )}
          />

          {/* Featured */}
          <Controller
            name="is_featured"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  <div
                    className={`h-6 w-11 rounded-full transition-colors ${
                      field.value ? "bg-amber-500" : "bg-slate-200"
                    }`}
                  />
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      field.value ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Featured</p>
                  <p className="text-xs text-slate-500">
                    Highlighted in featured product sections
                  </p>
                </div>
              </label>
            )}
          />

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION: Product Images (only when editing)
      ═══════════════════════════════════════════════════════ */}
      {isEditing && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-100">
            Product Images
          </h3>
          <p className="mb-5 text-xs text-slate-500">
            The first image (starred) will be shown as the product thumbnail.
          </p>
          <ProductImageUploader
            productId={productId}
            existingImages={existingImages}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            onSetPrimary={handleSetPrimary}
            onReorder={handleReorder}
            disabled={isBusy}
          />
        </div>
      )}

      {/* Note for new products */}
      {!isEditing && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-300">
          💡 You can upload product images after saving the product.
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3 pb-2">
        {isEditing && isDirty && (
          <span className="text-xs text-slate-500">Unsaved changes</span>
        )}

        <button
          type="submit"
          disabled={isBusy}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Product"}
        </button>
      </div>

    </form>
  );
}