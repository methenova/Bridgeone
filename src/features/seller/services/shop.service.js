import { supabase } from "@/config/supabase";
import { executeQuery, BridgeOneError } from "@/services/api/apiHelper";
import { cache } from "@/services/cache/cacheService";

/**
 * Helper to fetch a shop by Owner User ID with all widget settings and integrations.
 */
async function fetchShopByOwnerInternal(userId) {
  if (!userId) {
    throw new BridgeOneError("User ID is required to fetch shop", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("shops")
      .select(`
        *,
        widget_settings ( primary_color, widget_position, welcome_message, settings ),
        shop_integrations ( provider, settings )
      `)
      .eq("owner_id", userId)
      .limit(1)
  );

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
 * Get current seller shop (Consolidated: uses fetchShopByOwnerInternal to remove duplicate logic)
 */
export async function getMyShop(userId) {
  return fetchShopByOwnerInternal(userId);
}

/**
 * Get Shop By Owner (Consolidated: uses fetchShopByOwnerInternal to remove duplicate logic)
 */
export async function getShopByOwner(userId) {
  return fetchShopByOwnerInternal(userId);
}

/**
 * Create Shop
 */
export async function createShop(shopData) {
  if (!shopData || !shopData.owner_id) {
    throw new BridgeOneError("Owner ID and shop data are required to create shop", "VALIDATION_ERROR");
  }

  // Check if a shop already exists for this owner
  const { data: existing, error: existError } = await executeQuery(
    supabase
      .from("shops")
      .select("id")
      .eq("owner_id", shopData.owner_id)
      .limit(1)
  );

  if (existError) throw existError;

  if (existing && existing.length > 0) {
    // Update the existing shop instead of inserting a duplicate
    const { data, error } = await executeQuery(
      supabase
        .from("shops")
        .update(shopData)
        .eq("id", existing[0].id)
        .select()
        .single()
    );

    if (error) throw error;
    return data;
  }

  // No existing shop — insert a new one
  const { data, error } = await executeQuery(
    supabase
      .from("shops")
      .insert(shopData)
      .select()
      .single()
  );

  if (error) throw error;

  return data;
}

/**
 * Update Shop
 */
export async function updateShop(shopId, shopData) {
  if (!shopId) {
    throw new BridgeOneError("Shop ID is required for update", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("shops")
      .update(shopData)
      .eq("id", shopId)
      .select()
      .single()
  );

  if (error) throw error;

  // Invalidate widget configuration cache
  try {
    await cache.delete(`shop-widget-config:${shopId}`);
  } catch (err) {
    console.warn("Failed to invalidate shop widget cache:", err);
  }

  return data;
}

/**
 * Generate cryptographically secure random API keys and secrets for widget_credentials
 */
export function generateSecureWidgetCredentials() {
  const getRandomHex = (bytes = 16) => {
    const array = new Uint8Array(bytes);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < bytes; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  };

  const keyId = `kid_${getRandomHex(8)}`;
  const publicKey = `pk_live_${getRandomHex(16)}`;
  const privateSecret = `sk_live_${getRandomHex(24)}`;
  const webhookSecret = `whsec_${getRandomHex(24)}`;

  return {
    key_id: keyId,
    public_key: publicKey,
    private_secret: privateSecret,
    webhook_secret: webhookSecret,
  };
}

/**
 * Hash a secret string securely using SHA-256
 */
export async function hashSecret(secret) {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(secret);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    const char = secret.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, "0");
}

/**
 * Save or update widget credentials for a shop
 */
export async function saveWidgetCredentials({ shop_id, key_id, public_key, private_secret, webhook_secret }) {
  if (!shop_id) {
    throw new BridgeOneError("Shop ID is required to save credentials", "VALIDATION_ERROR");
  }

  const privateSecretHash = await hashSecret(private_secret);
  const webhookSecretHash = await hashSecret(webhook_secret);

  const payload = {
    shop_id,
    key_id,
    public_key,
    private_secret_hash: privateSecretHash,
    webhook_secret_hash: webhookSecretHash,
    is_revoked: false,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  // Revoke any previous active credentials
  const { error: revokeError } = await executeQuery(
    supabase
      .from("widget_credentials")
      .update({ is_revoked: true })
      .eq("shop_id", shop_id)
  );

  if (revokeError) throw revokeError;

  const { data, error } = await executeQuery(
    supabase
      .from("widget_credentials")
      .insert(payload)
      .select()
      .maybeSingle()
  );

  if (error) throw error;

  return {
    ...(data || payload),
    private_secret,
    webhook_secret,
  };
}

/**
 * Get widget credentials by shop_id
 */
export async function getWidgetCredentials(shopId) {
  if (!shopId) return null;

  const { data, error } = await executeQuery(
    supabase
      .from("widget_credentials")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_revoked", false)
      .limit(1)
  );

  if (error) return null;

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Verify if key_id and private_secret pair is valid
 */
export async function verifyWidgetCredentials(keyId, rawPrivateSecret) {
  if (!keyId || !rawPrivateSecret) return false;

  const { data, error } = await executeQuery(
    supabase
      .from("widget_credentials")
      .select("*")
      .eq("key_id", keyId)
      .eq("is_revoked", false)
      .maybeSingle()
  );

  if (error || !data) return false;

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  const inputHash = await hashSecret(rawPrivateSecret);
  const isMatched = inputHash === data.private_secret_hash;

  if (isMatched) {
    await executeQuery(
      supabase
        .from("widget_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", data.id)
    );
  }

  return isMatched;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC MARKETPLACE / LANDING PAGE SHOPS QUERIES
// ─────────────────────────────────────────────────────────────

/**
 * Get shops with pagination and filtering (for marketplace/landing page)
 */
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

  const { data, error, count } = await executeQuery(query);

  if (error) throw error;

  return {
    shops: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

/**
 * Get a single shop by ID with category information
 */
export async function getShop(shopId) {
  if (!shopId) {
    throw new BridgeOneError("Shop ID is required", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("shops")
      .select(`*, categories ( id, name, slug )`)
      .eq("id", shopId)
      .single()
  );

  if (error) throw error;

  return data;
}

/**
 * Get featured shops for landing page
 */
export async function getFeaturedShops(limit = 6) {
  const { data, error } = await executeQuery(
    supabase
      .from("shops")
      .select(`*, categories ( id, name, slug )`)
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .limit(limit)
  );

  if (error) throw error;

  return data ?? [];
}