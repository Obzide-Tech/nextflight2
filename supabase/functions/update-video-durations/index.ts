import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
      if (!profile || !["admin", "superadmin"].includes(profile.role)) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });
      }
    }

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME")!;
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY")!;
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET")!;

    // Fetch all lessons with a video
    const { data: lessons, error: lessonErr } = await supabase
      .from("course_lessons")
      .select("id, video_storage_path")
      .not("video_storage_path", "is", null)
      .neq("video_storage_path", "");

    if (lessonErr) throw lessonErr;
    if (!lessons?.length) {
      return new Response(JSON.stringify({ updated: 0, message: "No lessons with video found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let updated = 0;
    let errors = 0;

    for (const lesson of lessons) {
      const publicId = lesson.video_storage_path;
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/video/${publicId}`;

      const creds = btoa(`${apiKey}:${apiSecret}`);
      const res = await fetch(url, {
        headers: { Authorization: `Basic ${creds}` },
      });

      if (!res.ok) {
        errors++;
        continue;
      }

      const data = await res.json();
      const duration = Math.round(data.duration ?? 0);

      if (duration > 0) {
        await supabase
          .from("course_lessons")
          .update({ duration_seconds: duration })
          .eq("id", lesson.id);
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ updated, errors, total: lessons.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
