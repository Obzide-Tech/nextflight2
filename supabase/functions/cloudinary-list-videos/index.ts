import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "dwp64dtwa";
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "Missing Cloudinary credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allResources: Array<{
      public_id: string;
      secure_url: string;
      asset_folder: string;
      format: string;
      created_at: string;
      bytes: number;
      duration?: number;
    }> = [];

    let nextCursor: string | undefined;
    let page = 0;

    do {
      page++;
      const searchBody: Record<string, unknown> = {
        expression: "resource_type:video",
        max_results: 500,
        sort_by: [{ created_at: "asc" }],
      };

      if (nextCursor) {
        searchBody.next_cursor = nextCursor;
      }

      const auth = btoa(`${apiKey}:${apiSecret}`);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchBody),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        return new Response(
          JSON.stringify({ error: `Cloudinary API error: ${res.status}`, details: errText, page }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      const resources = data.resources || [];

      for (const r of resources) {
        allResources.push({
          public_id: r.public_id,
          secure_url: r.secure_url,
          asset_folder: r.asset_folder || "",
          format: r.format || "mp4",
          created_at: r.created_at,
          bytes: r.bytes || 0,
          duration: r.duration,
        });
      }

      nextCursor = data.next_cursor;
    } while (nextCursor && page < 10);

    return new Response(
      JSON.stringify({
        total: allResources.length,
        pages_fetched: page,
        resources: allResources,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
