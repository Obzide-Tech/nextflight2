import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function decodeJwsPayload(jws: string): Record<string, unknown> | null {
  try {
    const [, payload] = jws.split('.');
    if (!payload) return null;
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const signedPayload = String(body.signedPayload ?? '');
    if (!signedPayload) return json({ error: 'Missing signedPayload' }, 400);

    // PRODUCTION: verify JWS signature against Apple's public root CAs.
    // Sandbox/demo: decode payload directly.
    const payload = decodeJwsPayload(signedPayload) as any;
    if (!payload) return json({ error: 'Invalid signedPayload' }, 400);

    const notificationType = payload.notificationType ?? 'UNKNOWN';
    const subtype = payload.subtype ?? null;

    const txInfoJws = payload?.data?.signedTransactionInfo;
    const renewalInfoJws = payload?.data?.signedRenewalInfo;
    const tx = txInfoJws ? decodeJwsPayload(txInfoJws) as any : null;
    const renewal = renewalInfoJws ? decodeJwsPayload(renewalInfoJws) as any : null;

    const originalTxId = tx?.originalTransactionId ?? null;
    const productId = tx?.productId ?? null;
    const expiresMs = tx?.expiresDate ?? null;
    const purchaseMs = tx?.purchaseDate ?? null;

    if (!originalTxId) {
      await admin.from('admin_audit_log').insert({
        action: 'apple.ssn.skipped',
        metadata: { reason: 'missing_tx', notificationType, subtype },
      });
      return json({ ok: true, skipped: true });
    }

    const { data: existing } = await admin
      .from('store_purchases')
      .select('user_id, product_id')
      .eq('platform', 'apple')
      .eq('original_transaction_id', originalTxId)
      .maybeSingle();

    if (!existing?.user_id) {
      await admin.from('admin_audit_log').insert({
        action: 'apple.ssn.unmatched',
        metadata: { originalTxId, notificationType, subtype },
      });
      return json({ ok: true, unmatched: true });
    }

    let nextStatus: string | null = null;
    if (notificationType === 'SUBSCRIBED' || notificationType === 'DID_RENEW') nextStatus = 'active';
    else if (notificationType === 'EXPIRED') nextStatus = 'expired';
    else if (notificationType === 'GRACE_PERIOD_EXPIRED') nextStatus = 'expired';
    else if (notificationType === 'DID_FAIL_TO_RENEW') nextStatus = subtype === 'GRACE_PERIOD' ? 'grace_period' : 'on_hold';
    else if (notificationType === 'REVOKE' || notificationType === 'REFUND') nextStatus = 'cancelled';
    else if (notificationType === 'DID_CHANGE_RENEWAL_STATUS') nextStatus = null;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (nextStatus) updates.status = nextStatus;
    if (purchaseMs) updates.current_period_start = new Date(purchaseMs).toISOString();
    if (expiresMs) updates.current_period_end = new Date(expiresMs).toISOString();
    if (renewal && typeof renewal.autoRenewStatus === 'number') {
      updates.cancel_at_period_end = renewal.autoRenewStatus === 0;
    }

    if (productId) {
      const { data: program } = await admin
        .from('products_programs')
        .select('id')
        .eq('apple_product_id', productId)
        .maybeSingle();

      if (program?.id) {
        await admin.from('subscriptions').upsert({
          user_id: existing.user_id,
          program_id: program.id,
          platform: 'apple',
          ...updates,
        });
      }
    }

    await admin.from('admin_audit_log').insert({
      actor_id: existing.user_id,
      action: `apple.ssn.${notificationType}`,
      target_table: 'subscriptions',
      metadata: { subtype, originalTxId, productId, nextStatus },
    });

    return json({ ok: true });
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
