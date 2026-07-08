import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// STATS / METRICS
// ─────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const [
    { count: usersCount },
    { count: shopsCount },
    { count: productsCount },
    { count: ordersCount },
    { data: ordersData },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total").neq("status", "cancelled"),
  ]);

  const totalRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  return {
    totalUsers: usersCount ?? 0,
    totalShops: shopsCount ?? 0,
    totalProducts: productsCount ?? 0,
    totalOrders: ordersCount ?? 0,
    totalRevenue,
  };
}

// ─────────────────────────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────────────────────────
export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateProfileRole(userId, role) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// SHOPS MANAGEMENT
// ─────────────────────────────────────────────────────────────
export async function getAdminShops() {
  const { data, error } = await supabase
    .from("shops")
    .select(`
      *,
      profiles:owner_id ( full_name, email ),
      categories ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function toggleShopStatus(shopId, isActive) {
  const { data, error } = await supabase
    .from("shops")
    .update({ is_verified: isActive })
    .eq("id", shopId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateShopPlan(shopId, planName) {
  const { data, error } = await supabase
    .from("shops")
    .update({ plan_name: planName })
    .eq("id", shopId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS MANAGEMENT
// ─────────────────────────────────────────────────────────────
export async function getAdminProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      shops ( name:shop_name ),
      categories ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function toggleProductFeatured(productId, isFeatured) {
  const { data, error } = await supabase
    .from("products")
    .update({ featured: isFeatured })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleProductActive(productId, isActive) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES MANAGEMENT
// ─────────────────────────────────────────────────────────────
export async function getAdminCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function createCategory(catData) {
  const slug = catData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...catData, slug })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id, catData) {
  const slug = catData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data, error } = await supabase
    .from("categories")
    .update({ ...catData, slug })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// ORDERS MANAGEMENT
// ─────────────────────────────────────────────────────────────
export async function getAdminOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:user_id ( full_name, email ),
      addresses:address_id ( * ),
      order_items (
        *,
        products ( name ),
        shops ( name:shop_name )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// CALLS MANAGEMENT
// ─────────────────────────────────────────────────────────────
export async function getAdminCalls() {
  const { data, error } = await supabase
    .from("call_logs")
    .select(`
      *,
      shops ( shop_name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getLiveRooms() {
  const { data, error } = await supabase
    .from("video_rooms")
    .select(`
      *,
      shops ( shop_name ),
      profiles:seller_id ( full_name )
    `);

  if (error) throw error;
  return data ?? [];
}

export async function deleteCallLog(logId) {
  const { error } = await supabase
    .from("call_logs")
    .delete()
    .eq("id", logId);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// CALLBACKS MANAGEMENT
// ─────────────────────────────────────────────────────────────
export async function getAdminCallbacks() {
  const { data, error } = await supabase
    .from("callback_requests")
    .select(`
      *,
      shops ( shop_name )
    `)
    .order("scheduled_time", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateCallbackStatus(callbackId, status) {
  const { data, error } = await supabase
    .from("callback_requests")
    .update({ status })
    .eq("id", callbackId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCallback(callbackId) {
  const { error } = await supabase
    .from("callback_requests")
    .delete()
    .eq("id", callbackId);

  if (error) throw error;
}
