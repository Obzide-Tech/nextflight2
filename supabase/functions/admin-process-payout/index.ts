import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type Action = 'approve' | 'reject' | 'mark_paid';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { data: isAdmin } = await admin.rpc('nf_is_admin', { uid: user.id }).maybeSingle?.() ?? { data: null };
    let adminFlag: boolean | null = (isAdmin as any) ?? null;
    if (adminFlag === null) {
      const { data } = await admin.rpc('nf_is_admin', { uid: user.id });
      adminFlag = Boolean(data);
    }
    if (!adminFlag) return json({ error: 'Forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const payoutId = String(body.payout_id ?? '');
    const action = String(body.action ?? '') as Action;
    const externalRef = body.external_ref ? String(body.external_ref) : null;
    const reason = body.reason ? String(body.reason) : null;

    if (!payoutId || !['approve', 'reject', 'mark_paid'].includes(action)) {
      return json({ error: 'Invalid payload' }, 400);
    }

    const { data: payout } = await admin
      .from('payout_requests')
      .select('*')
      .eq('id', payoutId)
      .maybeSingle();

    if (!payout) return json({ error: 'Payout not found' }, 404);

    let nextStatus = payout.status;
    if (action === 'approve') {
      if (payout.status !== 'requested') return json({ error: 'Only requested payouts can be approved' }, 400);
      nextStatus = 'approved';
    } else if (action === 'reject') {
      if (!['requested', 'approved'].includes(payout.status)) return json({ error: 'Cannot reject from current state' }, 400);
      nextStatus = 'rejected';
    } else if (action === 'mark_paid') {
      if (payout.status !== 'approved') return json({ error: 'Only approved payouts can be marked paid' }, 400);
      nextStatus = 'paid';
    }

    const updates: Record<string, unknown> = { status: nextStatus };
    if (action === 'reject') updates.error_message = reason ?? '';
    if (action === 'mark_paid') {
      updates.processed_at = new Date().toISOString();
      if (externalRef) updates.external_ref = externalRef;
    }

    const { error: updErr } = await admin.from('payout_requests').update(updates).eq('id', payoutId);
    if (updErr) return json({ error: updErr.message }, 500);

    if (action === 'mark_paid') {
      await admin.from('commission_ledger').insert({
        affiliate_user_id: payout.affiliate_user_id,
        payout_request_id: payout.id,
        entry_type: 'withdrawal',
        amount_usd: -Math.abs(Number(payout.amount_usd)),
        state: 'confirmed',
        notes: externalRef ? `Acreditación interna · ref ${externalRef}` : 'Acreditación interna NextFlight',
      });
    }

    await admin.from('admin_audit_log').insert({
      actor_id: user.id,
      action: `payout.${action}`,
      target_table: 'payout_requests',
      target_id: payoutId,
      metadata: { external_ref: externalRef, reason, prev_status: payout.status, next_status: nextStatus },
    });

    await admin.from('app_notifications').insert({
      user_id: payout.affiliate_user_id,
      title:
        action === 'approve' ? 'Tu retiro fue aprobado' :
        action === 'reject' ? 'Tu retiro fue rechazado' :
        'Tu retiro fue acreditado',
      body:
        action === 'approve' ? 'El equipo financiero confirmará tu acreditación pronto.' :
        action === 'reject' ? (reason ?? 'Contacta al equipo para más detalles.') :
        `Acreditamos $${Number(payout.amount_usd).toFixed(2)} USD en tu cuenta.`,
      link: '/(app)/payout-request',
    });

    return json({ ok: true, status: nextStatus });
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
