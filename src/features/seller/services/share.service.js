import { supabase } from "@/config/supabase";

/**
 * Generate a stable, publicly accessible share URL for a product.
 */
export function getProductShareUrl(product) {
  if (!product) return "";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://bridgeone.app";
  const shopId = product.shop_id || "";
  const productId = product.id || "";
  return `${origin}/widget/${shopId}?product=${productId}`;
}

/**
 * Record a product share action in the database for analytics.
 */
export async function recordProductShare({ shopId, productId, memberId = null, conversationId = null, callId = null }) {
  if (!shopId || !productId) return null;

  try {
    const { data, error } = await supabase
      .from("product_shares")
      .insert({
        shop_id: shopId,
        product_id: productId,
        shared_by_shop_member_id: memberId,
        conversation_id: conversationId,
        call_id: callId,
      })
      .select()
      .single();

    if (error) {
      console.warn("[ShareService] Non-critical share log warning:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn("[ShareService] Share record exception:", err);
    return null;
  }
}
