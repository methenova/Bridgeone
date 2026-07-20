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
      const cleanDomain = shop.shopify_domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];
      const originHost = origin.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];

      const isLocalhost = originHost === "localhost" || originHost === "127.0.0.1" || originHost === "" || originHost.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);
      const isPlatformHost = originHost.includes("digimirai.com") || originHost.includes("bridgeone.cloud") || originHost.includes("localhost");

      if (!isLocalhost && !isPlatformHost && cleanDomain !== "localhost" && !originHost.includes(cleanDomain)) {
        return new Response(
          JSON.stringify({ error: `Unauthorized origin: ${origin}` }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 6. Database-Backed IP & Shop Rate Limiting (Fail-Safe)
    try {
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
    } catch (_rateErr) {
      // Graceful fallback if rate_limits table or increment_rate_limit RPC is not present
    }

    // ── Helper: Resolve or create a visitor record ──
    async function resolveVisitor(
      name?: string,
      email?: string,
      phone?: string
    ): Promise<string> {
      if (email) {
        const { data: existing } = await supabaseAdmin
          .from("visitors")
          .select("id")
          .eq("shop_id", shopId)
          .eq("email", email)
          .maybeSingle();
        if (existing) {
          await supabaseAdmin
            .from("visitors")
            .update({
              last_seen_at: new Date().toISOString(),
              ...(name ? { name } : {}),
              ...(phone ? { phone } : {}),
            })
            .eq("id", existing.id);
          return existing.id;
        }
      }

      const visitorKey = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const { data: newVisitor, error: visitorErr } = await supabaseAdmin
        .from("visitors")
        .insert({
          shop_id: shopId,
          visitor_key: visitorKey,
          name: name || "Anonymous Visitor",
          email: email || null,
          phone: phone || null,
          status: "online",
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (visitorErr) throw visitorErr;
      return newVisitor.id;
    }

    // ── Helper: Resolve or create a conversation ──
    async function resolveConversation(
      visitorId: string,
      channel: string = "video"
    ): Promise<string> {
      const { data: existing } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("shop_id", shopId)
        .eq("visitor_id", visitorId)
        .in("status", ["waiting", "assigned", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) return existing.id;

      const { data: newConvo, error: convoErr } = await supabaseAdmin
        .from("conversations")
        .insert({
          shop_id: shopId,
          visitor_id: visitorId,
          channel,
          status: "waiting",
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (convoErr) throw convoErr;
      return newConvo.id;
    }

    // ── Helper: Safely resolve agent_id for video_rooms FK constraint ──
    async function resolveValidAgentId(givenId?: string | null): Promise<string | null> {
      if (!givenId) return null;

      // 1. Direct check: is givenId a valid shop_agents.id?
      const { data: directAgent } = await supabaseAdmin
        .from("shop_agents")
        .select("id")
        .eq("id", givenId)
        .maybeSingle();

      if (directAgent) return directAgent.id;

      // 2. Profile check: is givenId a profile_id belonging to a shop_member?
      const { data: memberAgent } = await supabaseAdmin
        .from("shop_agents")
        .select("id, shop_member:shop_member_id(profile_id)")
        .maybeSingle();

      if (memberAgent && (memberAgent.shop_member as any)?.profile_id === givenId) {
        return memberAgent.id;
      }

      // If not a valid shop_agents ID, return null to avoid Foreign Key Violation (FK)
      return null;
    }

    // 7. Execute Actions
    let result: any = null;
    let writeError: any = null;

    const resolveSingle = (data: any) => Array.isArray(data) ? data[0] : data;

    if (action === "create_room") {
      const { roomCode, sellerId, offer, customerName, customerEmail, customerPhone } = body;

      const visitorId = await resolveVisitor(customerName, customerEmail, customerPhone);
      const conversationId = await resolveConversation(visitorId, "video");
      const validAgentId = await resolveValidAgentId(sellerId);

      const { data, error } = await supabaseAdmin
        .from("video_rooms")
        .insert({
          room_key: roomCode,
          shop_id: shopId,
          agent_id: validAgentId,
          visitor_id: visitorId,
          conversation_id: conversationId,
          status: "waiting",
          offer,
        })
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else if (action === "add_candidate") {
      const { roomId, sender, candidate } = body;

      const senderType = (sender === "seller" || sender === "business_member")
        ? "business_member"
        : "visitor";

      const { data, error } = await supabaseAdmin
        .from("video_candidates")
        .insert({ room_id: roomId, sender_type: senderType, candidate })
        .select();
      result = data;
      writeError = error;

    } else if (action === "delete_room") {
      const { roomId } = body;
      await supabaseAdmin.from("video_candidates").delete().eq("room_id", roomId);
      const { data, error } = await supabaseAdmin.from("video_rooms").delete().eq("id", roomId).select();

      await supabaseAdmin.from("notifications").delete().match({ shop_id: shopId, type: "incoming_call" });

      result = resolveSingle(data);
      writeError = error;

    } else if (action === "create_call_log") {
      const { customerName, customerEmail, customerPhone, status, duration, productsShared } = body;

      const visitorId = await resolveVisitor(customerName, customerEmail, customerPhone);
      const conversationId = await resolveConversation(visitorId, "video");

      const { data, error } = await supabaseAdmin
        .from("call_logs")
        .insert({
          shop_id: shopId,
          visitor_id: visitorId,
          conversation_id: conversationId,
          call_type: "video",
          status: status || "ringing",
          duration_seconds: duration || 0,
          metadata: {
            customer_name: customerName || null,
            customer_email: customerEmail || null,
            customer_phone: customerPhone || null,
            products_shared: productsShared || null,
          },
        })
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else if (action === "update_call_log") {
      const { id, duration, status, notes, csatScore, callRating } = body;

      const updatePayload: Record<string, any> = {};
      if (duration !== undefined) updatePayload.duration_seconds = duration;
      if (status !== undefined) updatePayload.status = status;
      if (notes !== undefined) updatePayload.agent_notes = notes;

      if (csatScore !== undefined || callRating !== undefined) {
        const { data: existing } = await supabaseAdmin
          .from("call_logs")
          .select("metadata")
          .eq("id", id)
          .maybeSingle();

        const existingMeta = existing?.metadata || {};
        updatePayload.metadata = {
          ...existingMeta,
          ...(csatScore !== undefined ? { csat_score: csatScore } : {}),
          ...(callRating !== undefined ? { call_rating: callRating } : {}),
        };
      }

      if (status === "completed" || status === "missed") {
        updatePayload.ended_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from("call_logs")
        .update(updatePayload)
        .eq("id", id)
        .select();

      await supabaseAdmin.from("notifications").delete().match({ shop_id: shopId, type: "incoming_call" });

      result = resolveSingle(data);
      writeError = error;

    } else if (action === "create_callback") {
      const { customerName, customerEmail, customerPhone, scheduledTime, notes } = body;

      const visitorId = await resolveVisitor(customerName, customerEmail, customerPhone);
      const conversationId = await resolveConversation(visitorId, "callback");

      const { data, error } = await supabaseAdmin
        .from("callback_requests")
        .insert({
          shop_id: shopId,
          visitor_id: visitorId,
          conversation_id: conversationId,
          name: customerName || "Anonymous",
          email: customerEmail || null,
          phone: customerPhone || null,
          scheduled_time: scheduledTime,
          message: notes || null,
          status: "pending",
        })
        .select();
      result = resolveSingle(data);
      writeError = error;

    } else if (action === "send_message") {
      const { senderId, receiverId, content, imageUrl, visitorId: bodyVisitorId, conversationId: bodyConvoId } = body;

      let visitorId = bodyVisitorId;
      let conversationId = bodyConvoId;

      if (!visitorId) {
        visitorId = await resolveVisitor();
      }
      if (!conversationId) {
        conversationId = await resolveConversation(visitorId, "chat");
      }

      const { data, error } = await supabaseAdmin
        .from("messages")
        .insert({
          conversation_id: conversationId,
          visitor_id: visitorId,
          sender_type: "visitor",
          message_type: "text",
          content,
          metadata: {
            ...(imageUrl ? { image_url: imageUrl } : {}),
            ...(senderId ? { legacy_sender_id: senderId } : {}),
            ...(receiverId ? { legacy_receiver_id: receiverId } : {}),
          },
          is_read: false,
        })
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
