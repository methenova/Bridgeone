import { supabase } from "@/config/supabase";

/**
 * Get current seller shop
 */
export async function getMyShop(userId) {
  const { data, error } = await supabase
    .from("shops")
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Get Shop By Owner
 */
export async function getShopByOwner(userId) {
  const { data, error } = await supabase
    .from("shops")
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Create Shop
 */
export async function createShop(shopData) {
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