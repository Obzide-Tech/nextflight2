import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const REWARDFUL_API_BASE = "https://api.getrewardful.com/v1";

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

    const rewardfulSecret = Deno.env.get("REWARDFUL_API_SECRET") ?? "";
    if (!rewardfulSecret) {
      return json(
        {
          error: "rewardful_not_configured",
          message:
            "Rewardful API secret is not configured. Set REWARDFUL_API_SECRET secret.",
        },
        503
      );
    }

    const body = await req.json().catch(() => ({}));
    const endpoint: string = body.endpoint ?? "";
    const method: string = (body.method ?? "GET").toUpperCase();
    const reqBody: any = body.body ?? null;

    if (!endpoint) return json({ error: "missing_endpoint" }, 400);

    const fetchOpts: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${rewardfulSecret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (reqBody && method !== "GET") {
      fetchOpts.body = JSON.stringify(reqBody);
    }

    const rewardfulRes = await fetch(
      `${REWARDFUL_API_BASE}${endpoint}`,
      fetchOpts
    );

    const rewardfulData = await rewardfulRes.json().catch(() => ({
      error: "invalid_rewardful_response",
    }));

    return json(rewardfulData, rewardfulRes.ok ? 200 : 502);
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
