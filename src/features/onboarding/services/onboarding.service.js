import { supabase } from "@/config/supabase";
import { createAuditLog } from "@/services/audit/audit.service";
import { saveWidgetCredentials, generateSecureWidgetCredentials } from "@/features/seller/services/shop.service";

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
 * Create all onboarding database records (Organization, Shop, Widget Credentials, Subscription)
 * in a transaction-like sequence with manual rollback on failure.
 */
export async function finalizeOnboarding(userId, metadata) {
  if (!userId || !metadata) {
    throw new Error("Missing user ID or onboarding metadata.");
  }

  const createdEntities = {
    orgId: null,
    shopId: null,
    credentialsId: null,
    subscriptionId: null,
  };

  const now = new Date().toISOString();

  try {
    // 1. Create Organization
    const orgPayload = {
      owner_id: userId,
      organization_name: metadata.businessName || "Default Organization",
      business_email: metadata.businessEmail || "",
      business_phone: metadata.businessPhone || "",
      country: metadata.country || null,
      gst_number: metadata.gstNumber || null,
      status: "active",
      created_at: now,
      updated_at: now,
    };

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert(orgPayload)
      .select()
      .single();

    if (orgError) throw orgError;
    createdEntities.orgId = orgData.id;

    // 2. Create Shop
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", metadata.businessCategory || "fashion_apparel")
      .maybeSingle();

    const categoryId = categoryData?.id || null;

    const cleanDomain = (metadata.businessWebsite || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");

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
      category_id: categoryId,
      gst_number: metadata.gstNumber || null,
      working_hours: metadata.workingHours || "Mon-Fri: 09:00 - 18:00",
      currency: metadata.currency || "USD",
      language: metadata.defaultLanguage || "en",
      expected_visitors: metadata.monthlyVisitors || "10k-50k",
      number_of_agents: metadata.agentCount || "1-5",
      created_at: now,
      updated_at: now,
    };

    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .insert(shopPayload)
      .select()
      .single();

    if (shopError) throw shopError;
    createdEntities.shopId = shopData.id;

    // 3. Create Widget Credentials
    const secureCreds = generateSecureWidgetCredentials();

    const credsData = await saveWidgetCredentials({
      shop_id: shopData.id,
      key_id: secureCreds.key_id,
      public_key: secureCreds.public_key,
      private_secret: secureCreds.private_secret,
      webhook_secret: secureCreds.webhook_secret,
    });

    if (!credsData || !credsData.id) {
      throw new Error("Failed to generate widget credentials securely.");
    }
    createdEntities.credentialsId = credsData.id;

    // Also update widget keys on shops table for backward compatibility
    await supabase
      .from("shops")
      .update({
        widget_key: secureCreds.key_id,
        api_key: secureCreds.public_key,
      })
      .eq("id", shopData.id);

    // 4. Create Subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const subscriptionPayload = {
      shop_id: shopData.id,
      user_id: userId,
      owner_id: userId,
      plan: metadata.selectedPlan || "growth",
      plan_name: metadata.selectedPlan || "growth",
      status: metadata.selectedPlan === "starter" ? "trialing" : "incomplete",
      billing_cycle: "monthly",
      trial_end: trialEndDate.toISOString(),
      created_at: now,
      updated_at: now,
    };

    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .insert(subscriptionPayload)
      .select()
      .single();

    if (subError) throw subError;
    createdEntities.subscriptionId = subData.id;

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

    // Log widget credentials generation audit event
    await createAuditLog({
      userId,
      organizationId: orgData.id,
      shopId: shopData.id,
      action: "widget_generation",
      resource: "widget",
      resourceId: credsData.id,
    });

    // Log API keys generation audit event
    await createAuditLog({
      userId,
      organizationId: orgData.id,
      shopId: shopData.id,
      action: "api_key_generation",
      resource: "widget",
      resourceId: credsData.id,
    });

    // Log subscription selection audit event
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

    // Manual Rollback implementation to prevent orphan data
    if (createdEntities.subscriptionId) {
      await supabase.from("subscriptions").delete().eq("id", createdEntities.subscriptionId);
    }
    if (createdEntities.credentialsId) {
      await supabase.from("widget_credentials").delete().eq("id", createdEntities.credentialsId);
    }
    if (createdEntities.shopId) {
      await supabase.from("shops").delete().eq("id", createdEntities.shopId);
    }
    if (createdEntities.orgId) {
      await supabase.from("organizations").delete().eq("id", createdEntities.orgId);
    }

    throw new Error(error.message || "Failed to finalize onboarding. Rollback completed.");
  }
}
