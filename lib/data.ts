import { supabase } from './supabase';

export type Program = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  tier: 'free' | 'premium';
  price_usd: number;
  checkout_url: string | null;
};

export type ModuleWithLessons = {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  lessons: LessonRow[];
};

export type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  body_content: string | null;
  duration_seconds: number;
  is_free: boolean;
  display_order: number;
  video_external_url: string | null;
  video_storage_path: string | null;
  tutor_name: string | null;
  tutor_title: string | null;
  tutor_avatar_url: string | null;
  // Joined from course_modules
  module_title?: string | null;
  module_order?: number | null;
};

export async function fetchEnrolledProgramsWithProgress(userId: string) {
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('program_id, products_programs(id, slug, title, subtitle, cover_url, tier, price_usd, description)')
    .eq('user_id', userId);

  const fromEnrollments = (enrollments ?? [])
    .map((e: any) => e.products_programs as Program)
    .filter(Boolean);

  if (fromEnrollments.length > 0) return fromEnrollments;

  // Fallback: active subscription grants access to all published programs
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, program_id')
    .eq('user_id', userId)
    .in('status', ['active', 'grace_period'])
    .limit(1)
    .maybeSingle();

  if (!sub) return [];

  if (sub.program_id) {
    const { data: prog } = await supabase
      .from('products_programs')
      .select('id, slug, title, subtitle, cover_url, tier, price_usd, description')
      .eq('id', sub.program_id)
      .maybeSingle();
    return prog ? [prog as Program] : [];
  }

  // Subscription not tied to specific program — return all published programs
  const { data: programs } = await supabase
    .from('products_programs')
    .select('id, slug, title, subtitle, cover_url, tier, price_usd, description')
    .eq('is_published', true)
    .order('display_order');

  return (programs as Program[]) ?? [];
}

export async function fetchProgramBySlug(slug: string): Promise<Program | null> {
  const { data } = await supabase
    .from('products_programs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as Program) ?? null;
}

export async function fetchModulesWithLessons(programId: string): Promise<ModuleWithLessons[]> {
  const { data: courses } = await supabase
    .from('courses')
    .select('id')
    .eq('program_id', programId)
    .eq('is_published', true)
    .order('display_order');

  if (!courses?.length) return [];
  const courseIds = courses.map((c: any) => c.id);

  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, description, display_order')
    .in('course_id', courseIds)
    .eq('is_published', true)
    .order('display_order');

  if (!modules?.length) return [];
  const moduleIds = modules.map((m: any) => m.id);

  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('*')
    .in('module_id', moduleIds)
    .eq('is_published', true)
    .order('display_order');

  return modules.map((m: any) => ({
    ...m,
    lessons: (lessons ?? []).filter((l: any) => l.module_id === m.id),
  }));
}

export async function fetchLesson(lessonId: string): Promise<LessonRow | null> {
  const { data } = await supabase
    .from('course_lessons')
    .select('*, course_modules(title, display_order)')
    .eq('id', lessonId)
    .maybeSingle();
  if (!data) return null;
  const mod = (data as any).course_modules;
  return {
    ...(data as any),
    module_title: mod?.title ?? null,
    module_order: mod?.display_order ?? null,
    course_modules: undefined,
  } as LessonRow;
}

export async function fetchLessonNote(userId: string, lessonId: string): Promise<string> {
  const { data } = await supabase
    .from('lesson_notes')
    .select('content')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  return data?.content ?? '';
}

export async function saveLessonNote(userId: string, lessonId: string, content: string) {
  const { error } = await supabase
    .from('lesson_notes')
    .upsert(
      { user_id: userId, lesson_id: lessonId, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    );
  return { error: error?.message ?? null };
}

export async function fetchLessonProgress(userId: string, lessonId: string) {
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  return data;
}

export async function markLessonCompleted(userId: string, lessonId: string) {
  await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  );
}

export async function savePositionSeconds(userId: string, lessonId: string, positionSeconds: number) {
  await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      position_seconds: Math.floor(positionSeconds),
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  );
}

export async function fetchAnnouncements(limit = 5) {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchFaqs() {
  const { data } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_published', true)
    .order('display_order');
  return data ?? [];
}

export async function fetchLessonAssets(moduleId: string) {
  const { data } = await supabase
    .from('lesson_assets')
    .select('*')
    .eq('module_id', moduleId);
  return data ?? [];
}

export type SubscriptionRow = {
  id: string;
  status: 'active' | 'inactive' | 'grace_period' | 'on_hold' | 'cancelled' | 'expired';
  platform: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  program_id: string | null;
};

export async function fetchActiveSubscription(userId: string): Promise<SubscriptionRow | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'grace_period'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SubscriptionRow) ?? null;
}

export async function fetchPublishedPrograms(): Promise<Program[]> {
  const { data } = await supabase
    .from('products_programs')
    .select('id, slug, title, subtitle, description, cover_url, tier, price_usd, checkout_url')
    .eq('is_published', true)
    .order('display_order');
  return (data as Program[]) ?? [];
}

export async function fetchAffiliateNetwork(affiliateUserId: string) {
  const { data: attrs } = await supabase
    .from('referral_attributions')
    .select('id, referred_user_id, attributed_at, expires_at')
    .eq('affiliate_user_id', affiliateUserId)
    .order('attributed_at', { ascending: false });

  const ids = (attrs ?? []).map((a: any) => a.referred_user_id).filter(Boolean);

  const [{ data: profiles }, { data: txs }] = await Promise.all([
    ids.length
      ? supabase.from('user_profiles').select('id, full_name, country, city').in('id', ids)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('payment_transactions')
      .select('user_id, amount_usd, status, occurred_at')
      .eq('affiliate_user_id', affiliateUserId),
  ]);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const txByUser = new Map<string, { confirmed: number; pending: number; total: number }>();
  (txs ?? []).forEach((t: any) => {
    if (!t.user_id) return;
    const cur = txByUser.get(t.user_id) ?? { confirmed: 0, pending: 0, total: 0 };
    if (t.status === 'confirmed') cur.confirmed += Number(t.amount_usd);
    if (t.status === 'pending') cur.pending += Number(t.amount_usd);
    cur.total += Number(t.amount_usd);
    txByUser.set(t.user_id, cur);
  });

  return (attrs ?? []).map((a: any) => ({
    id: a.id,
    referredUserId: a.referred_user_id,
    profile: a.referred_user_id ? profileMap.get(a.referred_user_id) : null,
    attributedAt: a.attributed_at,
    expiresAt: a.expires_at,
    sales: a.referred_user_id ? txByUser.get(a.referred_user_id) : null,
  }));
}

export async function fetchPayoutRequests(affiliateUserId: string) {
  const { data } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('affiliate_user_id', affiliateUserId)
    .order('requested_at', { ascending: false });
  return data ?? [];
}

export async function fetchKycProfile(userId: string) {
  const { data } = await supabase
    .from('kyc_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function fetchAffiliateProfile(userId: string) {
  const { data } = await supabase
    .from('affiliate_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function getSignedLessonUrl(lessonId: string): Promise<{ url: string | null; error: string | null }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { url: null, error: 'unauthenticated' };

  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sign-lesson-url`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId }),
    });
    const json = await res.json();
    if (!res.ok) return { url: null, error: json.error ?? 'sign_failed' };
    return { url: json.url ?? null, error: null };
  } catch (e: any) {
    return { url: null, error: e.message ?? 'network_error' };
  }
}

export type WeeklyProgress = { day: string; minutes: number };

export async function fetchWeeklyProgress(userId: string): Promise<WeeklyProgress[]> {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('lesson_progress')
    .select('last_watched_at, watched_seconds')
    .eq('user_id', userId)
    .gte('last_watched_at', since.toISOString());

  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  (data ?? []).forEach((row: any) => {
    if (!row.last_watched_at) return;
    const key = row.last_watched_at.slice(0, 10);
    const prev = buckets.get(key) ?? 0;
    buckets.set(key, prev + Math.round((row.watched_seconds ?? 0) / 60));
  });

  const labels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return Array.from(buckets.entries()).map(([dateStr, minutes]) => {
    const day = new Date(dateStr).getDay();
    return { day: labels[day], minutes };
  });
}

export async function fetchStoreProducts() {
  const { data } = await supabase
    .from('store_products')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  return data ?? [];
}

export async function createStoreCheckout(productId: string): Promise<{ url: string | null; error: string | null }> {
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

export async function fetchPublications(limit = 20) {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchPurchaseHistory(userId: string) {
  const { data } = await supabase
    .from('payment_transactions')
    .select('id, amount_usd, currency, status, occurred_at, source, products_programs(title)')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(20);
  return data ?? [];
}
