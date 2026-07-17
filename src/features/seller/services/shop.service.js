import { supabase } from "@/config/supabase";

/**
 * Get current seller shop
 */
export async function getMyShop(userId) {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .limit(1);

  if (error) throw error;

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Get Shop By Owner
 */
export async function getShopByOwner(userId) {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .limit(1);

  if (error) throw error;

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Create Shop
 */
export async function createShop(shopData) {
  // Check if a shop already exists for this owner
  const { data: existing } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", shopData.owner_id)
    .limit(1);

  if (existing && existing.length > 0) {
    // Update the existing shop instead of inserting a duplicate
    const { data, error } = await supabase
      .from("shops")
      .update(shopData)
      .eq("id", existing[0].id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // No existing shop — insert a new one
  const { data, error } = await supabase
    .from("shops")
    .insert(shopData)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update Shop
 */
export async function updateShop(shopId, shopData) {
  const { data, error } = await supabase
    .from("shops")
    .update(shopData)
    .eq("id", shopId)
    .select()
    .single();

  if (error) throw error;

  return data;
}