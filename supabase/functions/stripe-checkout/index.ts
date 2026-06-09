import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) return json({ error: "stripe_not_configured" }, 503);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const { product_id } = await req.json();
    if (!product_id) return json({ error: "product_id_required" }, 400);

    // Load product
    const { data: product, error: pErr } = await admin
      .from("store_products")
      .select("*")
      .eq("id", product_id)
      .eq("is_active", true)
      .maybeSingle();

    if (pErr || !product) return json({ error: "product_not_found" }, 404);

    // Load redirect URLs from system_settings
    const [{ data: successSetting }, { data: cancelSetting }] = await Promise.all([
      admin.from("system_settings").select("value").eq("key", "stripe_success_url").maybeSingle(),
      admin.from("system_settings").select("value").eq("key", "stripe_cancel_url").maybeSingle(),
    ]);

    const successUrl = typeof successSetting?.value === "string"
      ? successSetting.value
      : "https://nextflightacademy.com/compra-exitosa";
    const cancelUrl = typeof cancelSetting?.value === "string"
      ? cancelSetting.value
      : "https://nextflightacademy.com/tienda";

    // Get user email for prefill
    const { data: profile } = await admin
      .from("user_profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    // Create pending payment_transaction
    const { data: tx } = await admin
      .from("payment_transactions")
      .insert({
        user_id:          user.id,
        platform:         "stripe_checkout",
        amount_usd:       product.price_usd,
        net_amount_usd:   product.price_usd,
        store_fee_usd:    0,
        status:           "pending",
        store_product_id: product.id,
        occurred_at:      new Date().toISOString(),
      })
      .select("id")
      .single();

    // Look up Rewardful affiliate attribution for this user
    let rewardfulAffiliateId: string | null = null;
    try {
      const { data: attribution } = await admin
        .from("referral_attributions")
        .select("affiliate_user_id")
        .eq("referred_user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (attribution?.affiliate_user_id) {
        const { data: afProfile } = await admin
          .from("affiliate_profiles")
          .select("rewardful_affiliate_id")
          .eq("id", attribution.affiliate_user_id)
          .maybeSingle();
        rewardfulAffiliateId = afProfile?.rewardful_affiliate_id ?? null;
      }
    } catch { /* best effort — never block checkout */ }

    // Build Stripe Checkout Session via REST API (no SDK needed)
    const params = new URLSearchParams({
      "mode": "payment",
      "success_url": `${successUrl}?tx=${tx?.id ?? ""}`,
      "cancel_url": cancelUrl,
      "client_reference_id": rewardfulAffiliateId ?? tx?.id ?? user.id,
      "customer_email": user.email ?? "",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(Math.round(product.price_usd * 100)),
      "line_items[0][price_data][product_data][name]": product.name,
      "line_items[0][quantity]": "1",
      "metadata[product_id]": product.id,
      "metadata[transaction_id]": tx?.id ?? "",
      "metadata[user_id]": user.id,
    });

    if (rewardfulAffiliateId) {
      params.set("metadata[rewardful_affiliate_id]", rewardfulAffiliateId);
    }

    if (product.description) {
      params.set("line_items[0][price_data][product_data][description]", product.description);
    }
    if (product.image_url) {
      params.set("line_items[0][price_data][product_data][images][0]", product.image_url);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const stripeData = await stripeRes.json();
    if (!stripeRes.ok) {
      return json({ error: "stripe_error", details: stripeData.error?.message }, 502);
    }

    // Store the Stripe session ID on the transaction
    if (tx?.id) {
      await admin.from("payment_transactions").update({
        external_ref: stripeData.id,
      }).eq("id", tx.id);
    }

    await admin.from("admin_audit_log").insert({
      actor_id:     user.id,
      action:       "store.checkout_created",
      target_table: "store_products",
      target_id:    product.id,
      metadata:     {
        product_name: product.name,
        amount_usd:   product.price_usd,
        session_id:   stripeData.id,
        tx_id:        tx?.id,
      },
    });

    return json({ url: stripeData.url, session_id: stripeData.id });
  } catch (err) {
    return json({ error: "internal", message: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
