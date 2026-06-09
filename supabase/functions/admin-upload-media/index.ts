import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sha1Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("nf_is_admin", { uid: user.id });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const folder = body.folder ? String(body.folder) : "NextFLGHTs";
    const resourceType = body.resource_type === "image" ? "image" : "video";
    const publicId = body.public_id ? String(body.public_id) : undefined;

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "dwp64dtwa";
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY") ?? "";
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET") ?? "";

    if (!apiKey || !apiSecret) {
      return json({ error: "Cloudinary credentials not configured" }, 500);
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, string> = {
      folder,
      timestamp: String(timestamp),
    };

    if (publicId) params.public_id = publicId;
    if (resourceType === "video") {
      params.eager = "sp_auto/m3u8";
      params.eager_async = "true";
      params.resource_type = "video";
    }

    const sortedKeys = Object.keys(params).sort();
    const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
    const signature = await sha1Hex(toSign);

    await admin.from("admin_audit_log").insert({
      actor_id: user.id,
      action: "media.upload_signed",
      metadata: { folder, resource_type: resourceType, public_id: publicId ?? null },
    });

    return json({
      cloud_name: cloudName,
      api_key: apiKey,
      timestamp,
      signature,
      folder,
      resource_type: resourceType,
      eager: params.eager ?? null,
      eager_async: params.eager_async ?? null,
      upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
