import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const body = await req.json().catch(() => ({}));
    const { purchase_token, product_id, order_id } = body;

    if (!purchase_token || !product_id) {
      return json({ error: 'Missing purchase_token or product_id' }, 400);
    }

    // PRODUCTION: call Google Play Developer API
    // GET /androidpublisher/v3/applications/{packageName}/purchases/subscriptionsv2/tokens/{token}
    // For sandbox/demo we trust the purchase token from the device and persist the purchase.

    const purchaseDate = new Date(body.purchase_date ?? Date.now());
    // One-time purchase: ignore expires_date — access is permanent

    const { data: program } = await admin
      .from('products_programs')
      .select('id')
      .eq('google_product_id', product_id)
      .maybeSingle();

    await admin.from('store_purchases').upsert({
      user_id: user.id,
      platform: 'google',
      product_id,
      transaction_id: order_id ?? purchase_token,
      original_transaction_id: order_id ?? purchase_token,
      purchase_date: purchaseDate.toISOString(),
      expires_date: null,
      raw_receipt: { purchase_token },
    }, { onConflict: 'platform,transaction_id' });

    if (program?.id) {
      await admin.from('subscriptions').upsert({
        user_id: user.id,
        program_id: program.id,
        platform: 'google',
        status: 'active',
        current_period_start: purchaseDate.toISOString(),
        current_period_end: null,
        updated_at: new Date().toISOString(),
      });

      await admin.from('user_roles').upsert(
        { user_id: user.id, role: 'student_premium' },
        { onConflict: 'user_id,role', ignoreDuplicates: true }
      );

      await admin.from('enrollments').upsert(
        { user_id: user.id, program_id: program.id, source: 'google' },
        { onConflict: 'user_id,program_id', ignoreDuplicates: true }
      );
    }

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
