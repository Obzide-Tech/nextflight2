import { supabase } from './supabase';

const KARTRA_BASE = 'https://app.kartra.com/api';

type KartraResponse = { ok: true; data?: any } | { ok: false; error: string };

async function kartraProxy(action: string, payload: Record<string, any>): Promise<KartraResponse> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false, error: 'unauthenticated' };

  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/kartra-proxy`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    const j = await res.json();
    if (!res.ok) return { ok: false, error: j.error ?? 'kartra_request_failed' };
    return { ok: true, data: j };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'network_error' };
  }
}

export async function syncUserToKartra(user: {
  email: string;
  fullName: string;
  country?: string;
  tags?: string[];
}): Promise<KartraResponse> {
  return kartraProxy('create_lead', {
    email: user.email,
    first_name: user.fullName.split(' ')[0] ?? '',
    last_name: user.fullName.split(' ').slice(1).join(' ') ?? '',
    country: user.country ?? '',
    tags: user.tags ?? [],
  });
}

export async function tagKartraContact(email: string, tag: string): Promise<KartraResponse> {
  return kartraProxy('add_tag', { email, tag });
}

export async function removeKartraTag(email: string, tag: string): Promise<KartraResponse> {
  return kartraProxy('remove_tag', { email, tag });
}

export async function fetchKartraContact(email: string): Promise<KartraResponse> {
  return kartraProxy('get_lead', { email });
}

export async function openKartraHelpdesk(): Promise<string | null> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'kartra_helpdesk_url')
    .maybeSingle();
  let url = '';
  if (data?.value) {
    try { url = JSON.parse(data.value); } catch { url = data.value; }
  }
  return url || null;
}
