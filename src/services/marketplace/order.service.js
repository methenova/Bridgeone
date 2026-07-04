import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// CREATE ORDER + ORDER ITEMS (atomic)
// ─────────────────────────────────────────────────────────────
export async function createOrder({
  userId,
  addressId,
  items,        // [{ product, quantity }]
  subtotal,
  discount,
  deliveryFee,
  total,
  couponCode,
  paymentId,
  razorpayOrderId,
  paymentMethod = "razorpay",
}) {
  // 1. Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      address_id: addressId,
      subtotal,
      discount: discount ?? 0,
      delivery_fee: deliveryFee ?? 0,
      total,
      coupon_code: couponCode || null,
      payment_id: paymentId || null,
      razorpay_order_id: razorpayOrderId || null,
      payment_method: paymentMethod,
      status: "pending",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    shop_id: item.product.shop_id,
    quantity: item.quantity,
    price: Number(item.product.price),
    discount_price: item.product.discount_price
      ? Number(item.product.discount_price)
      : null,
    total:
      (item.product.discount_price
        ? Number(item.product.discount_price)
        : Number(item.product.price)) * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw itemsError;

  return order;
}

// ─────────────────────────────────────────────────────────────
// GET USER ORDERS
// ─────────────────────────────────────────────────────────────
export async function getOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      addresses ( name, city, state, pincode ),
      order_items (
        *,
        products (
          id, name, thumbnail_url
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// GET SINGLE ORDER
// ─────────────────────────────────────────────────────────────
export async function getOrder(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      addresses ( * ),
      order_items (
        *,
        products (
          id, name, thumbnail_url, price, discount_price
        ),
        shops ( id, name:shop_name, logo_url )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// VALIDATE COUPON
// ─────────────────────────────────────────────────────────────
export async function validateCoupon(code, subtotal) {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Invalid or expired coupon code");
  }

  const now = new Date();

  if (data.expires_at && new Date(data.expires_at) < now) {
    throw new Error("This coupon has expired");
  }

  if (data.usage_limit && data.used_count >= data.usage_limit) {
    throw new Error("This coupon has reached its usage limit");
  }

  if (subtotal < data.min_order_value) {
    throw new Error(
      `Minimum order value of ₹${data.min_order_value} required for this coupon`
    );
  }

  // Calculate discount
  let discountAmount = 0;

  if (data.discount_type === "percent") {
    discountAmount = (subtotal * data.discount_value) / 100;
    if (data.max_discount) {
      discountAmount = Math.min(discountAmount, data.max_discount);
    }
  } else {
    discountAmount = Math.min(data.discount_value, subtotal);
  }

  return {
    coupon: data,
    discountAmount: Math.round(discountAmount * 100) / 100,
  };
}
