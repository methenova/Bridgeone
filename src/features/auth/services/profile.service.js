import { supabase } from "@/config/supabase";
import { createAuditLog } from "@/services/audit/audit.service";

export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("getProfile error:", error.message);
    return null;
  }

  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  // Log profile update audit event
  await createAuditLog({
    userId,
    action: "profile_update",
    resource: "profile",
    resourceId: userId,
    metadata: { fields: Object.keys(updates) },
  });

  // Log role change audit event if role is updated
  if (updates.role) {
    await createAuditLog({
      userId,
      action: "role_change",
      resource: "profile",
      resourceId: userId,
      metadata: { new_role: updates.role },
    });
  }

  return data;
}