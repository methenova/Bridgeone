import { supabase } from "@/config/supabase";
import { executeQuery, BridgeOneError } from "@/services/api/apiHelper";

// ─────────────────────────────────────────────────────────────
// PRE-DEFINED REUSABLE POPIN TEMPLATES
// ─────────────────────────────────────────────────────────────
export const POPIN_TEMPLATES = [
  {
    id: "welcome_greeting",
    name: "Welcome Greeting",
    tagline: "Greet new visitors after 5 seconds",
    title: "Need help finding the right product?",
    message: "Our expert sales team is live and ready to answer your questions on a 1-on-1 video call.",
    trigger_type: "delay",
    trigger_delay_seconds: 5,
    trigger_scroll_percent: 50,
    page_target_type: "all",
    page_target_urls: [],
    frequency_limit: "once_per_session",
    cta_text: "Talk to Expert Live",
    cta_action: "start_call",
    cta_url: "",
    theme_color: "#2563eb",
    template_type: "welcome",
  },
  {
    id: "exit_intent_saver",
    name: "Exit-Intent Saver",
    tagline: "Catch visitors before they leave your store",
    title: "Wait! Don't leave without asking us",
    message: "Have questions about sizing, delivery, or custom orders? Speak to an agent instantly.",
    trigger_type: "exit_intent",
    trigger_delay_seconds: 0,
    trigger_scroll_percent: 50,
    page_target_type: "all",
    page_target_urls: [],
    frequency_limit: "once_per_visitor",
    cta_text: "Connect With Sales",
    cta_action: "start_call",
    cta_url: "",
    theme_color: "#e11d48",
    template_type: "exit_intent",
  },
  {
    id: "cart_abandonment",
    name: "Cart & Checkout Rescue",
    tagline: "Target visitors on checkout or cart pages",
    title: "Need help completing your order?",
    message: "We can help verify product options, apply discount codes, or confirm shipping timelines.",
    trigger_type: "delay",
    trigger_delay_seconds: 3,
    trigger_scroll_percent: 50,
    page_target_type: "specific",
    page_target_urls: ["/cart", "/checkout"],
    frequency_limit: "once_per_session",
    cta_text: "Ask a Specialist",
    cta_action: "start_call",
    cta_url: "",
    theme_color: "#059669",
    template_type: "cart_abandonment",
  },
  {
    id: "scroll_engagement",
    name: "Deep Scroll Engagement",
    tagline: "Trigger when visitor scrolls 50% down a page",
    title: "Enjoying our catalog?",
    message: "See something you like? Click below to start a live video demonstration with our team.",
    trigger_type: "scroll",
    trigger_delay_seconds: 5,
    trigger_scroll_percent: 50,
    page_target_type: "all",
    page_target_urls: [],
    frequency_limit: "once_per_session",
    cta_text: "Request Live Demo",
    cta_action: "start_call",
    cta_url: "",
    theme_color: "#7c3aed",
    template_type: "special_offer",
  },
];

// ─────────────────────────────────────────────────────────────
// CRUD SERVICE OPERATIONS
// ─────────────────────────────────────────────────────────────

export async function getPopins(shopId) {
  if (!shopId) {
    throw new BridgeOneError("Shop ID is required", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("popins")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
  );

  if (error) throw error;
  return data ?? [];
}

export async function createPopin(shopId, values) {
  if (!shopId) {
    throw new BridgeOneError("Shop ID is required", "VALIDATION_ERROR");
  }
  if (!values.title || !values.message) {
    throw new BridgeOneError("Title and message are required", "VALIDATION_ERROR");
  }

  const payload = {
    ...values,
    shop_id: shopId,
    trigger_delay_seconds: Number(values.trigger_delay_seconds || 5),
    trigger_scroll_percent: Number(values.trigger_scroll_percent || 50),
    page_target_urls: Array.isArray(values.page_target_urls) ? values.page_target_urls : [],
    is_active: values.is_active ?? true,
  };

  const { data, error } = await executeQuery(
    supabase.from("popins").insert(payload).select().single()
  );

  if (error) throw error;
  return data;
}

export async function updatePopin(popinId, values) {
  if (!popinId) {
    throw new BridgeOneError("Popin ID is required", "VALIDATION_ERROR");
  }

  const payload = {
    ...values,
    trigger_delay_seconds: Number(values.trigger_delay_seconds || 5),
    trigger_scroll_percent: Number(values.trigger_scroll_percent || 50),
    page_target_urls: Array.isArray(values.page_target_urls) ? values.page_target_urls : [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await executeQuery(
    supabase.from("popins").update(payload).eq("id", popinId).select().single()
  );

  if (error) throw error;
  return data;
}

export async function deletePopin(popinId) {
  if (!popinId) {
    throw new BridgeOneError("Popin ID is required", "VALIDATION_ERROR");
  }

  const { error } = await executeQuery(
    supabase.from("popins").delete().eq("id", popinId)
  );

  if (error) throw error;
}

export async function togglePopinStatus(popinId, is_active) {
  if (!popinId) {
    throw new BridgeOneError("Popin ID is required", "VALIDATION_ERROR");
  }

  const { data, error } = await executeQuery(
    supabase
      .from("popins")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", popinId)
      .select()
      .single()
  );

  if (error) throw error;
  return data;
}

export async function recordPopinImpression(popinId) {
  if (!popinId) return;
  try {
    await supabase.rpc("increment_popin_impressions", { p_popin_id: popinId });
  } catch (err) {
    // Fallback direct query update if RPC not present
    const { data } = await supabase.from("popins").select("impressions_count").eq("id", popinId).single();
    if (data) {
      await supabase.from("popins").update({ impressions_count: (data.impressions_count || 0) + 1 }).eq("id", popinId);
    }
  }
}

export async function recordPopinConversion(popinId) {
  if (!popinId) return;
  try {
    await supabase.rpc("increment_popin_conversions", { p_popin_id: popinId });
  } catch (err) {
    const { data } = await supabase.from("popins").select("conversions_count").eq("id", popinId).single();
    if (data) {
      await supabase.from("popins").update({ conversions_count: (data.conversions_count || 0) + 1 }).eq("id", popinId);
    }
  }
}
