import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

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

    const { data: isAdmin } = await admin.rpc('nf_is_admin', { uid: user.id });
    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    let userIds: string[] = Array.isArray(body.user_ids) ? body.user_ids : [];
    const audience = body.audience ? String(body.audience) : null;
    const title = String(body.title ?? '').trim();
    const message = String(body.body ?? '').trim();
    const link = body.link ? String(body.link) : null;

    if (!title || !message) {
      return json({ error: 'title and body are required' }, 400);
    }

    if (audience && !userIds.length) {
      let q = admin.from('user_roles').select('user_id');
      if (audience === 'students') q = q.in('role', ['student_free', 'student_premium']);
      else if (audience === 'premium') q = q.eq('role', 'student_premium');
      else if (audience === 'affiliates') q = q.eq('role', 'affiliate');
      // 'all' -> no filter
      const { data: rows } = await q;
      userIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id))).filter(Boolean) as string[];
    }

    if (!userIds.length) return json({ error: 'no recipients' }, 400);

    const notifications = userIds.map((id) => ({
      user_id: id,
      title,
      body: message,
      link,
    }));
    await admin.from('app_notifications').insert(notifications);

    const { data: tokens } = await admin
      .from('push_tokens')
      .select('expo_token')
      .in('user_id', userIds);

    const messages = (tokens ?? [])
      .filter((t) => typeof t.expo_token === 'string' && t.expo_token.startsWith('ExponentPushToken'))
      .map((t) => ({
        to: t.expo_token,
        sound: 'default',
        title,
        body: message,
        data: link ? { link } : {},
      }));

    let pushResult: unknown = { skipped: true };
    if (messages.length > 0) {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });
      pushResult = await res.json().catch(() => ({ status: res.status }));
    }

    await admin.from('admin_audit_log').insert({
      actor_id: user.id,
      action: 'notification.send',
      metadata: { title, recipients: userIds.length, push_count: messages.length },
    });

    return json({ ok: true, count: userIds.length, recipients: userIds.length, push_messages: messages.length, push_result: pushResult });
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
