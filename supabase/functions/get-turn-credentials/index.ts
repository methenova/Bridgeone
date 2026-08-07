import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Coturn Shared Secret REST API (RFC 5766)
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const coturnSecret = Deno.env.get("COTURN_SHARED_SECRET");
    if (!coturnSecret) {
      return new Response(
        JSON.stringify({ error: "TURN shared secret not configured on backend." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const region = body.region || "us-east";

    // Set expiration to 4 hours from now for optimal security
    const ttlSeconds = 14400;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const username = `${expiryTimestamp}:bridgeone_webrtc_session`;

    // Compute HMAC-SHA1 signature using Deno Web Crypto
    const keyBuf = new TextEncoder().encode(coturnSecret);
    const usernameBuf = new TextEncoder().encode(username);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuf,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, usernameBuf);
    const password = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Define TURN server endpoints mapped to Coturn clusters
    const hostMap: Record<string, string> = {
      "us-east": "us-east.bridgeone.video",
      "us-west": "us-west.bridgeone.video",
      "eu-central": "eu-central.bridgeone.video",
      "ap-south": "ap-south.bridgeone.video",
    };

    const host = hostMap[region] || hostMap["us-east"];

    const iceServers = [
      {
        urls: [
          `stun:${host}:3478`,
          "stun:stun.l.google.com:19302"
        ]
      },
      {
        urls: [
          `turn:${host}:3478?transport=udp`,
          `turn:${host}:3478?transport=tcp`,
          `turns:${host}:443?transport=tcp` // Corporate firewall fallback
        ],
        username: username,
        credential: password
      }
    ];

    console.info(`[TURN-Credentials] Issued temporary token for region=${region} expiry=${expiryTimestamp}`);

    return new Response(
      JSON.stringify({
        iceServers,
        ttl: ttlSeconds,
        region
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(`[TURN-Credentials-Error] ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
