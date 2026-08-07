import { useEffect, useCallback, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Loader2, 
  RefreshCw, 
  Wand2, 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Sliders,
  Check,
  X,
  Copy
} from "lucide-react";
import toast from "react-hot-toast";

import { productSchema } from "../validations/product.schema";
import {
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  useCreateCategory,
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
  has_variants: false,
  options: [],
  variants: [],
};

// Cartesian product generator for option combinations
function generateCartesianVariants(options, baseSku, basePrice, baseDiscountPrice, baseStock) {
  if (!options || options.length === 0) return [];
  const validOptions = options.filter(
    (opt) => opt.name && opt.name.trim() !== "" && opt.values && opt.values.length > 0
  );
  if (validOptions.length === 0) return [];

  const cartesian = (args) => {
    const r = [];
    const max = args.length - 1;
    function helper(arr, i) {
      for (let j = 0, l = args[i].values.length; j < l; j++) {
        const a = [...arr, { optionName: args[i].name.trim(), value: args[i].values[j].trim() }];
        if (i === max) r.push(a);
        else helper(a, i + 1);
      }
    }
    helper([], 0);
    return r;
  };

  const combinations = cartesian(validOptions);

  return combinations.map((combo, idx) => {
    const optObj = {};
    combo.forEach((item) => {
      optObj[item.optionName] = item.value;
    });

    const title = combo.map((c) => c.value).join(" / ");
    const skuSuffix = combo.map((c) => c.value.substring(0, 3).toUpperCase()).join("-");
    const variantSku = baseSku ? `${baseSku}-${skuSuffix}` : `SKU-VAR-${idx + 1}`;

    return {
      id: `var_${Date.now()}_${idx}`,
      title,
      options: optObj,
      sku: variantSku,
      price: basePrice ? String(basePrice) : "0",
      discount_price: baseDiscountPrice ? String(baseDiscountPrice) : "",
      stock: baseStock ? String(baseStock) : "0",
      is_active: true,
    };
  });
}

export default function ProductForm({ shopId, shopName, product, onSuccess }) {
  const isEditing = !!product;
  const productId = product?.id;

  // ── Data ─────────────────────────────────────────────────────
  const { data: existingImages = [] } = useProductImages(productId);
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  // ── Mutations ─────────────────────────────────────────────────
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createCategoryMutation = useCreateCategory();

  const uploadImage = useUploadProductImage(productId, shopId);
  const deleteImage = useDeleteProductImage(productId);
  const setPrimary = useSetPrimaryImage(productId);
  const reorderImages = useReorderProductImages(productId);

  // ── Local Option Value & Inline Category State ─────────────────
  const [optionValueInputs, setOptionValueInputs] = useState({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [submittingCategory, setSubmittingCategory] = useState(false);

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

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
    update: updateOption,
  } = useFieldArray({
    control,
    name: "options",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    replace: replaceVariants,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const watchedName = watch("name");
  const watchedPrice = watch("price");
  const watchedDiscountPrice = watch("discount_price");
  const watchedStock = watch("stock");
  const watchedSku = watch("sku");
  const watchedHasVariants = watch("has_variants");
  const watchedOptions = watch("options");
  const watchedVariants = watch("variants");

  // Calculate sum of active variant stocks
  const totalVariantStock = (watchedVariants || []).reduce(
    (acc, v) => acc + (v?.is_active !== false ? Number(v?.stock || 0) : 0),
    0
  );

  // Prefill when editing
  useEffect(() => {
    if (product) {
      const metadata = product.metadata || {};
      reset({
        name: product.name || "",
        slug: product.slug || "",
        category_id: product.category_id || product.categories?.id || "",
        description: product.description || "",
        price: product.price ? String(product.price) : "",
        discount_price: product.discount_price ? String(product.discount_price) : "",
        stock: product.stock !== undefined ? String(product.stock) : "",
        sku: product.sku || "",
        thumbnail_url: product.thumbnail_url || "",
        is_active: product.is_active ?? true,
        is_featured: (product.featured || product.is_featured) ?? false,
        has_variants: metadata.has_variants ?? false,
        options: metadata.options || [],
        variants: (metadata.variants || []).map((v) => ({
          id: v.id || `var_${Math.random()}`,
          title: v.title || "",
          options: v.options || {},
          sku: v.sku || "",
          price: v.price !== undefined ? String(v.price) : "",
          discount_price: v.discount_price !== undefined ? String(v.discount_price) : "",
          stock: v.stock !== undefined ? String(v.stock) : "0",
          is_active: v.is_active ?? true,
        })),
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [product, reset]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && watchedName) {
      setValue("slug", generateSlug(watchedName), { shouldValidate: false });
    }
  }, [watchedName, isEditing, setValue]);

  // ── Inline Category Creation Handler ───────────────────────────
  async function handleInlineCategoryCreate(e) {
    e?.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    setSubmittingCategory(true);
    try {
      const createdCat = await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
      });
      setValue("category_id", createdCat.id, { shouldValidate: true });
      setNewCategoryName("");
      setIsAddingCategory(false);
    } catch (err) {
      console.error("Inline category creation error:", err);
    } finally {
      setSubmittingCategory(false);
    }
  }

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

  // Option Value Add/Remove Handlers
  const handleAddOptionValue = (index, valueText) => {
    const val = valueText.trim();
    if (!val) return;
    const currentOpt = watchedOptions[index];
    const existingVals = currentOpt.values || [];
    if (existingVals.includes(val)) {
      toast.error(`"${val}" is already added.`);
      return;
    }
    updateOption(index, {
      ...currentOpt,
      values: [...existingVals, val],
    });
    setOptionValueInputs((prev) => ({ ...prev, [index]: "" }));
  };

  const handleRemoveOptionValue = (optIndex, valIndex) => {
    const currentOpt = watchedOptions[optIndex];
    const newVals = [...currentOpt.values];
    newVals.splice(valIndex, 1);
    updateOption(optIndex, {
      ...currentOpt,
      values: newVals,
    });
  };

  // Auto-Generate Variants Handler
  const handleGenerateVariants = () => {
    const generated = generateCartesianVariants(
      watchedOptions,
      watchedSku,
      watchedPrice,
      watchedDiscountPrice,
      watchedStock
    );
    if (generated.length === 0) {
      toast.error("Please add at least one option (e.g. Size) with valid values first.");
      return;
    }
    replaceVariants(generated);
    toast.success(`Generated ${generated.length} product variant${generated.length > 1 ? "s" : ""}!`);
  };

  // Add Custom Variant Row
  const handleAddCustomVariant = () => {
    const newVariant = {
      id: `var_${Date.now()}_custom`,
      title: "Custom Variant",
      options: {},
      sku: watchedSku ? `${watchedSku}-CUST-${variantFields.length + 1}` : `SKU-CUST-${variantFields.length + 1}`,
      price: watchedPrice ? String(watchedPrice) : "0",
      discount_price: watchedDiscountPrice ? String(watchedDiscountPrice) : "",
      stock: "0",
      is_active: true,
    };
    appendVariant(newVariant);
  };

  // Bulk Apply Actions
  const handleBulkApplyPrice = () => {
    if (!watchedPrice) {
      toast.error("Please set a base price in Pricing & Inventory first.");
      return;
    }
    const updated = (watchedVariants || []).map((v) => ({
      ...v,
      price: String(watchedPrice),
      discount_price: watchedDiscountPrice ? String(watchedDiscountPrice) : "",
    }));
    replaceVariants(updated);
    toast.success("Applied base price to all variants!");
  };

  const handleBulkApplyStock = () => {
    if (watchedStock === undefined || watchedStock === "") {
      toast.error("Please set a base stock quantity first.");
      return;
    }
    const updated = (watchedVariants || []).map((v) => ({
      ...v,
      stock: String(watchedStock),
    }));
    replaceVariants(updated);
    toast.success("Applied stock quantity to all variants!");
  };

  async function onSubmit(values) {
    const isHasVariants = Boolean(values.has_variants);
    const options = isHasVariants ? values.options || [] : [];
    const variants = isHasVariants ? values.variants || [] : [];

    // Calculate total stock and primary price
    const computedStock = isHasVariants && variants.length > 0
      ? variants.reduce((sum, v) => sum + (v.is_active !== false ? Number(v.stock || 0) : 0), 0)
      : Number(values.stock);

    const activeVariantPrices = variants
      .filter((v) => v.is_active !== false && v.price)
      .map((v) => Number(v.price));

    const computedPrice = isHasVariants && activeVariantPrices.length > 0
      ? Math.min(...activeVariantPrices)
      : Number(values.price);

    const formattedVariants = isHasVariants
      ? variants.map((v, i) => ({
          id: v.id || `var_${Date.now()}_${i}`,
          title: v.title || Object.values(v.options || {}).join(" / "),
          options: v.options || {},
          sku: v.sku || `${values.sku}-${i + 1}`,
          price: Number(v.price || values.price),
          discount_price: v.discount_price ? Number(v.discount_price) : null,
          stock: Number(v.stock || 0),
          is_active: v.is_active ?? true,
        }))
      : [];

    const payload = {
      name: values.name,
      slug: values.slug,
      category_id: values.category_id || null,
      description: values.description,
      price: computedPrice,
      discount_price: values.discount_price ? Number(values.discount_price) : null,
      stock: computedStock,
      sku: values.sku,
      thumbnail_url: values.thumbnail_url,
      is_active: values.is_active,
      featured: values.is_featured,
      shop_id: shopId,
      metadata: {
        ...(product?.metadata || {}),
        has_variants: isHasVariants,
        options,
        variants: formattedVariants,
      },
    };

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

          {/* Category Dropdown & Inline Creation */}
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Product Category</label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {isAddingCategory ? "Select existing category" : "+ Add New Category"}
              </button>
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-blue-200">
                <input
                  type="text"
                  placeholder="New category name (e.g. Vintage Apparel)..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInlineCategoryCreate();
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleInlineCategoryCreate}
                  disabled={submittingCategory}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {submittingCategory ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Create & Select
                </button>
              </div>
            ) : (
              <select
                {...register("category_id")}
                className={fieldClass}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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

          {/* SKU */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Base SKU <span className="text-red-650 font-semibold">*</span>
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
          SECTION: Pricing & Base Inventory
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-2 pb-3 border-b border-slate-100">
          Pricing & Base Inventory
        </h3>

        <div className="grid gap-5 md:grid-cols-3">

          {/* Price */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Base Price (₹) <span className="text-red-650 font-semibold">*</span>
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

          {/* Base Stock */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              {watchedHasVariants ? "Total Calculated Stock" : "Stock Quantity"} <span className="text-red-650 font-semibold">*</span>
            </label>
            <input
              {...register("stock")}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              disabled={watchedHasVariants}
              value={watchedHasVariants ? totalVariantStock : undefined}
              className={`${fieldClass} ${watchedHasVariants ? "bg-slate-100 font-bold text-blue-600" : ""}`}
            />
            {watchedHasVariants && (
              <p className="text-[10px] text-slate-400 mt-1">
                ⚡ Auto-calculated from sum of active variant stocks ({totalVariantStock} units).
              </p>
            )}
            {errors.stock && (
              <p className={errorClass}>{errors.stock.message}</p>
            )}
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION: Configurable Product Variants
      ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product Variants</h3>
              <p className="text-xs text-slate-500">Configure options like size, color, material, or custom attributes.</p>
            </div>
          </div>

          <Controller
            name="has_variants"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      if (e.target.checked && optionFields.length === 0) {
                        appendOption({ name: "Size", values: ["S", "M", "L"] });
                      }
                    }}
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
                <span className="text-xs font-bold text-slate-700">
                  {field.value ? "Variants Enabled" : "Disabled"}
                </span>
              </label>
            )}
          />
        </div>

        {errors.has_variants && (
          <p className={errorClass}>{errors.has_variants.message}</p>
        )}

        {watchedHasVariants && (
          <div className="space-y-6 pt-2">

            {/* Quick Preset Tags */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Preset Options:
              </span>
              {["Size", "Color", "Material", "Style"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (watchedOptions.some((o) => o.name?.toLowerCase() === preset.toLowerCase())) {
                      toast.error(`Option "${preset}" already exists.`);
                      return;
                    }
                    const defaultVals =
                      preset === "Size" ? ["S", "M", "L"] : preset === "Color" ? ["Red", "Blue"] : ["Standard"];
                    appendOption({ name: preset, values: defaultVals });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => appendOption({ name: "", values: [] })}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                + Custom Option
              </button>
            </div>

            {/* Option Builder List */}
            <div className="space-y-4">
              {optionFields.map((optField, optIndex) => (
                <div key={optField.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      {...register(`options.${optIndex}.name`)}
                      placeholder="Option Name (e.g. Size, Color, Fabric)"
                      className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1 outline-none focus:border-blue-500 w-full max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(optIndex)}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove Option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Existing Option Values Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(watchedOptions[optIndex]?.values || []).map((val, valIdx) => (
                      <span
                        key={valIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionValue(optIndex, valIdx)}
                          className="hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Value Input */}
                  <div className="flex items-center gap-2 pt-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Add value (e.g. XL, Black, Cotton) & press Add..."
                      value={optionValueInputs[optIndex] || ""}
                      onChange={(e) =>
                        setOptionValueInputs((prev) => ({ ...prev, [optIndex]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOptionValue(optIndex, optionValueInputs[optIndex] || "");
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOptionValue(optIndex, optionValueInputs[optIndex] || "")}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold text-xs text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Variant Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateVariants}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Generate Variants
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomVariant}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Variant
                </button>
              </div>

              {variantFields.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkApplyPrice}
                    title="Apply Base Price to All Variants"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                  >
                    Bulk Set Price
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkApplyStock}
                    title="Apply Base Stock to All Variants"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                  >
                    Bulk Set Stock
                  </button>
                </div>
              )}
            </div>

            {/* Generated Variants Table */}
            {variantFields.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Variant Combination</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Price (₹)</th>
                        <th className="px-4 py-3">Discount (₹)</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3 text-center">Active</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {variantFields.map((vField, vIdx) => (
                        <tr key={vField.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {watchedVariants[vIdx]?.title || "Variant"}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`variants.${vIdx}.sku`)}
                              className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                            />
                            {errors.variants?.[vIdx]?.sku && (
                              <p className="text-[9px] text-red-600">{errors.variants[vIdx].sku.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`variants.${vIdx}.price`)}
                              type="number"
                              step="0.01"
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-500 font-bold"
                            />
                            {errors.variants?.[vIdx]?.price && (
                              <p className="text-[9px] text-red-600">{errors.variants[vIdx].price.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`variants.${vIdx}.discount_price`)}
                              type="number"
                              step="0.01"
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`variants.${vIdx}.stock`)}
                              type="number"
                              min="0"
                              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-500 font-bold text-slate-900"
                            />
                            {errors.variants?.[vIdx]?.stock && (
                              <p className="text-[9px] text-red-600">{errors.variants[vIdx].stock.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Controller
                              name={`variants.${vIdx}.is_active`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  checked={field.value !== false}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                />
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeVariant(vIdx)}
                              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Variant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
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