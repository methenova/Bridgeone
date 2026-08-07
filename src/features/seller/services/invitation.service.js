import { supabase } from "@/config/supabase";

/**
 * Create a new email invitation for a shop agent.
 * Prevents duplicate invitations for the same email + shop combination.
 */
export async function createInvitation(shopId, invitedBy, email, role = "agent") {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !shopId || !invitedBy) {
    throw new Error("Shop ID, inviter ID, and email are required.");
  }

  // Check for existing pending invitation
  const { data: existing, error: checkErr } = await supabase
    .from("shop_invitations")
    .select("id, status")
    .eq("shop_id", shopId)
    .eq("email", cleanEmail)
    .maybeSingle();

  if (checkErr) throw checkErr;

  if (existing && existing.status === "pending") {
    throw new Error("An invitation for this email is already pending.");
  }

  // If a previous cancelled/expired invitation exists, update it instead
  if (existing) {
    const { data, error } = await supabase
      .from("shop_invitations")
      .update({
        status: "pending",
        role,
        invited_by: invitedBy,
        token: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Insert new invitation
  const { data, error } = await supabase
    .from("shop_invitations")
    .insert({
      shop_id: shopId,
      invited_by: invitedBy,
      email: cleanEmail,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all invitations for a shop (pending and expired).
 */
export async function getShopInvitations(shopId) {
  if (!shopId) return [];

  const { data, error } = await supabase
    .from("shop_invitations")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Cancel (delete) a pending invitation.
 */
export async function cancelInvitation(invitationId) {
  const { error } = await supabase
    .from("shop_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) throw error;
}

/**
 * Resend an invitation by resetting the expiry date.
 */
export async function resendInvitation(invitationId) {
  const { data, error } = await supabase
    .from("shop_invitations")
    .update({
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      status: "pending",
    })
    .eq("id", invitationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
