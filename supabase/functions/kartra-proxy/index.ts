import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const KARTRA_API_URL = "https://app.kartra.com/api";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "missing_auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthenticated" }, 401);

    const kartraApiKey = Deno.env.get("KARTRA_API_KEY") ?? "";
    const kartraApiPassword = Deno.env.get("KARTRA_API_PASSWORD") ?? "";

    if (!kartraApiKey || !kartraApiPassword) {
      return json(
        {
          error: "kartra_not_configured",
          message:
            "Kartra API keys are not configured. Set KARTRA_API_KEY and KARTRA_API_PASSWORD secrets.",
        },
        503
      );
    }

    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "";
    const payload: Record<string, any> = body.payload ?? {};

    if (!action) return json({ error: "missing_action" }, 400);

    const formData = new URLSearchParams();
    formData.append("app_id", kartraApiKey);
    formData.append("api_key", kartraApiPassword);
    formData.append("api_action", action);

    for (const [k, v] of Object.entries(payload)) {
      if (Array.isArray(v)) {
        v.forEach((item, i) => formData.append(`${k}[${i}]`, String(item)));
      } else {
        formData.append(k, String(v));
      }
    }

    const kartraRes = await fetch(KARTRA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const kartraJson = await kartraRes.json().catch(() => ({
      error: "invalid_kartra_response",
    }));

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    await admin.from("admin_audit_log").insert({
      actor_id: user.id,
      action: `kartra.${action}`,
      metadata: {
        email: payload.email ?? null,
        status: kartraRes.ok ? "success" : "error",
      },
    });

    return json(kartraJson, kartraRes.ok ? 200 : 502);
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
