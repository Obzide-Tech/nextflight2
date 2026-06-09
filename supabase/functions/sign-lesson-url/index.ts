import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SIGNED_URL_TTL_SECONDS = 60;
const CLOUDINARY_TTL = 3600;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "missing_auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const lessonId: string | undefined = body.lessonId;
    if (!lessonId) return json({ error: "missing_lesson" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: lesson } = await admin
      .from("course_lessons")
      .select("id, is_free, is_published, video_storage_path, video_external_url, module_id, course_modules(course_id, courses(program_id))")
      .eq("id", lessonId)
      .maybeSingle();

    if (!lesson || !lesson.is_published) return json({ error: "lesson_not_found" }, 404);

    const programId = (lesson as any).course_modules?.courses?.program_id as string | undefined;

    if (!lesson.is_free) {
      const [{ data: enrollment }, { data: subscription }] = await Promise.all([
        programId
          ? admin.from("enrollments").select("id").eq("user_id", user.id).eq("program_id", programId).maybeSingle()
          : Promise.resolve({ data: null }),
        admin
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .in("status", ["active", "grace_period"])
          .limit(1)
          .maybeSingle(),
      ]);
      if (!enrollment && !subscription) return json({ error: "premium_required" }, 403);
    }

    // ── Cloudinary external URL ──────────────────────────────────────────────
    if (lesson.video_external_url) {
      const rawUrl = lesson.video_external_url;
      const isCloudinary =
        rawUrl.includes("res.cloudinary.com") || rawUrl.includes("cloudinary.com");

      if (isCloudinary) {
        const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "dwp64dtwa";

        const pidMatch = rawUrl.match(
          /res\.cloudinary\.com\/[^/]+\/video\/upload\/(?:v\d+\/)?(.+?)(?:\.\w{2,5})?$/
        );
        const publicId = pidMatch ? pidMatch[1] : null;

        if (!publicId) {
          return json({ url: rawUrl, ttl: CLOUDINARY_TTL, source: "cloudinary_raw" });
        }

        const hasExt = /\.\w{2,5}$/.test(publicId);
        const finalPublicId = hasExt ? publicId : `${publicId}.mp4`;
        const deliveryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,f_auto/${finalPublicId}`;
        return json({ url: deliveryUrl, ttl: CLOUDINARY_TTL, source: "cloudinary" });
      }

      return json({ url: rawUrl, ttl: 0, source: "external" });
    }

    // ── Cloudinary via video_storage_path (public_id hash) ────────────────
    if (!lesson.video_storage_path) {
      return json({ error: "no_video", message: "Lección sin video aún" }, 404);
    }

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "dwp64dtwa";
    const publicId = lesson.video_storage_path;
    const deliveryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,f_auto/${publicId}.mp4`;
    return json({ url: deliveryUrl, ttl: CLOUDINARY_TTL, source: "cloudinary" });
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
