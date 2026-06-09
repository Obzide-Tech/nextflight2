import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MIN_PAYOUT = 50;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount_usd);
    const notes = String(body.notes ?? '').trim();

    if (!amount || amount < MIN_PAYOUT) {
      return json({ error: `Mínimo $${MIN_PAYOUT} USD` }, 400);
    }

    const [{ data: balance }, { data: kyc }] = await Promise.all([
      admin.from('wallet_balances').select('available_usd').eq('affiliate_user_id', user.id).maybeSingle(),
      admin.from('kyc_profiles').select('status').eq('id', user.id).maybeSingle(),
    ]);

    if (Number(balance?.available_usd ?? 0) < amount) {
      return json({ error: 'Saldo insuficiente' }, 400);
    }
    if (kyc?.status !== 'approved') {
      return json({ error: 'KYC requerido' }, 403);
    }

    const { data: payout, error: insErr } = await admin
      .from('payout_requests')
      .insert({
        affiliate_user_id: user.id,
        amount_usd: amount,
        provider: 'internal',
        destination: notes || 'Acreditación interna NextFlight',
        status: 'requested',
      })
      .select()
      .single();

    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, payout });
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
