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

  const loadUserData = async (userId: string, metaName?: string) => {
    const [{ data: profileData }, { data: rolesData }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    if (profileData) {
      setProfile(profileData);
    } else if (metaName) {
      setProfile({ id: userId, full_name: metaName, avatar_url: null, country: null, city: null, timezone: null, language: null, onboarded_at: null, notification_prefs: null });
    } else {
      setProfile(null);
    }
    setRoles((rolesData ?? []).map((r: any) => r.role as Role));
    registerPushTokenIfPossible(userId).catch(() => {});
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const metaName = session.user.user_metadata?.full_name ?? undefined;
        loadUserData(session.user.id, metaName).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        const metaName = newSession.user.user_metadata?.full_name ?? undefined;
        (async () => {
          await loadUserData(newSession.user.id, metaName);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };

    // Profile and role are created automatically by the DB trigger on_auth_user_created.
    // Capture referral attribution if the user arrived via an affiliate link.
    const referralCode = await loadReferralCode();
    if (referralCode) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        await captureAttribution(referralCode, sessionData.session.user.id);
      }
      await clearReferralCode();
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refresh = async () => {
    if (session?.user) {
      const metaName = session.user.user_metadata?.full_name ?? undefined;
      await loadUserData(session.user.id, metaName);
    }
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
