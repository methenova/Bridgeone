import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// GET PRODUCTS — Filtered, Paginated
// ─────────────────────────────────────────────────────────────
export async function getProducts(shopId, filters = {}) {
  const {
    search = "",
    categoryId = "",
    status = "",
    stockFilter = "",
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 12,
  } = filters;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug,
        icon
      ),
      product_images (
        id,
        url:image_url
      )
    `,
      { count: "exact" }
    )
    .eq("shop_id", shopId);

  if (search.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`
    );
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (stockFilter === "out") {
    query = query.eq("stock", 0);
  } else if (stockFilter === "low") {
    query = query.gt("stock", 0).lte("stock", 10);
  } else if (stockFilter === "in") {
    query = query.gt("stock", 10);
  }

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─────────────────────────────────────────────────────────────
// GET SINGLE PRODUCT — with images
// ─────────────────────────────────────────────────────────────
export async function getProduct(productId) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug,
        icon
      ),
      product_images (
        id,
        url:image_url
      )
    `
    )
    .eq("id", productId)
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────
export async function createProduct(values) {
  const { data, error } = await supabase
    .from("products")
    .insert(values)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────
export async function updateProduct(id, values) {
  const { data, error } = await supabase
    .from("products")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────
export async function deleteProduct(id) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// BULK DELETE PRODUCTS
// ─────────────────────────────────────────────────────────────
export async function bulkDeleteProducts(ids) {
  const { error } = await supabase
    .from("products")
    .delete()
    .in("id", ids);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// BULK UPDATE STATUS
// ─────────────────────────────────────────────────────────────
export async function bulkUpdateStatus(ids, is_active) {
  const { error } = await supabase
    .from("products")
    .update({ is_active })
    .in("id", ids);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// GET CATEGORIES
// ─────────────────────────────────────────────────────────────
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Auto-generate URL slug from product name
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Auto-generate SKU from shop prefix + random suffix
 */
export function generateSku(shopName = "") {
  const prefix = shopName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "X") || "PRD";
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Check if SKU is unique within a shop
 */
export async function checkSkuUnique(sku, shopId, excludeId = null) {
  let query = supabase
    .from("products")
    .select("id")
    .eq("sku", sku)
    .eq("shop_id", shopId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.length === 0;
}