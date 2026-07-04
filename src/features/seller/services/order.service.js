import { supabase } from "@/config/supabase";

/**
 * Get all order items belonging to the seller's shop, with customer, shipping address, and product details.
 */
export async function getSellerOrderItems(shopId) {
  const { data, error } = await supabase
    .from("order_items")
    .select(`
      *,
      orders!inner (
        id,
        user_id,
        status,
        subtotal,
        discount,
        delivery_fee,
        total,
        coupon_code,
        payment_method,
        payment_id,
        created_at,
        profiles:user_id (
          full_name,
          email
        ),
        addresses:address_id (
          *
        )
      ),
      products (
        id,
        name,
        thumbnail_url,
        sku
      )
    `)
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Update the status of an order.
 */
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
