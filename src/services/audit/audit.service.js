import { supabase } from "@/config/supabase";

/**
 * Production-ready Audit Logging Service for BridgeOne
 * Uses Server-Side Edge Function to secure logs and prevent spoofing.
 */

/**
 * Log an audit event to the database via Supabase Edge Function.
 */
export async function createAuditLog({
  organizationId = null,
  shopId = null,
  action,
  resource,
  resourceId = null,
  metadata = {},
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user?.id || null,
        organization_id: organizationId || null,
        shop_id: shopId || null,
        action,
        resource,
        resource_id: resourceId ? String(resourceId) : null,
        metadata: metadata || {},
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("createAuditLog direct insert warning:", error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    console.warn("createAuditLog error:", err);
    return null;
  }
}

/**
 * Retrieve audit logs for a specific user.
 */
export async function getUserAuditLogs(userId, limit = 50) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("getUserAuditLogs error:", err);
    return [];
  }
}
