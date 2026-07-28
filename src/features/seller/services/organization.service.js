import { supabase } from "@/config/supabase";

/**
 * Service to manage multi-shop Organizations for BridgeOne
 */

/**
 * Fetch organization by owner ID. If none exists, creates a default organization.
 */
export async function getOrCreateOrganizationByOwner(ownerId, profileData = {}) {
  if (!ownerId) return null;

  try {
    const { data: orgs, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", ownerId)
      .limit(1);

    if (error) {
      console.warn("getOrCreateOrganizationByOwner fetch warning:", error.message);
    }

    if (orgs && orgs.length > 0) {
      return orgs[0];
    }

    // Auto-create default organization for user
    const defaultOrg = {
      owner_id: ownerId,
      organization_name: profileData.business_name || profileData.full_name ? `${profileData.full_name}'s Organization` : "Default Organization",
      business_email: profileData.email || "",
      business_phone: profileData.phone || profileData.phone_number || "",
      country: profileData.country || "US",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdOrg, error: createErr } = await supabase
      .from("organizations")
      .insert(defaultOrg)
      .select()
      .single();

    if (createErr) {
      console.warn("getOrCreateOrganizationByOwner insert warning:", createErr.message);
      return defaultOrg;
    }

    return createdOrg;
  } catch (err) {
    console.warn("getOrCreateOrganizationByOwner error:", err);
    return null;
  }
}

/**
 * Get organization details by organization ID
 */
export async function getOrganizationById(orgId) {
  if (!orgId) return null;

  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("getOrganizationById error:", err);
    return null;
  }
}

/**
 * Fetch all shops belonging to an organization ID
 */
export async function getShopsByOrganizationId(orgId) {
  if (!orgId) return [];

  try {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("organization_id", orgId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("getShopsByOrganizationId error:", err);
    return [];
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(orgId, updates) {
  if (!orgId) return null;

  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("organizations")
      .update(payload)
      .eq("id", orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("updateOrganization error:", err);
    return null;
  }
}

/**
 * Save or update organization details for an owner
 */
export async function saveOrganizationDetails(ownerId, details) {
  if (!ownerId) return null;
  try {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", ownerId)
      .limit(1);

    const existing = orgs && orgs.length > 0 ? orgs[0] : null;

    if (existing?.id) {
      return await updateOrganization(existing.id, details);
    } else {
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          owner_id: ownerId,
          ...details,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.warn("saveOrganizationDetails error:", err);
    throw err;
  }
}
