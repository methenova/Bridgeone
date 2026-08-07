import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import stripe from "https://esm.sh/stripe@14.19.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const missingSecrets: string[] = [];
    if (!stripeSecret) missingSecrets.push("STRIPE_SECRET_KEY");
    if (!webhookSecret) missingSecrets.push("STRIPE_WEBHOOK_SECRET");
    if (!supabaseUrl) missingSecrets.push("SUPABASE_URL");
    if (!supabaseServiceKey) missingSecrets.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingSecrets.length > 0) {
      return new Response(
        JSON.stringify({ error: `Configuration error: Missing required production secret(s): ${missingSecrets.join(", ")}.` }),
        { status: 500, headers: corsHeaders }
      );
    }

    const stripeClient = new stripe(stripeSecret, {
      apiVersion: "2023-10-16",
      httpClient: stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get("stripe-signature") ?? "";
    const bodyText = await req.text();

    let event;
    try {
      event = await stripeClient.webhooks.constructEventAsync(bodyText, signature, webhookSecret);
    } catch (err) {
      console.warn(`[Stripe-Webhook-Signature-Error] ${err.message}`);
      return new Response(JSON.stringify({ error: `Signature verification failed: ${err.message}` }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    console.info(`[Stripe-Webhook] Processing event: ${event.type}`);

    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const shopId = session.metadata?.shop_id;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (shopId && userId) {
          console.info(`[Stripe-Webhook] Checkout completed. Activating subscription for shop=${shopId}`);

          // 1. Update subscription status to active in database
          const { error: subErr } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              billing_provider: "stripe",
              provider_subscription_id: session.subscription ? String(session.subscription) : null,
              provider_customer_id: session.customer ? String(session.customer) : null,
              updated_at: new Date().toISOString(),
            })
            .eq("shop_id", shopId);

          if (subErr) throw subErr;

          // 2. Activate Shop in database
          const { error: shopErr } = await supabaseAdmin
            .from("shops")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", shopId);

          if (shopErr) throw shopErr;
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          console.info(`[Stripe-Webhook] Invoice paid for subscription=${subscriptionId}`);

          // Find shop matching this customer/subscription ID
          const { data: subData } = await supabaseAdmin
            .from("subscriptions")
            .select("shop_id")
            .eq("provider_subscription_id", subscriptionId)
            .maybeSingle();

          if (subData?.shop_id) {
            // Keep active and updated
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("shop_id", subData.shop_id);

            await supabaseAdmin
              .from("shops")
              .update({
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("id", subData.shop_id);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          console.warn(`[Stripe-Webhook] Invoice payment failed for subscription=${subscriptionId}. Suspending shop.`);

          const { data: subData } = await supabaseAdmin
            .from("subscriptions")
            .select("shop_id")
            .eq("provider_subscription_id", subscriptionId)
            .maybeSingle();

          if (subData?.shop_id) {
            // Set subscription to unpaid
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("shop_id", subData.shop_id);

            // Suspend Shop
            await supabaseAdmin
              .from("shops")
              .update({
                status: "suspended",
                updated_at: new Date().toISOString(),
              })
              .eq("id", subData.shop_id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        if (subscriptionId) {
          console.warn(`[Stripe-Webhook] Subscription deleted/cancelled: ${subscriptionId}`);

          const { data: subData } = await supabaseAdmin
            .from("subscriptions")
            .select("shop_id")
            .eq("provider_subscription_id", subscriptionId)
            .maybeSingle();

          if (subData?.shop_id) {
            // Set subscription status to cancelled
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "cancelled",
                updated_at: new Date().toISOString(),
              })
              .eq("shop_id", subData.shop_id);

            // Suspend Shop
            await supabaseAdmin
              .from("shops")
              .update({
                status: "suspended",
                updated_at: new Date().toISOString(),
              })
              .eq("id", subData.shop_id);
          }
        }
        break;
      }

      default:
        console.info(`[Stripe-Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error(`[Stripe-Webhook-Error] ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
