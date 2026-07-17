import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// STATS / METRICS
// ─────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const [
    { count: usersCount },
    { count: shopsCount },
    { count: productsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: usersCount ?? 0,
    totalShops: shopsCount ?? 0,
    totalProducts: productsCount ?? 0,
    totalOrders: 0,     // marketplace orders removed
    totalRevenue: 0,    // marketplace orders removed
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
      profiles:owner_id ( full_name, email )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOG HELPER
// ─────────────────────────────────────────────────────────────
export async function writeAuditLog(action, module, status = "success") {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action,
      module,
      status,
      ip_address: "127.0.0.1",
      browser: navigator.userAgent || "Chrome Client"
    });
  } catch (err) {
    console.warn("Failed to write audit log:", err);
  }
}

export async function toggleShopStatus(shopId, isActive) {
  const { data, error } = await supabase
    .from("shops")
    .update({ is_verified: isActive })
    .eq("id", shopId)
    .select()
    .single();

  if (error) {
    await writeAuditLog(`Failed to toggle verification for shop ${shopId}`, "Shops", "failed");
    throw error;
  }
  await writeAuditLog(`${isActive ? "Approved" : "Suspended"} organization access for ${data.shop_name}`, "Shops", "success");
  return data;
}

export async function updateShopPlan(shopId, planName) {
  const { data, error } = await supabase
    .from("shops")
    .update({ plan_name: planName })
    .eq("id", shopId)
    .select()
    .single();

  if (error) {
    await writeAuditLog(`Failed to update plan to ${planName} for shop ${shopId}`, "Plans", "failed");
    throw error;
  }
  await writeAuditLog(`Updated subscription plan for ${data.shop_name} to ${planName.toUpperCase()}`, "Plans", "success");
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
// CATEGORIES MANAGEMENT (Removed - table doesn't exist)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// ORDERS MANAGEMENT — marketplace removed
// ─────────────────────────────────────────────────────────────
export async function getAdminOrders() {
  // Orders table dropped — marketplace module removed
  return [];
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
      shop_agents:agent_id ( display_name )
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

// ─────────────────────────────────────────────────────────────
// PLATFORM CONFIGURATION & PLANS
// ─────────────────────────────────────────────────────────────
export async function getPlatformSettings() {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", "global")
    .single();

  if (error) throw error;
  return { ...data, ...(data.settings || {}) };
}

export async function updatePlatformSettings(settingsUpdates) {
  const standardKeys = [
    "maintenance_mode", 
    "allow_registration", 
    "default_plan_id", 
    "max_call_duration_seconds", 
    "global_widget_enabled"
  ];
  
  const { data: existing } = await supabase
    .from("platform_settings")
    .select("settings")
    .eq("id", "global")
    .single();
    
  const payload = { settings: { ...(existing?.settings || {}) } };
  
  for (const [key, value] of Object.entries(settingsUpdates)) {
    if (standardKeys.includes(key)) {
      payload[key] = value;
    } else {
      payload.settings[key] = value;
    }
  }

  const { data, error } = await supabase
    .from("platform_settings")
    .update(payload)
    .eq("id", "global")
    .select()
    .single();

  if (error) {
    await writeAuditLog("Failed to update platform configurations", "Settings", "failed");
    throw error;
  }
  await writeAuditLog("Updated global platform settings", "Settings", "success");
  return { ...data, ...(data.settings || {}) };
}

export async function getSubscriptionPlans() {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("monthly_price", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateSubscriptionPlan(planId, updates) {
  const { data, error } = await supabase
    .from("subscription_plans")
    .update(updates)
    .eq("id", planId)
    .select()
    .single();

  if (error) {
    await writeAuditLog(`Failed to update subscription plan ${planId}`, "Plans", "failed");
    throw error;
  }
  await writeAuditLog(`Updated subscription plan thresholds for ${planId.toUpperCase()}`, "Plans", "success");
  return data;
}
