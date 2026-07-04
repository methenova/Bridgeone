import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// GET WISHLIST
// ─────────────────────────────────────────────────────────────
export async function getWishlist(userId) {
  const { data, error } = await supabase
    .from("wishlist")
    .select(`
      id,
      product_id,
      products (
        *,
        categories ( id, name, slug ),
        shops ( id, name:shop_name, logo_url ),
        product_images ( id, url:image_url )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// ADD TO WISHLIST
// ─────────────────────────────────────────────────────────────
export async function addToWishlist(userId, productId) {
  const { data, error } = await supabase
    .from("wishlist")
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// REMOVE FROM WISHLIST
// ─────────────────────────────────────────────────────────────
export async function removeFromWishlist(userId, productId) {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;
}
