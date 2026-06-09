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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) return json({ error: "stripe_not_configured" }, 503);

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role?.startsWith("admin_"));
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { product_id } = body;
    if (!product_id) return json({ error: "product_id_required" }, 400);

    const { data: product, error: pErr } = await admin
      .from("products_programs")
      .select("id, name:title, price_usd, description")
      .eq("id", product_id)
      .maybeSingle();

    if (pErr || !product) return json({ error: "product_not_found" }, 404);

    const unitAmount = Math.round(product.price_usd * 100);

    // Step 1: Create a Stripe Price object
    const priceParams = new URLSearchParams({
      "currency": "usd",
      "unit_amount": String(unitAmount),
      "product_data[name]": product.name,
    });
    if (product.description) {
      priceParams.set("product_data[statement_descriptor]", product.name.slice(0, 22));
    }

    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: priceParams.toString(),
    });

    const priceData = await priceRes.json();
    if (!priceRes.ok) {
      return json({ error: "stripe_price_error", details: priceData.error?.message }, 502);
    }

    // Step 2: Create the Payment Link
    const linkParams = new URLSearchParams({
      "line_items[0][price]": priceData.id,
      "line_items[0][quantity]": "1",
      "customer_creation": "always",
      "metadata[product_id]": product.id,
    });

    const linkRes = await fetch("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: linkParams.toString(),
    });

    const linkData = await linkRes.json();
    if (!linkRes.ok) {
      return json({ error: "stripe_link_error", details: linkData.error?.message }, 502);
    }

    // Step 3: Save URL to products_programs
    await admin
      .from("products_programs")
      .update({ checkout_url: linkData.url })
      .eq("id", product.id);

    await admin.from("admin_audit_log").insert({
      actor_id:     user.id,
      action:       "store.payment_link_created",
      target_table: "products_programs",
      target_id:    product.id,
      metadata:     {
        payment_link_id: linkData.id,
        url:             linkData.url,
        price_id:        priceData.id,
        unit_amount:     unitAmount,
      },
    });

    return json({ url: linkData.url, payment_link_id: linkData.id });
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
