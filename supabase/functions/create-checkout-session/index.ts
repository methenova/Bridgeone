import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    const missingSecrets: string[] = [];
    if (!supabaseUrl) missingSecrets.push("SUPABASE_URL");
    if (!supabaseServiceKey) missingSecrets.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeSecret) missingSecrets.push("STRIPE_SECRET_KEY");

    if (missingSecrets.length > 0) {
      return new Response(
        JSON.stringify({ error: `Configuration error: Missing required production secret(s): ${missingSecrets.join(", ")}.` }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Validate user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user session" }), { status: 401, headers: corsHeaders });
    }

    const { plan, shopId, successUrl, cancelUrl } = await req.json();

    if (!plan || !shopId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: plan, shopId" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate that user is an authorized member or owner of the target shop
    const { data: isShopMember } = await supabaseAdmin
      .from("shop_members")
      .select("id")
      .eq("shop_id", shopId)
      .eq("profile_id", user.id)
      .maybeSingle();

    const { data: isShopOwner } = await supabaseAdmin
      .from("shops")
      .select("id")
      .eq("id", shopId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!isShopMember && !isShopOwner) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You are not an authorized member or owner of this shop." }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Resolve price details based on selected plan
    let priceId = "";
    if (plan === "growth") {
      priceId = Deno.env.get("STRIPE_PRICE_GROWTH") || "price_growth_placeholder";
    } else if (plan === "enterprise") {
      priceId = Deno.env.get("STRIPE_PRICE_ENTERPRISE") || "price_enterprise_placeholder";
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid pricing plan selected for paid checkout." }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.info(`[Stripe] Creating checkout session for user=${user.id} shop=${shopId} plan=${plan}`);

    // Call Stripe API to create checkout session
    const formData = new URLSearchParams();
    formData.append("mode", "subscription");
    formData.append("payment_method_types[0]", "card");
    formData.append("line_items[0][price]", priceId);
    formData.append("line_items[0][quantity]", "1");
    formData.append("success_url", successUrl || `${req.headers.get("origin")}/onboarding/installation?session_id={CHECKOUT_SESSION_ID}`);
    formData.append("cancel_url", cancelUrl || `${req.headers.get("origin")}/onboarding/subscription`);
    formData.append("metadata[user_id]", user.id);
    formData.append("metadata[shop_id]", shopId);
    formData.append("metadata[plan]", plan);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!stripeResponse.ok) {
      const stripeErr = await stripeResponse.json();
      throw new Error(`Stripe API Error: ${stripeErr.error?.message || stripeResponse.statusText}`);
    }

    const session = await stripeResponse.json();

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(`[Checkout-Error] ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
