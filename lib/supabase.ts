import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export type Role =
  | 'student_free'
  | 'student_premium'
  | 'affiliate'
  | 'admin_owner'
  | 'admin_finance'
  | 'admin_content'
  | 'admin_support';

export const ADMIN_ROLES: Role[] = ['admin_owner', 'admin_finance', 'admin_content', 'admin_support'];

export function isAdminRole(roles: Role[] | string[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r as Role));
}
