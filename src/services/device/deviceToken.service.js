import { supabase } from "@/config/supabase";

/**
 * Backend service for managing FCM device tokens in Supabase (`device_tokens` table).
 * Prepares backend infrastructure for future Firebase Cloud Messaging push notifications.
 */

/**
 * Register or update an FCM device token for a user.
 */
export async function registerDeviceToken({
  userId,
  deviceToken,
  platform = "web",
  deviceName = "Web Browser",
  appVersion = "1.0.0",
  osVersion = "unknown",
  deviceModel = "unknown",
  notificationPermission = "default",
}) {
  if (!userId || !deviceToken) return null;

  const payload = {
    user_id: userId,
    device_token: deviceToken,
    platform: platform,
    device_name: deviceName,
    app_version: appVersion,
    os_version: osVersion,
    device_model: deviceModel,
    notification_permission: notificationPermission,
    is_active: true,
    last_login_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("device_tokens")
      .upsert(payload, { onConflict: "device_token" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("registerDeviceToken warning:", error.message);
      return payload;
    }

    return data || payload;
  } catch (err) {
    console.warn("registerDeviceToken error:", err);
    return payload;
  }
}

/**
 * Fetch all active FCM device tokens for a user.
 */
export async function getUserDeviceTokens(userId) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("device_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("last_seen", { ascending: false });

    if (error) {
      console.warn("getUserDeviceTokens warning:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn("getUserDeviceTokens error:", err);
    return [];
  }
}

/**
 * Update last_seen timestamp for an active device token.
 */
export async function touchDeviceToken(deviceToken) {
  if (!deviceToken) return null;

  try {
    const { data, error } = await supabase
      .from("device_tokens")
      .update({
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("device_token", deviceToken)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("touchDeviceToken warning:", error.message);
    }

    return data;
  } catch (err) {
    console.warn("touchDeviceToken error:", err);
    return null;
  }
}

/**
 * Deactivate a device token (e.g. on logout or token invalidation).
 */
export async function deactivateDeviceToken(deviceToken) {
  if (!deviceToken) return null;

  try {
    const { data, error } = await supabase
      .from("device_tokens")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("device_token", deviceToken)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("deactivateDeviceToken warning:", error.message);
    }

    return data;
  } catch (err) {
    console.warn("deactivateDeviceToken error:", err);
    return null;
  }
}

/**
 * Delete a device token permanently.
 */
export async function deleteDeviceToken(deviceToken) {
  if (!deviceToken) return false;

  try {
    const { error } = await supabase
      .from("device_tokens")
      .delete()
      .eq("device_token", deviceToken);

    if (error) {
      console.warn("deleteDeviceToken warning:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("deleteDeviceToken error:", err);
    return false;
  }
}

/**
 * Automatically update or touch device tokens for a user upon successful login.
 */
export async function syncUserDeviceTokenOnLogin(userId) {
  if (!userId) return;

  try {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Web Browser";
    const isMobile = /mobile/i.test(userAgent);
    const platformName = isMobile ? "mobile_web" : "desktop_web";

    // Detect OS Version & Browser Model
    let os = "Web-based OS";
    let model = "Generic Browser";
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      if (/windows/i.test(ua)) os = "Windows";
      else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
      else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
      else if (/android/i.test(ua)) os = "Android";
      else if (/linux/i.test(ua)) os = "Linux";

      if (/chrome/i.test(ua)) model = "Chrome";
      else if (/safari/i.test(ua) && !/chrome/i.test(ua)) model = "Safari";
      else if (/firefox/i.test(ua)) model = "Firefox";
      else if (/edg/i.test(ua)) model = "Edge";
    }

    // Get notification permissions
    let permission = "default";
    if (typeof window !== "undefined" && "Notification" in window) {
      permission = window.Notification.permission;
    }

    const storedToken =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("fcm_device_token") || localStorage.getItem("device_token")
        : null;

    if (storedToken) {
      await registerDeviceToken({
        userId,
        deviceToken: storedToken,
        platform: platformName,
        deviceName: `Browser (${platformName})`,
        appVersion: "1.0.0",
        osVersion: os,
        deviceModel: model,
        notificationPermission: permission,
      });
    } else {
      const tokens = await getUserDeviceTokens(userId);
      if (tokens && tokens.length > 0) {
        await touchDeviceToken(tokens[0].device_token);
      }
    }
  } catch (err) {
    console.warn("syncUserDeviceTokenOnLogin notice:", err);
  }
}
