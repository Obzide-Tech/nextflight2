import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Kartra-Secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("KARTRA_WEBHOOK_SECRET");

    // Validate secret header if configured
    if (webhookSecret) {
      const provided = req.headers.get("X-Kartra-Secret");
      if (!provided || provided !== webhookSecret) {
        return json({ error: "unauthorized" }, 401);
      }
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const event = body.event ?? body.action ?? "unknown";
    const email = body.lead?.email ?? body.email ?? null;

    await admin.from("admin_audit_log").insert({
      action:   `kartra.webhook.${event}`,
      metadata: { email, raw_event: event, received_at: new Date().toISOString() },
    });

    if (email && (event === "lead_created" || event === "new_lead")) {
      // Look up user by email via auth admin
      const { data: usersResult } = await admin.auth.admin.listUsers();
      const matchedUser = usersResult?.users?.find((u) => u.email === email);

      if (matchedUser) {
        await admin
          .from("user_profiles")
          .update({
            kartra_contact_id: body.lead?.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", matchedUser.id);
      }
    }

    if (email && (event === "tag_applied" || event === "add_tag")) {
      const tag = body.tag ?? body.tag_name ?? "";
      await admin.from("admin_audit_log").insert({
        action:   "kartra.webhook.tag_applied",
        metadata: { email, tag },
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
