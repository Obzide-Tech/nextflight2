import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST")
      return json({ error: "method_not_allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const event: string = body.event ?? "unknown";

    await admin.from("admin_audit_log").insert({
      action: `rewardful.webhook.${event}`,
      metadata: {
        affiliate_id: body.affiliate?.id ?? null,
        referral_id: body.referral?.id ?? null,
        commission_id: body.commission?.id ?? null,
        received_at: new Date().toISOString(),
      },
    });

    if (event === "referral.converted" && body.referral) {
      const customerEmail = body.referral.customer?.email;
      if (customerEmail) {
        const { data: authUsers } = await admin.auth.admin.listUsers();
        const matchedUser = authUsers?.users?.find(
          (u) => u.email?.toLowerCase() === customerEmail.toLowerCase(),
        );

        if (matchedUser) {
          const userId = matchedUser.id;

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
                user_id:              userId,
                program_id:           premiumProgram.id,
                status:               "active",
                platform:             "rewardful",
                current_period_start: now,
              });
            } else {
              await admin.from("user_subscriptions").update({
                status:               "active",
                platform:             "rewardful",
                current_period_start: now,
              }).eq("id", existingSub.id);
            }
          }

          await admin.from("admin_audit_log").insert({
            action:   "rewardful.access_granted",
            actor_id: userId,
            metadata: {
              referral_id:     body.referral.id,
              customer_email:  customerEmail,
              affiliate_id:    body.affiliate?.id ?? null,
            },
          });
        }
      }
    }

    if (event === "referral.created" && body.referral) {
      const affiliateEmail = body.affiliate?.email;
      if (affiliateEmail) {
        const { data: afProfile } = await admin
          .from("affiliate_profiles")
          .select("id")
          .eq("rewardful_affiliate_id", body.affiliate.id)
          .maybeSingle();

        if (afProfile) {
          await admin.from("admin_audit_log").insert({
            action: "rewardful.referral_synced",
            actor_id: afProfile.id,
            metadata: {
              referral_id: body.referral.id,
              customer_email: body.referral.customer?.email ?? null,
            },
          });
        }
      }
    }

    if (event === "commission.created" && body.commission) {
      const affiliateRewardfulId = body.affiliate?.id;
      if (affiliateRewardfulId) {
        const { data: afProfile } = await admin
          .from("affiliate_profiles")
          .select("id")
          .eq("rewardful_affiliate_id", affiliateRewardfulId)
          .maybeSingle();

        if (afProfile) {
          await admin.from("commission_ledger").insert({
            affiliate_user_id: afProfile.id,
            entry_type: "accrual",
            amount_usd: Number(body.commission.amount ?? 0) / 100,
            state: "pending",
            notes: `Rewardful commission ${body.commission.id}`,
          });
        }
      }
    }

    if (event === "payout.completed" && body.payout) {
      await admin.from("admin_audit_log").insert({
        action: "rewardful.payout_completed",
        metadata: {
          payout_id: body.payout.id,
          amount: body.payout.amount,
          affiliate_id: body.affiliate?.id,
        },
      });
    }

    return json({ received: true, event });
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
