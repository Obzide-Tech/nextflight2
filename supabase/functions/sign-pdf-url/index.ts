import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Cloudinary URL signature: SHA1(path_after_upload + api_secret) → base64url, first 8 chars
async function cloudinarySign(pathAfterUpload: string, apiSecret: string): Promise<string> {
  const toSign = pathAfterUpload + apiSecret;
  const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return b64.slice(0, 8);
}

// Extract everything after /upload/ (strip existing s--sig-- if any)
function pathAfterUpload(url: string): string | null {
  const m = url.match(/\/(?:image|video|raw)\/upload\/(?:s--[^-]+--)?\/?(.+)$/);
  return m ? m[1] : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "dwp64dtwa";
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY") ?? "";
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const assetId: string | undefined = body.assetId;
    if (!assetId) return json({ error: "missing_assetId" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify user has an active subscription or the lesson is free
    const { data: asset } = await admin
      .from("lesson_assets")
      .select("id, external_url, title, is_premium_only, lesson_id, lesson_assets_lesson_id_fkey")
      .eq("id", assetId)
      .maybeSingle();

    if (!asset) return json({ error: "asset_not_found" }, 404);

    if (asset.is_premium_only) {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .in("status", ["active", "grace_period"])
        .limit(1)
        .maybeSingle();

      if (!sub) return json({ error: "premium_required" }, 403);
    }

    const rawUrl: string = asset.external_url ?? "";
    if (!rawUrl) return json({ error: "no_url" }, 404);

    // If not a Cloudinary URL, return as-is (no signing needed)
    if (!rawUrl.includes("res.cloudinary.com")) {
      return json({ url: rawUrl, signed: false });
    }

    if (!apiSecret) {
      // No secret configured — return unsigned URL and let the client try
      return json({ url: rawUrl, signed: false });
    }

    const path = pathAfterUpload(rawUrl);
    if (!path) return json({ url: rawUrl, signed: false });

    const sig = await cloudinarySign(path, apiSecret);

    // Determine resource type from URL
    const resourceType = rawUrl.includes("/video/upload/") ? "video"
      : rawUrl.includes("/raw/upload/") ? "raw"
      : "image";

    const signedUrl =
      `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/s--${sig}--/${path}`;

    return json({ url: signedUrl, signed: true });
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
