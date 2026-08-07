import { supabase } from "@/config/supabase";
import { createAuditLog } from "@/services/audit/audit.service";
import { saveWidgetCredentials, generateSecureWidgetCredentials } from "@/services/shop/shopService";

/**
 * Evaluates the user's progress and returns the URL route for the last incomplete onboarding step.
 *
 * Steps:
 * 1. /onboarding/profile     - Personal profile details (Phone, Country, Timezone in profiles table)
 * 2. /onboarding/business    - Primary organization details (temporary state)
 * 3. /onboarding/workspace   - Workspace details (temporary state)
 * 4. /onboarding/subscription- Plan selection (temporary state)
 * 5. /onboarding/installation- Final integration guide & dashboard launch
 */
export async function getNextOnboardingStep(user, profile) {
  if (!user) return "/login";
  if (profile?.onboarding_completed === true || profile?.current_onboarding_step === "completed") {
    return "/dashboard";
  }

  const stepRouteMap = {
    1: "/onboarding/profile",
    2: "/onboarding/business",
    3: "/onboarding/workspace",
    4: "/onboarding/subscription",
    5: "/onboarding/installation",
    profile: "/onboarding/profile",
    business: "/onboarding/business",
    workspace: "/onboarding/workspace",
    subscription: "/onboarding/subscription",
    complete: "/onboarding/installation",
    installation: "/onboarding/installation",
  };

  const step = profile?.current_onboarding_step;
  if (step && stepRouteMap[step]) {
    return stepRouteMap[step];
  }

  // Fallback check on profile completeness
  const hasProfileDetails =
    Boolean(profile?.phone || profile?.phone_number) &&
    Boolean(profile?.country) &&
    Boolean(profile?.timezone);

  if (!hasProfileDetails) {
    return "/onboarding/profile";
  }

  return "/onboarding/business";
}

/**
 * Save temporary step data into profiles.onboarding_metadata
 */
export async function saveTemporaryOnboardingState(userId, stepMetadata) {
  if (!userId) return null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_metadata")
      .eq("id", userId)
      .single();

    const mergedMetadata = {
      ...(profile?.onboarding_metadata || {}),
      ...stepMetadata,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update({
        onboarding_metadata: mergedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("saveTemporaryOnboardingState error:", err);
    throw err;
  }
}

/**
 * Create or update all onboarding database records (Organization, Shop, Widget Credentials, Subscription)
 * in an idempotent sequence with non-destructive updates and selective rollback on failure.
 */
export async function finalizeOnboarding(userId, metadata) {
  if (!userId || !metadata) {
    throw new Error("Missing user ID or onboarding metadata.");
  }

  const tracking = {
    isNewOrg: false,
    isNewShop: false,
    isNewCreds: false,
    isNewSub: false,
    orgId: null,
    shopId: null,
    credentialsId: null,
    subscriptionId: null,
  };

  const now = new Date().toISOString();

  try {
    // 1. Organization Handling (Idempotent Check & Update/Insert)
    const { data: existingOrg, error: findOrgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findOrgErr) throw findOrgErr;

    const orgPayload = {
      owner_id: userId,
      organization_name: metadata.businessName || "Default Organization",
      business_email: metadata.businessEmail || "",
      business_phone: metadata.businessPhone || "",
      country: metadata.country || null,
      gst_number: metadata.gstNumber || null,
      status: "active",
      updated_at: now,
    };

    let orgData;
    if (existingOrg) {
      const { data: updatedOrg, error: updateOrgErr } = await supabase
        .from("organizations")
        .update(orgPayload)
        .eq("id", existingOrg.id)
        .select()
        .single();

      if (updateOrgErr) throw updateOrgErr;
      orgData = updatedOrg;
    } else {
      const { data: newOrg, error: insertOrgErr } = await supabase
        .from("organizations")
        .insert({
          ...orgPayload,
          created_at: now,
        })
        .select()
        .single();

      if (insertOrgErr) throw insertOrgErr;
      orgData = newOrg;
      tracking.isNewOrg = true;
    }
    tracking.orgId = orgData.id;

    // 2. Shop Handling (Idempotent Check & Update/Insert)
    const { data: existingShop, error: findShopErr } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findShopErr) throw findShopErr;

    const category = metadata.businessCategory || "Fashion & Apparel";

    const shopPayload = {
      owner_id: userId,
      organization_id: orgData.id,
      business_name: metadata.businessName || "",
      shop_name: metadata.shopName || metadata.businessName || "",
      business_email: metadata.businessEmail || "",
      email: metadata.businessEmail || "",
      business_phone: metadata.businessPhone || "",
      phone: metadata.businessPhone || "",
      website: metadata.businessWebsite || "",
      logo_url: metadata.logoPreview || null,
      logo: metadata.logoPreview || null,
      address: metadata.address || null,
      city: metadata.city || null,
      state: metadata.state || null,
      country: metadata.country || null,
      pincode: metadata.pincode || null,
      timezone: "UTC",
      status: metadata.selectedPlan === "starter" ? "active" : "suspended",
      is_verified: false,
      widget_enabled: true,
      category: category,
      gst_number: metadata.gstNumber || null,
      working_hours: metadata.workingHours || "Mon-Fri: 09:00 - 18:00",
      currency: metadata.currency || "USD",
      language: metadata.defaultLanguage || "en",
      expected_visitors: metadata.monthlyVisitors || "10k-50k",
      number_of_agents: metadata.agentCount || "1-5",
      updated_at: now,
    };

    let shopData;
    if (existingShop) {
      const { data: updatedShop, error: updateShopErr } = await supabase
        .from("shops")
        .update(shopPayload)
        .eq("id", existingShop.id)
        .select()
        .single();

      if (updateShopErr) throw updateShopErr;
      shopData = updatedShop;
    } else {
      const { data: newShop, error: insertShopErr } = await supabase
        .from("shops")
        .insert({
          ...shopPayload,
          created_at: now,
        })
        .select()
        .single();

      if (insertShopErr) throw insertShopErr;
      shopData = newShop;
      tracking.isNewShop = true;
    }
    tracking.shopId = shopData.id;

    // 3. Widget Credentials Handling (Preserve existing keys if present)
    let credsData = await getWidgetCredentials(shopData.id);

    if (!credsData) {
      const secureCreds = generateSecureWidgetCredentials();
      credsData = await saveWidgetCredentials({
        shop_id: shopData.id,
        key_id: secureCreds.key_id,
        public_key: secureCreds.public_key,
        private_secret: secureCreds.private_secret,
        webhook_secret: secureCreds.webhook_secret,
      });

      if (!credsData || !credsData.id) {
        throw new Error("Failed to generate widget credentials securely.");
      }
      tracking.isNewCreds = true;
    }
    tracking.credentialsId = credsData.id;

    // Also update widget keys on shops table for backward compatibility
    if (credsData.key_id || credsData.public_key) {
      await supabase
        .from("shops")
        .update({
          widget_key: credsData.key_id || credsData.widget_key,
          api_key: credsData.public_key || credsData.public_api_key,
        })
        .eq("id", shopData.id);
    }

    // 4. Subscription Handling (Idempotent Check & Update/Insert)
    const { data: existingSub, error: findSubErr } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("shop_id", shopData.id)
      .maybeSingle();

    if (findSubErr) throw findSubErr;

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const selectedPlan = metadata.selectedPlan || "starter";

    const subscriptionPayload = {
      shop_id: shopData.id,
      user_id: userId,
      owner_id: userId,
      plan: selectedPlan,
      plan_name: selectedPlan,
      status: selectedPlan === "starter" ? "trialing" : "incomplete",
      billing_cycle: "monthly",
      trial_end: trialEndDate.toISOString(),
      updated_at: now,
    };

    let subData;
    if (existingSub) {
      const { data: updatedSub, error: updateSubErr } = await supabase
        .from("subscriptions")
        .update(subscriptionPayload)
        .eq("id", existingSub.id)
        .select()
        .single();

      if (updateSubErr) throw updateSubErr;
      subData = updatedSub;
    } else {
      const { data: newSub, error: insertSubErr } = await supabase
        .from("subscriptions")
        .insert({
          ...subscriptionPayload,
          created_at: now,
        })
        .select()
        .single();

      if (insertSubErr) throw insertSubErr;
      subData = newSub;
      tracking.isNewSub = true;
    }
    tracking.subscriptionId = subData.id;

    // 5. Update profile current_onboarding_step to 5 (installation)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        current_onboarding_step: 5,
        updated_at: now,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // Log business update audit event
    await createAuditLog({
      userId,
      organizationId: orgData.id,
      shopId: shopData.id,
      action: "business_update",
      resource: "business",
      resourceId: orgData.id,
      metadata: { businessName: metadata.businessName },
    });

    if (tracking.isNewCreds) {
      await createAuditLog({
        userId,
        organizationId: orgData.id,
        shopId: shopData.id,
        action: "widget_generation",
        resource: "widget",
        resourceId: credsData.id,
      });

      await createAuditLog({
        userId,
        organizationId: orgData.id,
        shopId: shopData.id,
        action: "api_key_generation",
        resource: "widget",
        resourceId: credsData.id,
      });
    }

    await createAuditLog({
      userId,
      organizationId: orgData.id,
      shopId: shopData.id,
      action: "subscription_change",
      resource: "subscription",
      resourceId: subData.id,
      metadata: { plan: metadata.selectedPlan },
    });

    return {
      success: true,
      shop: shopData,
      organization: orgData,
      widgetCredentials: credsData,
      subscription: subData,
    };
  } catch (error) {
    console.error("Error during finalizeOnboarding, starting rollback...", error);

    // Roll back only newly created entities to prevent orphan data while preserving pre-existing data
    if (tracking.isNewSub && tracking.subscriptionId) {
      await supabase.from("subscriptions").delete().eq("id", tracking.subscriptionId);
    }
    if (tracking.isNewCreds && tracking.credentialsId) {
      await supabase.from("widget_credentials").delete().eq("id", tracking.credentialsId);
    }
    if (tracking.isNewShop && tracking.shopId) {
      await supabase.from("shops").delete().eq("id", tracking.shopId);
    }
    if (tracking.isNewOrg && tracking.orgId) {
      await supabase.from("organizations").delete().eq("id", tracking.orgId);
    }

    throw new Error(error.message || "Failed to finalize onboarding. Selective rollback completed.");
  }
}

