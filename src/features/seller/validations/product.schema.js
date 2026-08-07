// ─────────────────────────────────────────────────────────────
// VARIANT & OPTION SCHEMAS
// ─────────────────────────────────────────────────────────────
export const optionSchema = z.object({
  name: z.string().min(1, "Option name is required (e.g. Size, Color)"),
  values: z
    .array(z.string().min(1, "Option value cannot be empty"))
    .min(1, "At least one value required per option"),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  options: z.record(z.string(), z.string()).optional().default({}),
  sku: z.string().min(1, "Variant SKU is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Price must be a positive number"
    ),
  discount_price: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Discount price must be a non-negative number"
    ),
  stock: z
    .string()
    .min(1, "Stock is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Stock must be a non-negative integer"
    ),
  is_active: z.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────
// PRODUCT SCHEMA
// ─────────────────────────────────────────────────────────────
export const productSchema = z
  .object({
    name: z
      .string()
      .min(2, "Product name must be at least 2 characters")
      .max(200, "Product name must be under 200 characters"),

    slug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .max(200, "Slug must be under 200 characters")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase letters, numbers, and hyphens only"
      ),

    category_id: z
      .string()
      .optional()
      .or(z.literal("")),

    description: z
      .string()
      .max(5000, "Description must be under 5000 characters")
      .optional()
      .or(z.literal("")),

    price: z
      .string()
      .min(1, "Price is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        "Price must be a positive number"
      ),

    discount_price: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
        "Discount price must be a non-negative number"
      ),

    stock: z
      .string()
      .min(1, "Stock is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Stock must be a non-negative number"
      ),

    sku: z
      .string()
      .min(2, "SKU must be at least 2 characters")
      .max(50, "SKU must be under 50 characters")
      .regex(
        /^[A-Z0-9a-z_-]+$/,
        "SKU can only contain letters, numbers, hyphens and underscores"
      ),

    thumbnail_url: z
      .string()
      .optional()
      .or(z.literal("")),

    is_active: z.boolean().default(true),

    is_featured: z.boolean().default(false),

    // Variant extension fields
    has_variants: z.boolean().default(false),

    options: z.array(optionSchema).optional().default([]),

    variants: z.array(variantSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.discount_price && data.discount_price !== "") {
        return Number(data.discount_price) < Number(data.price);
      }
      return true;
    },
    {
      message: "Discount price must be less than the original price",
      path: ["discount_price"],
    }
  )
  .refine(
    (data) => {
      if (data.has_variants) {
        return data.options && data.options.length > 0 && data.options.some((o) => o.values && o.values.length > 0);
      }
      return true;
    },
    {
      message: "Please add at least one option (e.g. Size or Color) with values",
      path: ["has_variants"],
    }
  )
  .refine(
    (data) => {
      if (data.has_variants) {
        return data.variants && data.variants.length > 0;
      }
      return true;
    },
    {
      message: "Please generate or add at least one product variant",
      path: ["has_variants"],
    }
  );

// ─────────────────────────────────────────────────────────────
// BULK ACTION SCHEMA
// ─────────────────────────────────────────────────────────────
export const bulkActionSchema = z.object({
  action: z.enum(["delete", "activate", "deactivate"]),
  ids: z
    .array(z.string().uuid())
    .min(1, "At least one product must be selected"),
});

// ─────────────────────────────────────────────────────────────
// PRODUCT FILTER SCHEMA
// ─────────────────────────────────────────────────────────────
export const productFilterSchema = z.object({
  search: z.string().optional().default(""),
  categoryId: z.string().optional().default(""),
  status: z.enum(["", "active", "inactive"]).default(""),
  stockFilter: z.enum(["", "in", "low", "out"]).default(""),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(12),
});
