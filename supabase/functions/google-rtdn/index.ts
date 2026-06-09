import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// https://developer.android.com/google/play/billing/rtdn-reference#sub
const SUB_TYPE_TO_STATUS: Record<number, string> = {
  1: 'active',         // RECOVERED
  2: 'active',         // RENEWED
  3: 'cancelled',      // CANCELED
  4: 'active',         // PURCHASED
  5: 'on_hold',        // ACCOUNT_HOLD
  6: 'grace_period',   // GRACE_PERIOD
  7: 'active',         // RESTARTED
  10: 'on_hold',       // PAUSED
  12: 'expired',       // REVOKED
  13: 'expired',       // EXPIRED
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const envelope = await req.json().catch(() => ({}));
    const messageData = envelope?.message?.data;
    if (!messageData) return json({ ok: true, ignored: true });

    const decoded = JSON.parse(atob(messageData));
    const sub = decoded?.subscriptionNotification;
    if (!sub) {
      await admin.from('admin_audit_log').insert({
        action: 'google.rtdn.non_subscription',
        metadata: { decoded },
      });
      return json({ ok: true, ignored: true });
    }

    const purchaseToken: string = sub.purchaseToken;
    const productId: string = sub.subscriptionId;
    const notificationType: number = sub.notificationType;

    // PRODUCTION: call Google Play Developer API with purchaseToken to refresh state.
    // Sandbox/demo: derive status from notificationType only.
    const nextStatus = SUB_TYPE_TO_STATUS[notificationType] ?? null;

    const { data: existing } = await admin
      .from('store_purchases')
      .select('user_id')
      .eq('platform', 'google')
      .or(`transaction_id.eq.${purchaseToken},original_transaction_id.eq.${purchaseToken}`)
      .maybeSingle();

    if (!existing?.user_id) {
      await admin.from('admin_audit_log').insert({
        action: 'google.rtdn.unmatched',
        metadata: { purchaseToken, productId, notificationType },
      });
      return json({ ok: true, unmatched: true });
    }

    const { data: program } = await admin
      .from('products_programs')
      .select('id')
      .eq('google_product_id', productId)
      .maybeSingle();

    if (program?.id && nextStatus) {
      await admin.from('subscriptions').upsert({
        user_id: existing.user_id,
        program_id: program.id,
        platform: 'google',
        status: nextStatus,
        updated_at: new Date().toISOString(),
      });
    }

    await admin.from('admin_audit_log').insert({
      actor_id: existing.user_id,
      action: `google.rtdn.${notificationType}`,
      target_table: 'subscriptions',
      metadata: { productId, purchaseToken, nextStatus },
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
