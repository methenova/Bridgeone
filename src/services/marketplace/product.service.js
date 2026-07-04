import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// GET MARKETPLACE PRODUCTS — Full featured, public
// ─────────────────────────────────────────────────────────────
export async function getMarketplaceProducts(filters = {}) {
  const {
    search = "",
    categoryId = "",
    shopId = "",
    minPrice = null,
    maxPrice = null,
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
      categories ( id, name, slug, icon ),
      shops ( id, name:shop_name, slug, logo_url, city ),
      product_images ( id, url:image_url )
    `,
      { count: "exact" }
    )
    .eq("is_active", true);

  if (search.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`
    );
  }

  if (categoryId) query = query.eq("category_id", categoryId);
  if (shopId) query = query.eq("shop_id", shopId);
  if (minPrice !== null) query = query.gte("price", minPrice);
  if (maxPrice !== null) query = query.lte("price", maxPrice);

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
// GET PRODUCT BY ID — with full detail
// ─────────────────────────────────────────────────────────────
export async function getProductById(productId) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories ( id, name, slug, icon ),
      shops ( id, name:shop_name, slug, logo_url, city, state, description ),
      product_images ( id, url:image_url )
    `
    )
    .eq("id", productId)
    .eq("is_active", true)
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// GET RELATED PRODUCTS
// ─────────────────────────────────────────────────────────────
export async function getRelatedProducts(productId, categoryId, limit = 8) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories ( id, name, slug ),
      shops ( id, name:shop_name, logo_url ),
      product_images ( id, url:image_url )
    `
    )
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", productId)
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// GET FEATURED PRODUCTS — for landing page
// ─────────────────────────────────────────────────────────────
export async function getFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories ( id, name, slug ),
      shops ( id, name:shop_name, logo_url ),
      product_images ( id, url:image_url )
    `
    )
    .eq("is_active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// GET CATEGORIES
// ─────────────────────────────────────────────────────────────
export async function getPublicCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("name");

  if (error) throw error;

  return data ?? [];
}
