import { supabase } from "@/config/supabase";

/**
 * Get current seller shop
 */
export async function getMyShop(userId) {
  const { data, error } = await supabase
    .from("shops")
    .select(`
      *,
      widget_settings ( primary_color, widget_position, welcome_message, settings ),
      shop_integrations ( provider, settings )
    `)
    .eq("owner_id", userId)
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const shop = data[0];
    const ws = shop.widget_settings?.[0] || {};
    const customInt = shop.shop_integrations?.find(i => i.provider === 'custom')?.settings || {};
    
    return {
      ...shop,
      widget_color: ws.primary_color,
      widget_position: ws.widget_position,
      welcome_message: ws.welcome_message,
      business_hours: ws.settings?.business_hours,
      business_hours_config: ws.settings?.business_hours_config,
      routing_rules: ws.settings?.routing_rules,
      is_online: shop.widget_enabled,
      webhook_url: customInt.webhook_url,
      api_key: customInt.api_key,
      google_analytics_id: customInt.google_analytics_id,
      meta_pixel_id: customInt.meta_pixel_id,
      shopify_domain: customInt.shopify_domain,
      woocommerce_url: customInt.woocommerce_url
    };
  }
  
  return null;
}

/**
 * Get Shop By Owner
 */
export async function getShopByOwner(userId) {
  const { data, error } = await supabase
    .from("shops")
    .select(`
      *,
      widget_settings ( primary_color, widget_position, welcome_message, settings ),
      shop_integrations ( provider, settings )
    `)
    .eq("owner_id", userId)
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const shop = data[0];
    const ws = shop.widget_settings?.[0] || {};
    const customInt = shop.shop_integrations?.find(i => i.provider === 'custom')?.settings || {};
    
    return {
      ...shop,
      widget_color: ws.primary_color,
      widget_position: ws.widget_position,
      welcome_message: ws.welcome_message,
      business_hours: ws.settings?.business_hours,
      business_hours_config: ws.settings?.business_hours_config,
      routing_rules: ws.settings?.routing_rules,
      is_online: shop.widget_enabled,
      webhook_url: customInt.webhook_url,
      api_key: customInt.api_key,
      google_analytics_id: customInt.google_analytics_id,
      meta_pixel_id: customInt.meta_pixel_id,
      shopify_domain: customInt.shopify_domain,
      woocommerce_url: customInt.woocommerce_url
    };
  }
  
  return null;
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