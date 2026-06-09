import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    const admin = createClient(supabaseUrl, serviceKey);
    const rawBody = await req.text();

    // Verify Stripe signature if secret is configured
    if (webhookSecret) {
      const sig = req.headers.get("Stripe-Signature");
      if (!sig) return json({ error: "missing_signature" }, 400);

      const isValid = await verifyStripeSignature(rawBody, sig, webhookSecret);
      if (!isValid) return json({ error: "invalid_signature" }, 401);
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.type ?? "unknown";

    await admin.from("admin_audit_log").insert({
      action:      `stripe.webhook.${eventType}`,
      target_table: "payment_transactions",
      metadata:    {
        stripe_event_id: event.id,
        received_at:     new Date().toISOString(),
      },
    });

    // Handle checkout.session.completed
    if (eventType === "checkout.session.completed") {
      const session = event.data.object;
      const txId         = session.metadata?.transaction_id;
      const productId    = session.metadata?.product_id;
      const userId       = session.metadata?.user_id;
      const amountTotal  = session.amount_total ? session.amount_total / 100 : 0;

      if (txId) {
        await admin.from("payment_transactions").update({
          status:        "confirmed",
          amount_usd:    amountTotal,
          net_amount_usd: amountTotal,
          external_ref:  session.id,
          occurred_at:   new Date().toISOString(),
        }).eq("id", txId);
      }

      // Grant student_premium role
      if (userId) {
        await admin.from("user_roles").upsert(
          { user_id: userId, role: "student_premium" },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );

        const { data: premiumProgram } = await admin
          .from("products_programs")
          .select("id")
          .eq("tier", "premium")
          .eq("is_published", true)
          .order("display_order")
          .limit(1)
          .maybeSingle();

        if (premiumProgram) {
          const now = new Date().toISOString();
          const { data: existingSub } = await admin
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", userId)
            .eq("program_id", premiumProgram.id)
            .maybeSingle();

          if (!existingSub) {
            await admin.from("user_subscriptions").insert({
              user_id:               userId,
              program_id:            premiumProgram.id,
              status:                "active",
              platform:              "stripe_checkout",
              current_period_start:  now,
            });
          } else {
            await admin.from("user_subscriptions").update({
              status:               "active",
              platform:             "stripe_checkout",
              current_period_start: now,
            }).eq("id", existingSub.id);
          }
        }
      }

      // Apply Kartra tag if configured
      if (productId && userId) {
        const { data: product } = await admin
          .from("store_products")
          .select("kartra_tag, name")
          .eq("id", productId)
          .maybeSingle();

        const { data: kartraFlag } = await admin
          .from("feature_flags")
          .select("enabled")
          .eq("key", "store_kartra_tags")
          .maybeSingle();

        if (kartraFlag?.enabled && product?.kartra_tag) {
          const { data: profile } = await admin
            .from("user_profiles")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

          if (profile) {
            const { data: authUser } = await admin.auth.admin.getUserById(userId);
            if (authUser?.user?.email) {
              await admin.from("admin_audit_log").insert({
                action:      "store.kartra_tag_queued",
                target_table: "store_products",
                target_id:   productId,
                metadata:    {
                  email: authUser.user.email,
                  tag:   product.kartra_tag,
                  product_name: product.name,
                },
              });
            }
          }
        }
      }

      await admin.from("admin_audit_log").insert({
        action:      "store.payment_confirmed",
        target_table: "payment_transactions",
        metadata:    {
          tx_id:        txId,
          product_id:   productId,
          amount_usd:   amountTotal,
          stripe_session: session.id,
        },
      });
    }

    // Handle payment_intent.payment_failed
    if (eventType === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const sessionId = intent.metadata?.session_id;
      if (sessionId) {
        await admin.from("payment_transactions")
          .update({ status: "failed" })
          .eq("external_ref", sessionId);
      }
    }

    return json({ received: true, type: eventType });
  } catch (err) {
    return json({ error: "internal", message: (err as Error).message }, 500);
  }
});

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = Object.fromEntries(
      sigHeader.split(",").map((p) => p.split("=") as [string, string]),
    );
    const timestamp = parts["t"];
    const signature = parts["v1"];
    if (!timestamp || !signature) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
    const expected = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expected === signature;
  } catch {
    return false;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
