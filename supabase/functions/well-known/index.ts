import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// These values are read from environment secrets when configured.
// Placeholders are used until real Apple/Google credentials are provided.
const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID") ?? "TEAMIDXXXX";
const IOS_BUNDLE_ID = Deno.env.get("IOS_BUNDLE_ID") ?? "app.nextflightacademy";
const ANDROID_PACKAGE_NAME = Deno.env.get("ANDROID_PACKAGE_NAME") ?? "app.nextflightacademy";
const ANDROID_SHA256_CERT = Deno.env.get("ANDROID_SHA256_CERT") ?? "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appIDs: [`${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`],
        components: [
          { "/": "/r/*", comment: "Affiliate referral capture" },
          { "/": "/lesson/*", comment: "Deep link to lessons" },
          { "/": "/aduana", comment: "Open subscription" },
        ],
      },
    ],
  },
  webcredentials: { apps: [`${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`] },
};

const assetlinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: ANDROID_PACKAGE_NAME,
      sha256_cert_fingerprints: [ANDROID_SHA256_CERT],
    },
  },
];

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const last = url.pathname.split("/").filter(Boolean).pop() ?? "";

    if (last === "apple-app-site-association") {
      return new Response(JSON.stringify(aasa), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (last === "assetlinks.json") {
      return new Response(JSON.stringify(assetlinks), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal", message: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
