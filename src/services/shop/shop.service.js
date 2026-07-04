import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// GET SHOPS — Filtered + Paginated
// ─────────────────────────────────────────────────────────────
export async function getShops(filters = {}) {
  const {
    search = "",
    categoryId = "",
    city = "",
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 12,
  } = filters;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("shops")
    .select(
      `*, categories ( id, name, slug, icon )`,
      { count: "exact" }
    )
    .eq("is_verified", true);

  if (search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  }

  if (categoryId) query = query.eq("category_id", categoryId);
  if (city) query = query.ilike("city", `%${city}%`);

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    shops: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─────────────────────────────────────────────────────────────
// GET SINGLE SHOP
// ─────────────────────────────────────────────────────────────
export async function getShop(shopId) {
  const { data, error } = await supabase
    .from("shops")
    .select(`*, categories ( id, name, slug )`)
    .eq("id", shopId)
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// GET FEATURED SHOPS — for landing page
// ─────────────────────────────────────────────────────────────
export async function getFeaturedShops(limit = 6) {
  const { data, error } = await supabase
    .from("shops")
    .select(`*, categories ( id, name, slug )`)
    .eq("is_verified", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}