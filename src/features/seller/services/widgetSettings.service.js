import { supabase } from "@/config/supabase";
import { generateSecureWidgetCredentials, saveWidgetCredentials } from "./shop.service";

/**
 * Service for managing Seller Widget configuration and analytics
 */

export async function fetchWidgetAnalytics(shopId) {
  if (!shopId) return { sessions: [], calls: [] };

  const [sessionsRes, callsRes] = await Promise.all([
    supabase
      .from("visitor_sessions")
      .select("id, current_page_url, started_at, last_activity_at, created_at")
      .eq("shop_id", shopId),
    supabase
      .from("call_logs")
      .select("id, status, duration_seconds, created_at")
      .eq("shop_id", shopId),
  ]);

  if (sessionsRes.error) throw sessionsRes.error;
  if (callsRes.error) throw callsRes.error;

  return {
    sessions: sessionsRes.data || [],
    calls: callsRes.data || [],
  };
}

export async function updateWidgetSettings(shopId, { isOnline, logoUrl, widgetColor, widgetPosition, welcomeMessage, businessHours }) {
  if (!shopId) return;

  // 1. Update shops table for root configuration
  const { error: shopError } = await supabase
    .from("shops")
    .update({
      widget_enabled: isOnline,
      logo_url: logoUrl,
    })
    .eq("id", shopId);

  if (shopError) throw shopError;

  // 2. Fetch current widget_settings to preserve existing settings jsonb
  const { data: ws } = await supabase
    .from("widget_settings")
    .select("settings")
    .eq("shop_id", shopId)
    .maybeSingle();

  const currentSettings = ws?.settings || {};

  // 3. Update widget_settings table for widget-specific UI configuration
  const { error: widgetError } = await supabase
    .from("widget_settings")
    .update({
      primary_color: widgetColor,
      widget_position: widgetPosition,
      welcome_message: welcomeMessage,
      settings: {
        ...currentSettings,
        business_hours: businessHours,
      },
    })
    .eq("shop_id", shopId);

  if (widgetError) throw widgetError;
}

export async function rotateWidgetToken(shopId) {
  if (!shopId) return null;

  const secureCreds = generateSecureWidgetCredentials();
  const newKey = secureCreds.key_id;

  // 1. Update shops table
  const { error: shopError } = await supabase
    .from("shops")
    .update({ widget_key: newKey })
    .eq("id", shopId);

  if (shopError) throw shopError;

  // 2. Synchronize to widget_credentials table
  await saveWidgetCredentials({
    shop_id: shopId,
    key_id: secureCreds.key_id,
    public_key: secureCreds.public_key,
    private_secret: secureCreds.private_secret,
    allowed_domains: ["*"],
  });

  return newKey;
}
