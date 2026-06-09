import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const STORAGE_KEY = 'nf_referral_code';
const EXPIRY_DAYS = 30;

export async function saveReferralCode(code: string): Promise<void> {
  const expiry = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ code: code.toUpperCase(), expiry }));
}

export async function loadReferralCode(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return code as string;
  } catch {
    return null;
  }
}

export async function clearReferralCode(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function captureAttribution(code: string, userId: string): Promise<void> {
  const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/capture-attribution`;
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? '';
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, referred_user_id: userId }),
    });
  } catch {
    // Best-effort — never block the signup flow
  }
}
