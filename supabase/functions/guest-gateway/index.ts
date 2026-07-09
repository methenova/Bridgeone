import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 1. CORS Preflight Handshake
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 2. Parse request body
    const body = await req.json();
    const { action, shopId, apiKey } = body;

    if (!action || !shopId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: action, shopId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Retrieve Shop details for key/origin validation
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, api_key, shopify_domain")
      .eq("id", shopId)
      .maybeSingle();

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: "Shop not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validate API Key
    const requestKey = apiKey || req.headers.get("x-api-key");
    if (shop.api_key && shop.api_key !== requestKey) {
      return new Response(
        JSON.stringify({ error: "Invalid API Key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Verify Origin Domain
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    if (shop.shopify_domain && shop.shopify_domain !== "*") {
      const cleanDomain = shop.shopify_domain.replace(/^(https?:\/\/)?(www\.)?/, "").split(":")[0];
      const originHost = origin.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];
      
      if (cleanDomain !== "localhost" && !originHost.includes(cleanDomain)) {
        return new Response(
          JSON.stringify({ error: `Unauthorized origin: ${origin}` }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 6. Database-Backed IP & Shop Rate Limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    
    // Clean expired limits first
    await supabaseAdmin.from("rate_limits").delete().lt("expiry", new Date().toISOString());

    // IP limits check (Max 40 requests per minute)
    const ipKey = `ip:${clientIp}`;
    const { data: ipLimit } = await supabaseAdmin.rpc("increment_rate_limit", { 
      rate_key: ipKey, 
      window_seconds: 60 
    });
    if (ipLimit && ipLimit > 40) {
      return new Response(
        JSON.stringify({ error: "Too many requests. IP rate limit exceeded." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Shop limits check (Max 150 requests per minute)
    const shopKey = `shop:${shopId}`;
    const { data: shopLimit } = await supabaseAdmin.rpc("increment_rate_limit", { 
      rate_key: shopKey, 
      window_seconds: 60 
    });
    if (shopLimit && shopLimit > 150) {
      return new Response(
        JSON.stringify({ error: "Shop rate limit exceeded." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Execute Actions
    let result = null;
    let writeError = null;

    const resolveSingle = (data: any) => Array.isArray(data) ? data[0] : data;

    if (action === "create_room") {
      const { roomCode, sellerId, offer } = body;
      const { data, error } = await supabaseAdmin
        .from("video_rooms")
        .insert({ room_code: roomCode, shop_id: shopId, seller_id: sellerId, status: "live", offer })
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else if (action === "add_candidate") {
      const { roomId, sender, candidate } = body;
      const { data, error } = await supabaseAdmin
        .from("video_candidates")
        .insert({ room_id: roomId, sender, candidate })
        .select();
      result = data;
      writeError = error;

    } else if (action === "create_call_log") {
      const { customerName, customerEmail, customerPhone, status, duration, productsShared } = body;
      const { data, error } = await supabaseAdmin
        .from("call_logs")
        .insert({ 
          shop_id: shopId, 
          customer_name: customerName, 
          customer_email: customerEmail, 
          customer_phone: customerPhone, 
          status, 
          duration,
          products_shared: productsShared
        })
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else if (action === "update_call_log") {
      const { id, duration, status, notes, csatScore, callRating } = body;
      const { data, error } = await supabaseAdmin
        .from("call_logs")
        .update({ duration, status, notes, csat_score: csatScore, call_rating: callRating })
        .eq("id", id)
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else if (action === "create_callback") {
      const { customerName, customerEmail, customerPhone, scheduledTime } = body;
      const { data, error } = await supabaseAdmin
        .from("callback_requests")
        .insert({ shop_id: shopId, customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone, scheduled_time: scheduledTime, status: "pending" })
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else if (action === "send_message") {
      const { senderId, receiverId, content, imageUrl } = body;
      const { data, error } = await supabaseAdmin
        .from("messages")
        .insert({ sender_id: senderId, receiver_id: receiverId, shop_id: shopId, content, image_url: imageUrl, read: false })
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (writeError) {
      return new Response(
        JSON.stringify({ error: writeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
