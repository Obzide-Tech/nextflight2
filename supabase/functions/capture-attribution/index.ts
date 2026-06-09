import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ATTRIBUTION_DAYS = 30;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? '').trim().toUpperCase();
    const referredUserId = body.referred_user_id ? String(body.referred_user_id) : null;

    if (!code) return json({ error: 'Missing code' }, 400);

    let userId: string | null = referredUserId;
    if (!userId) {
      const authHeader = req.headers.get('Authorization') ?? '';
      if (authHeader) {
        const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
        const { data } = await userClient.auth.getUser();
        userId = data.user?.id ?? null;
      }
    }

    const { data: link } = await admin
      .from('affiliate_links')
      .select('id, affiliate_user_id, is_active')
      .eq('code', code)
      .maybeSingle();

    if (!link?.is_active) return json({ error: 'Invalid or inactive code' }, 404);

    if (!userId) {
      return json({ ok: true, deferred: true, link_id: link.id, affiliate_user_id: link.affiliate_user_id });
    }

    if (link.affiliate_user_id === userId) {
      return json({ ok: true, self_referral: true });
    }

    const expiresAt = new Date(Date.now() + ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error: insErr } = await admin
      .from('referral_attributions')
      .upsert({
        affiliate_user_id: link.affiliate_user_id,
        referred_user_id: userId,
        link_id: link.id,
        attribution_model: 'last_click',
        attributed_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'referred_user_id' });

    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, attributed: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
