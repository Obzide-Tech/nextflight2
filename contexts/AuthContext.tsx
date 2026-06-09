import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Role } from '@/lib/supabase';
import { registerPushTokenIfPossible } from '@/lib/push';
import { loadReferralCode, clearReferralCode, captureAttribution } from '@/lib/attribution';

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  language: string | null;
  onboarded_at: string | null;
  notification_prefs: { push?: boolean; email?: boolean; announcements?: boolean } | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    const [{ data: profileData }, { data: rolesData }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    setProfile(profileData ?? null);
    setRoles((rolesData ?? []).map((r: any) => r.role as Role));
    registerPushTokenIfPossible(userId).catch(() => {});
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => {
          await loadUserData(newSession.user.id);
        })();
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        accepted_terms_at: new Date().toISOString(),
        terms_version: 'v1',
      });
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'student_free',
      });
      // Auto-enroll into the free Starter program for the demo experience
      const { data: starter } = await supabase
        .from('products_programs')
        .select('id')
        .eq('slug', 'nextflight-starter')
        .maybeSingle();
      if (starter?.id) {
        await supabase.from('enrollments').insert({
          user_id: data.user.id,
          program_id: starter.id,
        });
      }

      // Capture referral attribution if the user arrived via an affiliate link
      const referralCode = loadReferralCode();
      if (referralCode) {
        await captureAttribution(referralCode, data.user.id);
        clearReferralCode();
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refresh = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        roles,
        loading,
        signIn,
        signUp,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
