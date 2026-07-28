import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS Preflight Handshake
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Validate authenticated user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { channel, recipient, subject, message } = body;

    if (!channel || !recipient || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: channel, recipient, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Database-backed Rate Limiting (Max 5 notifications per recipient per minute)
    const rateLimitKey = `notification:${channel}:${recipient}`;
    try {
      const { data: hitCount } = await supabaseAdmin.rpc("increment_rate_limit", {
        rate_key: rateLimitKey,
        window_seconds: 60
      });
      
      if (hitCount && hitCount > 5) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded for this recipient (max 5 per minute)." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (_rateErr) {
      // Fallback if rate limiting RPC is unavailable
    }

    // 2. Process Delivery Channels using Env Secrets
    if (channel === "email") {
      const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
      const sendgridFromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") || "notifications@bridgeone.co";

      if (!sendgridApiKey) {
        return new Response(
          JSON.stringify({ error: "Email provider credentials not configured on server" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.info(`[SendGrid] Dispatching email to ${recipient}...`);
      const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: sendgridFromEmail, name: "BridgeOne" },
          subject: subject || "Alert from BridgeOne",
          content: [{ type: "text/plain", value: message }],
        }),
      });

      if (!sgResponse.ok) {
        const errorText = await sgResponse.text();
        throw new Error(`SendGrid API failure: Status ${sgResponse.status} - ${errorText}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    
    else if (channel === "sms") {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioFromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

      if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
        return new Response(
          JSON.stringify({ error: "SMS provider credentials not configured on server" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.info(`[Twilio] Dispatching SMS to ${recipient}...`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const basicAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      
      const formData = new URLSearchParams();
      formData.append("To", recipient);
      formData.append("From", twilioFromNumber);
      formData.append("Body", message);

      const twResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!twResponse.ok) {
        const errorData = await twResponse.json();
        throw new Error(`Twilio API failure: ${errorData.message || twResponse.statusText}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "SMS sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported channel: ${channel}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(`[Notification-Error] ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
