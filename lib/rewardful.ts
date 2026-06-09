import { supabase } from './supabase';

type RewardfulResponse = { ok: true; data?: any } | { ok: false; error: string };

async function rewardfulProxy(endpoint: string, method = 'GET', body?: any): Promise<RewardfulResponse> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false, error: 'unauthenticated' };

  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/rewardful-proxy`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, method, body }),
    });
    const j = await res.json();
    if (!res.ok) return { ok: false, error: j.error ?? 'rewardful_request_failed' };
    return { ok: true, data: j };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'network_error' };
  }
}

export async function fetchRewardfulAffiliate(affiliateId: string): Promise<RewardfulResponse> {
  return rewardfulProxy(`/affiliates/${affiliateId}`);
}

export async function fetchRewardfulReferrals(affiliateId: string): Promise<RewardfulResponse> {
  return rewardfulProxy(`/affiliates/${affiliateId}/referrals`);
}

export async function fetchRewardfulCommissions(affiliateId: string): Promise<RewardfulResponse> {
  return rewardfulProxy(`/affiliates/${affiliateId}/commissions`);
}

export async function fetchRewardfulPayouts(affiliateId: string): Promise<RewardfulResponse> {
  return rewardfulProxy(`/affiliates/${affiliateId}/payouts`);
}

export async function createRewardfulAffiliate(email: string, firstName: string, lastName: string): Promise<RewardfulResponse> {
  return rewardfulProxy('/affiliates', 'POST', {
    email,
    first_name: firstName,
    last_name: lastName,
  });
}

export async function findRewardfulAffiliateByEmail(email: string): Promise<RewardfulResponse> {
  const res = await rewardfulProxy(`/affiliates?email=${encodeURIComponent(email)}`);
  // Rewardful returns a paginated list; unwrap first result
  if (res.ok && Array.isArray(res.data?.data) && res.data.data.length > 0) {
    return { ok: true, data: res.data.data[0] };
  }
  return res;
}

export async function isRewardfulEnabled(): Promise<boolean> {
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', 'rewardful_enabled')
    .maybeSingle();
  return data?.enabled === true;
}
