import { supabase } from './supabase';

export type DashboardKpis = {
  mrrUsd: number;
  activeSubs: number;
  newSubsLast30: number;
  cancelledLast30: number;
  grossLast30Usd: number;
  netLast30Usd: number;
  pendingPayoutsUsd: number;
  pendingPayoutsCount: number;
  affiliatesActive: number;
  studentsTotal: number;
};

export type PlatformBreakdown = { platform: string; count: number; gross: number };

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [
    activeSubsRes,
    newSubsRes,
    cancelledSubsRes,
    txRes,
    payoutsRes,
    affiliatesRes,
    studentsRes,
  ] = await Promise.all([
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['active', 'grace_period']),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['cancelled', 'expired']).gte('updated_at', sinceIso),
    supabase.from('payment_transactions').select('amount_usd, net_amount_usd, status').gte('occurred_at', sinceIso),
    supabase.from('payout_requests').select('amount_usd, status').in('status', ['requested', 'approved']),
    supabase.from('affiliate_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
  ]);

  const txConfirmed = (txRes.data ?? []).filter((t: any) => t.status === 'confirmed');
  const grossLast30 = txConfirmed.reduce((s: number, t: any) => s + Number(t.amount_usd ?? 0), 0);
  const netLast30 = txConfirmed.reduce((s: number, t: any) => s + Number(t.net_amount_usd ?? 0), 0);
  const pendingPayouts = (payoutsRes.data ?? []).reduce((s: number, p: any) => s + Number(p.amount_usd ?? 0), 0);

  return {
    mrrUsd: grossLast30,
    activeSubs: activeSubsRes.count ?? 0,
    newSubsLast30: newSubsRes.count ?? 0,
    cancelledLast30: cancelledSubsRes.count ?? 0,
    grossLast30Usd: grossLast30,
    netLast30Usd: netLast30,
    pendingPayoutsUsd: pendingPayouts,
    pendingPayoutsCount: (payoutsRes.data ?? []).length,
    affiliatesActive: affiliatesRes.count ?? 0,
    studentsTotal: studentsRes.count ?? 0,
  };
}

export async function fetchPlatformBreakdown(): Promise<PlatformBreakdown[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data } = await supabase
    .from('payment_transactions')
    .select('platform, amount_usd, status')
    .gte('occurred_at', since.toISOString());

  const grouped = new Map<string, { count: number; gross: number }>();
  (data ?? []).forEach((t: any) => {
    if (t.status !== 'confirmed') return;
    const key = t.platform || 'unknown';
    const prev = grouped.get(key) ?? { count: 0, gross: 0 };
    prev.count += 1;
    prev.gross += Number(t.amount_usd ?? 0);
    grouped.set(key, prev);
  });
  return Array.from(grouped.entries()).map(([platform, v]) => ({ platform, ...v }));
}

export type PayoutRow = {
  id: string;
  affiliate_user_id: string;
  amount_usd: number;
  status: string;
  provider: string;
  destination: string | null;
  external_ref: string | null;
  requested_at: string;
  processed_at: string | null;
  error_message: string | null;
  affiliate_name?: string | null;
  affiliate_email?: string | null;
};

export async function fetchPayouts(): Promise<PayoutRow[]> {
  const { data } = await supabase
    .from('payout_requests')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(200);
  if (!data?.length) return [];
  const ids = Array.from(new Set(data.map((p: any) => p.affiliate_user_id)));
  const { data: profiles } = await supabase.from('user_profiles').select('id, full_name').in('id', ids);
  const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return data.map((p: any) => ({
    ...p,
    affiliate_name: profMap.get(p.affiliate_user_id)?.full_name ?? '—',
  }));
}

export async function processPayoutAction(
  payoutId: string,
  action: 'approve' | 'reject' | 'mark_paid',
  options?: { external_ref?: string; reason?: string }
): Promise<{ ok: boolean; error?: string; status?: string }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false, error: 'unauthenticated' };
  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-process-payout`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id: payoutId, action, ...options }),
    });
    const j = await res.json();
    if (!res.ok) return { ok: false, error: j.error ?? 'failed' };
    return { ok: true, status: j.status };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'network_error' };
  }
}

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  language: string | null;
  kartra_contact_id: string | null;
  accepted_terms_at: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string | null;
  roles: string[];
  subscription?: { status: string; platform: string | null; period_end: string | null } | null;
  affiliate?: { status: string; payout_provider: string | null; payout_email: string | null; rewardful_id: string | null } | null;
};

export async function fetchUsers(query: string): Promise<AdminUserRow[]> {
  let req = supabase
    .from('user_profiles')
    .select('id, full_name, country, city, timezone, language, kartra_contact_id, accepted_terms_at, onboarded_at, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (query.trim()) req = req.ilike('full_name', `%${query.trim()}%`);
  const { data } = await req;
  if (!data?.length) return [];
  const ids = data.map((u: any) => u.id);
  const [rolesRes, subsRes, affiliatesRes] = await Promise.all([
    supabase.from('user_roles').select('user_id, role').in('user_id', ids),
    supabase.from('subscriptions').select('user_id, status, platform, current_period_end').in('user_id', ids).order('created_at', { ascending: false }),
    supabase.from('affiliate_profiles').select('id, status, payout_provider, payout_email, rewardful_affiliate_id').in('id', ids),
  ]);
  const roleMap = new Map<string, string[]>();
  (rolesRes.data ?? []).forEach((r: any) => {
    const arr = roleMap.get(r.user_id) ?? [];
    arr.push(r.role);
    roleMap.set(r.user_id, arr);
  });
  const subMap = new Map<string, any>();
  (subsRes.data ?? []).forEach((s: any) => {
    if (!subMap.has(s.user_id)) subMap.set(s.user_id, { status: s.status, platform: s.platform, period_end: s.current_period_end });
  });
  const affMap = new Map<string, any>();
  (affiliatesRes.data ?? []).forEach((a: any) => {
    affMap.set(a.id, { status: a.status, payout_provider: a.payout_provider, payout_email: a.payout_email, rewardful_id: a.rewardful_affiliate_id });
  });
  return data.map((u: any) => ({
    ...u,
    roles: roleMap.get(u.id) ?? [],
    subscription: subMap.get(u.id) ?? null,
    affiliate: affMap.get(u.id) ?? null,
  }));
}

export async function updateUserProfile(
  userId: string,
  updates: { full_name?: string; country?: string; city?: string; timezone?: string; language?: string }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { ok: false, error: error.message };
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_audit_log').insert({
      actor_id: user.id, action: 'user_profile.update', target_table: 'user_profiles', target_id: userId, metadata: updates,
    });
  }
  return { ok: true };
}

export async function grantUserRole(userId: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role, granted_at: new Date().toISOString() }, { onConflict: 'user_id,role' });
  if (error) return { ok: false, error: error.message };
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_audit_log').insert({
      actor_id: user.id, action: 'user_role.grant', target_table: 'user_roles', target_id: userId, metadata: { role },
    });
  }
  return { ok: true };
}

export async function revokeUserRole(userId: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
  if (error) return { ok: false, error: error.message };
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_audit_log').insert({
      actor_id: user.id, action: 'user_role.revoke', target_table: 'user_roles', target_id: userId, metadata: { role },
    });
  }
  return { ok: true };
}

export async function fetchTransactions(filters: { platform?: string; status?: string; limit?: number }) {
  let q = supabase
    .from('payment_transactions')
    .select('id, user_id, program_id, affiliate_user_id, platform, amount_usd, net_amount_usd, status, external_ref, occurred_at, products_programs(title)')
    .order('occurred_at', { ascending: false })
    .limit(filters.limit ?? 200);
  if (filters.platform) q = q.eq('platform', filters.platform);
  if (filters.status) q = q.eq('status', filters.status);
  const { data } = await q;
  return data ?? [];
}

export async function fetchAuditLog(limit = 100) {
  const { data } = await supabase
    .from('admin_audit_log')
    .select('id, actor_id, action, target_table, target_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!data?.length) return [];
  const ids = Array.from(new Set(data.map((r: any) => r.actor_id).filter(Boolean)));
  const { data: profs } = ids.length
    ? await supabase.from('user_profiles').select('id, full_name').in('id', ids)
    : { data: [] as any[] };
  const m = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
  return data.map((r: any) => ({ ...r, actor_name: m.get(r.actor_id) ?? '—' }));
}

export async function fetchFeatureFlags() {
  const { data } = await supabase.from('feature_flags').select('*').order('key');
  return data ?? [];
}

export async function setFeatureFlag(key: string, enabled: boolean) {
  const { error } = await supabase.from('feature_flags').update({ enabled, updated_at: new Date().toISOString() }).eq('key', key);
  if (!error) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('admin_audit_log').insert({
        actor_id: user.id,
        action: 'feature_flag.update',
        target_table: 'feature_flags',
        target_id: key,
        metadata: { key, enabled },
      });
    }
  }
  return { error: error?.message ?? null };
}

export async function fetchSystemSettings() {
  const { data } = await supabase.from('system_settings').select('*').order('key');
  return data ?? [];
}

export async function setSystemSetting(key: string, value: any) {
  const { error } = await supabase
    .from('system_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);
  if (!error) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('admin_audit_log').insert({
        actor_id: user.id,
        action: 'system_setting.update',
        target_table: 'system_settings',
        target_id: key,
        metadata: { key, value },
      });
    }
  }
  return { error: error?.message ?? null };
}

export async function fetchProgramsAdmin() {
  const { data } = await supabase
    .from('products_programs')
    .select('id, slug, title, subtitle, tier, price_usd, is_published, display_order')
    .order('display_order');
  return data ?? [];
}

export async function fetchCoursesByProgram(programId: string) {
  const { data } = await supabase
    .from('courses')
    .select('id, title, description, display_order, is_published')
    .eq('program_id', programId)
    .order('display_order');
  return data ?? [];
}

export async function fetchModulesByCourse(courseId: string) {
  const { data } = await supabase
    .from('course_modules')
    .select('id, title, description, display_order, is_published')
    .eq('course_id', courseId)
    .order('display_order');
  return data ?? [];
}

export async function fetchLessonsByModule(moduleId: string) {
  const { data } = await supabase
    .from('course_lessons')
    .select('id, title, description, duration_seconds, is_free, is_published, display_order, video_external_url')
    .eq('module_id', moduleId)
    .order('display_order');
  return data ?? [];
}

export async function getUploadSignature(opts: { folder?: string; resource_type?: string; public_id?: string }) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false as const, error: 'unauthenticated' };
  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-upload-media`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });
    const j = await res.json();
    if (!res.ok) return { ok: false as const, error: j.error ?? 'failed' };
    return { ok: true as const, ...j };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'network_error' };
  }
}

export async function updateLessonVideoUrl(lessonId: string, videoUrl: string) {
  const { error } = await supabase
    .from('course_lessons')
    .update({ video_external_url: videoUrl })
    .eq('id', lessonId);
  return { error: error?.message ?? null };
}

// ─────────────────────────────────────────────
// STORE PRODUCTS
// ─────────────────────────────────────────────

export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  image_url: string | null;
  category: 'merch' | 'service' | 'event' | 'experience';
  is_active: boolean;
  display_order: number;
  stock_limit: number | null;
  kartra_tag: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchStoreProductsAdmin(): Promise<StoreProduct[]> {
  const { data } = await supabase
    .from('store_products')
    .select('*')
    .order('display_order', { ascending: true });
  return (data as StoreProduct[]) ?? [];
}

export async function upsertStoreProduct(
  product: Partial<StoreProduct> & { name: string; price_usd: number }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const now = new Date().toISOString();
  const payload = { ...product, updated_at: now };
  if (!product.id) {
    const { data, error } = await supabase.from('store_products').insert({ ...payload, created_at: now }).select('id').single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  }
  const { error } = await supabase.from('store_products').update(payload).eq('id', product.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: product.id };
}

export async function toggleStoreProduct(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('store_products').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id);
  return { ok: !error, error: error?.message };
}

export async function generateAdminCheckoutLink(productId: string): Promise<{ url: string | null; error: string | null }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { url: null, error: 'unauthenticated' };
  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    });
    const j = await res.json();
    if (!res.ok) return { url: null, error: j.error ?? 'checkout_failed' };
    return { url: j.url ?? null, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message ?? 'network_error' };
  }
}

export async function generatePremiumPaymentLink(): Promise<{ url: string | null; error: string | null }> {
  const { data: programData } = await supabase
    .from('products_programs')
    .select('id')
    .eq('tier', 'premium')
    .eq('is_published', true)
    .order('display_order')
    .limit(1)
    .maybeSingle();

  if (!programData?.id) return { url: null, error: 'no_premium_program' };

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { url: null, error: 'unauthenticated' };

  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-stripe-payment-link`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: programData.id }),
    });
    const j = await res.json();
    if (!res.ok) return { url: null, error: j.error ?? j.details ?? 'failed' };
    return { url: j.url ?? null, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message ?? 'network_error' };
  }
}

// ─────────────────────────────────────────────
// PUBLICATIONS (announcements extended)
// ─────────────────────────────────────────────

export type Publication = {
  id: string;
  title: string;
  body: string;
  cover_url: string | null;
  category: 'announcement' | 'resource' | 'event' | 'article';
  cta_url: string | null;
  cta_label: string | null;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
  author_label: string;
  created_at: string;
};

export async function fetchPublicationsAdmin(): Promise<Publication[]> {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as Publication[]) ?? [];
}

export async function upsertPublication(
  pub: Partial<Publication> & { title: string }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const now = new Date().toISOString();
  const payload = {
    ...pub,
    published_at: pub.is_published ? (pub.published_at ?? now) : pub.published_at,
  };
  if (!pub.id) {
    const { data, error } = await supabase.from('announcements').insert({ ...payload, created_at: now }).select('id').single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  }
  const { error } = await supabase.from('announcements').update(payload).eq('id', pub.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: pub.id };
}

export async function deletePublication(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  return { ok: !error, error: error?.message };
}

export async function fetchSupportTickets() {
  const { data } = await supabase
    .from('support_tickets')
    .select('id, subject, status, priority, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(100);
  if (!data?.length) return [];
  const ids = Array.from(new Set(data.map((t: any) => t.user_id)));
  const { data: profs } = await supabase.from('user_profiles').select('id, full_name').in('id', ids);
  const m = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
  return data.map((t: any) => ({ ...t, user_name: m.get(t.user_id) ?? '—' }));
}

export async function sendBroadcastNotification(payload: {
  audience: 'all' | 'students' | 'affiliates' | 'premium';
  title: string;
  body: string;
  link?: string;
}) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false, error: 'unauthenticated' };
  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) return { ok: false, error: j.error ?? 'failed' };
    return { ok: true, count: j.count };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'network_error' };
  }
}
