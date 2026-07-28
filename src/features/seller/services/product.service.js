import { supabase } from "@/config/supabase";
import { executeQuery, BridgeOneError } from "@/services/api/apiHelper";

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

  // Basic Input Validation
  if (!shopId) {
    throw new BridgeOneError("Shop ID is required to retrieve products", "VALIDATION_ERROR");
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("shop_id", shopId);

  if (search.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`
    );
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

  const { data, error, count } = await executeQuery(query);

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
  if (!productId) {
    throw new BridgeOneError("Product ID is required", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()
  );

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────
export async function createProduct(values) {
  if (!values || !values.name || !values.shop_id) {
    throw new BridgeOneError("Product name and shop ID are required", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("products")
      .insert(values)
      .select()
      .single()
  );

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────
export async function updateProduct(id, values) {
  if (!id) {
    throw new BridgeOneError("Product ID is required for update", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("products")
      .update(values)
      .eq("id", id)
      .select()
      .single()
  );

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────
export async function deleteProduct(id) {
  if (!id) {
    throw new BridgeOneError("Product ID is required for deletion", "VALIDATION_ERROR");
  }

  const { error } = await executeQuery(
    supabase
      .from("products")
      .delete()
      .eq("id", id)
  );

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// BULK DELETE PRODUCTS
// ─────────────────────────────────────────────────────────────
export async function bulkDeleteProducts(ids) {
  if (!ids || ids.length === 0) {
    throw new BridgeOneError("Product IDs are required for bulk deletion", "VALIDATION_ERROR");
  }

  const { error } = await executeQuery(
    supabase
      .from("products")
      .delete()
      .in("id", ids)
  );

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// BULK UPDATE STATUS
// ─────────────────────────────────────────────────────────────
export async function bulkUpdateStatus(ids, is_active) {
  if (!ids || ids.length === 0) {
    throw new BridgeOneError("Product IDs are required for bulk status update", "VALIDATION_ERROR");
  }

  const { error } = await executeQuery(
    supabase
      .from("products")
      .update({ is_active })
      .in("id", ids)
  );

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// GET CATEGORIES
// ─────────────────────────────────────────────────────────────
export async function getCategories() {
  return [];
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
  if (!sku || !shopId) {
    throw new BridgeOneError("SKU and Shop ID are required for uniqueness check", "VALIDATION_ERROR");
  }

  let query = supabase
    .from("products")
    .select("id")
    .eq("sku", sku)
    .eq("shop_id", shopId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await executeQuery(query);

  if (error) throw error;

  return data.length === 0;
}

/**
 * Get all products belonging to a shop (simple list)
 */
export async function getProductsByShop(shopId) {
  if (!shopId) {
    throw new BridgeOneError("Shop ID is required", "VALIDATION_ERROR");
  }

  const query = supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId);

  const { data, error } = await executeQuery(query);
  if (error) throw error;

  return data ?? [];
}