import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Languages, Save, Camera, LogOut, FileText, Shield, ChevronRight, ShieldCheck, Receipt } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchPurchaseHistory } from '@/lib/data';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { HERO_BACKGROUND, LOGO_SEAL_GOLD_GRAD } from '@/constants/logos';

const TIMEZONES = ['America/Mexico_City', 'America/Bogota', 'America/Caracas', 'America/Argentina/Buenos_Aires', 'Europe/Madrid'];

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  grace_period: 'Periodo de gracia',
  on_hold: 'En espera',
  cancelled: 'Cancelada',
  expired: 'Expirada',
  inactive: 'Inactiva',
};

const STATUS_COLOR: Record<string, string> = {
  active: '#4CAF50',
  grace_period: '#FF9800',
  on_hold: '#FF9800',
  cancelled: '#F44336',
  expired: '#F44336',
  inactive: '#9E9E9E',
};

export default function Profile() {
  const router = useRouter();
  const { user, profile, refresh, roles, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [language, setLanguage] = useState('es');
  const [timezone, setTimezone] = useState('America/Mexico_City');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pushPref, setPushPref] = useState(true);
  const [emailPref, setEmailPref] = useState(true);
  const [annPref, setAnnPref] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setCountry(profile.country ?? '');
      setCity(profile.city ?? '');
      setLanguage(profile.language ?? 'es');
      setTimezone(profile.timezone ?? 'America/Mexico_City');
      setAvatarUrl(profile.avatar_url ?? null);
      const prefs = profile.notification_prefs ?? {};
      setPushPref(prefs.push !== false);
      setEmailPref(prefs.email !== false);
      setAnnPref(prefs.announcements !== false);
    }
    if (user) {
      fetchPurchaseHistory(user.id).then(setHistory);
      supabase
        .from('subscriptions')
        .select('status, platform, current_period_start, program_id, programs(title)')
        .eq('user_id', user.id)
        .in('status', ['active', 'grace_period', 'on_hold'])
        .maybeSingle()
        .then(({ data }) => setSubscription(data));
    }
  }, [profile, user?.id]);

  const savePref = async (key: string, value: boolean) => {
    if (!user) return;
    const current = profile?.notification_prefs ?? {};
    const { error: prefErr } = await supabase.from('user_profiles').upsert({
      id: user.id,
      notification_prefs: { ...current, [key]: value },
      updated_at: new Date().toISOString(),
    });
    if (prefErr) {
      // Revert UI state on failure
      if (key === 'push') setPushPref(!value);
      if (key === 'email') setEmailPref(!value);
      if (key === 'announcements') setAnnPref(!value);
      setError('No se pudo guardar la preferencia. Inténtalo de nuevo.');
      return;
    }
    await refresh();
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('user_profiles').upsert({
      id: user.id,
      full_name: fullName,
      country,
      city,
      language,
      timezone,
      notification_prefs: { push: pushPref, email: emailPref, announcements: annPref },
      updated_at: new Date().toISOString(),
    });
    if (err) {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } else {
      await refresh();
      setSavedAt(new Date().toLocaleTimeString());
    }
    setSaving(false);
  };

  const onPickAvatar = () => {
    if (Platform.OS === 'web') {
      fileRef.current?.click();
    }
  };

  const onAvatarChange = async (e: any) => {
    if (!user) return;
    const file: File | undefined = e?.target?.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError(upErr.message);
      setUploadingAvatar(false);
      return;
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('user_profiles').upsert({ id: user.id, avatar_url: pub.publicUrl, updated_at: new Date().toISOString() });
    setAvatarUrl(pub.publicUrl);
    await refresh();
    setUploadingAvatar(false);
    setSavedAt('Avatar actualizado');
    e.target.value = '';
  };

  const isAffiliate = roles.includes('affiliate');
  const isPremium = roles.includes('student_premium');

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[800]]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.cream[100]} />
          </TouchableOpacity>
          <Text style={styles.crumb}>Tu perfil</Text>
        </View>

        {Platform.OS === 'web' ? (
          // @ts-ignore web-only
          <input ref={fileRef as any} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
        ) : null}

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Hero banner */}
          <View style={styles.heroBanner}>
            {HERO_BACKGROUND ? (
              <Image source={HERO_BACKGROUND} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            <LinearGradient
              colors={['rgba(48,5,14,0.3)', 'rgba(48,5,14,0.75)', colors.burgundy[900]]}
              style={StyleSheet.absoluteFill}
            />
            {LOGO_SEAL_GOLD_GRAD ? (
              <Image source={LOGO_SEAL_GOLD_GRAD} style={styles.heroSeal} resizeMode="contain" />
            ) : null}
            <View style={styles.heroContent}>
              <TouchableOpacity onPress={onPickAvatar} style={styles.avatarWrap} activeOpacity={Platform.OS === 'web' ? 0.8 : 1}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <User size={32} color={colors.gold[400]} strokeWidth={1.4} />
                  </View>
                )}
                {Platform.OS === 'web' ? (
                  <View style={styles.cameraBadge}>
                    {uploadingAvatar
                      ? <ActivityIndicator color={colors.burgundy[900]} size="small" />
                      : <Camera size={14} color={colors.burgundy[900]} />}
                  </View>
                ) : null}
              </TouchableOpacity>
              <Text style={styles.heroName}>{fullName || ''}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>

          {/* ── Suscripción / Inscripción ── */}
          <Text style={styles.sectionLabel}>Mi Inscripción</Text>
          <View style={styles.subCard}>
            <View style={styles.subCardLeft}>
              <ShieldCheck size={22} color={subscription ? STATUS_COLOR[subscription.status] ?? colors.gold[400] : 'rgba(255,251,224,0.3)'} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.subTitle}>
                  {subscription?.programs?.title ?? (isPremium ? 'NextFlight Premium' : 'NextFlight Starter')}
                </Text>
                {subscription ? (
                  <View style={styles.subStatusRow}>
                    <View style={[styles.subStatusDot, { backgroundColor: STATUS_COLOR[subscription.status] ?? colors.gold[400] }]} />
                    <Text style={[styles.subStatus, { color: STATUS_COLOR[subscription.status] ?? colors.gold[400] }]}>
                      {STATUS_LABEL[subscription.status] ?? subscription.status}
                    </Text>
                    {subscription.current_period_start ? (
                      <Text style={styles.subDate}>
                        · {new Date(subscription.current_period_start).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.subStatus}>Sin inscripción activa</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/aduana')} style={styles.subArrow}>
              <ChevronRight size={16} color={colors.cream[200]} />
            </TouchableOpacity>
          </View>

          {/* ── Historial de compras ── */}
          <Text style={styles.sectionLabel}>Historial de compras</Text>
          {history.length === 0 ? (
            <View style={styles.emptyHistoryCard}>
              <Receipt size={22} color="rgba(175,137,86,0.35)" strokeWidth={1.5} />
              <Text style={styles.emptyHistoryText}>Aún no tienes compras registradas.</Text>
            </View>
          ) : (
            <View style={styles.historyCard}>
              {history.map((tx, idx) => (
                <View key={tx.id} style={[styles.historyRow, idx === history.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>{tx.products_programs?.title ?? 'Programa'}</Text>
                    <Text style={styles.historyMeta}>
                      {new Date(tx.occurred_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={styles.historyAmount}>${Number(tx.amount_usd).toFixed(2)} USD</Text>
                    <View style={[styles.txStatusBadge, { backgroundColor: (statusBgColor(tx.status)) }]}>
                      <Text style={[styles.txStatusText, { color: statusColor(tx.status) }]}>{tx.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Datos personales ── */}
          <Text style={styles.sectionLabel}>Datos personales</Text>

          <Text style={styles.label}>Nombre completo</Text>
          <View style={styles.field}>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Tu nombre" placeholderTextColor={colors.cream[200]} />
          </View>

          <Text style={styles.label}>País</Text>
          <View style={styles.field}>
            <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="País" placeholderTextColor={colors.cream[200]} />
          </View>

          <Text style={styles.label}>Ciudad</Text>
          <View style={styles.field}>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Ciudad" placeholderTextColor={colors.cream[200]} />
          </View>

          <Text style={styles.label}>Idioma</Text>
          <View style={styles.field}>
            <Languages size={16} color={colors.gold[400]} />
            <TextInput style={styles.input} value={language} onChangeText={setLanguage} placeholder="es" placeholderTextColor={colors.cream[200]} />
          </View>

          <Text style={styles.label}>Zona horaria</Text>
          <View style={styles.tzRow}>
            {TIMEZONES.map((tz) => {
              const active = tz === timezone;
              return (
                <TouchableOpacity key={tz} onPress={() => setTimezone(tz)} style={[styles.tzPill, active && styles.tzPillActive]}>
                  <Text style={[styles.tzText, active && styles.tzTextActive]}>{tz.split('/').pop()?.replace('_', ' ')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={[styles.cta, saving && { opacity: 0.7 }]} onPress={onSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.burgundy[900]} /> : (
              <>
                <Save size={16} color={colors.burgundy[900]} strokeWidth={1.6} />
                <Text style={styles.ctaText}>Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>
          {savedAt ? <Text style={styles.saved}>{savedAt}</Text> : null}

          {/* ── Notificaciones ── */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Notificaciones</Text>
          <View style={styles.prefsCard}>
            <PrefRow
              label="Push en este dispositivo"
              value={pushPref}
              onChange={(v) => { setPushPref(v); savePref('push', v); }}
            />
            <PrefRow
              label="Anuncios y novedades"
              value={annPref}
              onChange={(v) => { setAnnPref(v); savePref('announcements', v); }}
            />
            <PrefRow
              label="Resumen mensual por correo"
              value={emailPref}
              onChange={(v) => { setEmailPref(v); savePref('email', v); }}
              last
            />
          </View>

          {/* ── Roles ── */}
          <View style={styles.rolesCard}>
            <Text style={styles.label}>Tus roles</Text>
            <Text style={styles.rolesText}>{roles.length ? roles.join(' · ') : 'Sin roles asignados'}</Text>
            {!isAffiliate ? (
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(app)/affiliate-activate')}>
                <Text style={styles.linkText}>Activar tu cabina de Copiloto</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Legal ── */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Uso de la Plataforma</Text>
          <View style={styles.legalCard}>
            <LegalRow icon="file" label="Términos y Condiciones" onPress={() => router.push('/(legal)/terms')} />
            <LegalRow icon="shield" label="Política de Privacidad" onPress={() => router.push('/(legal)/privacy')} />
            <LegalRow icon="file" label="Aviso de Resultados e Ingresos" onPress={() => router.push('/(legal)/income-disclaimer')} />
            <LegalRow icon="file" label="Política de Reembolso y Cancelación" onPress={() => router.push('/(legal)/refund-policy')} />
            <LegalRow icon="file" label="Acuerdo de Compra e Inscripción" onPress={() => router.push('/(legal)/enrollment-agreement')} />
            <LegalRow icon="shield" label="Código de Conducta Estudiantil" onPress={() => router.push('/(legal)/conduct')} last />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Programa Copilotos</Text>
          <View style={styles.legalCard}>
            <LegalRow icon="file" label="Acuerdo de Afiliados" onPress={() => router.push('/(legal)/affiliate-agreement')} />
            <LegalRow icon="file" label="Código de Conducta de Afiliados" onPress={() => router.push('/(legal)/affiliate-guidelines')} last />
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
            <LogOut size={16} color={colors.cream[200]} strokeWidth={1.5} />
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PrefRow({ label, value, onChange, last }: { label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.prefRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? colors.gold[400] : colors.cream[200]}
        trackColor={{ false: 'rgba(255,251,224,0.18)', true: colors.burgundy[700] }}
      />
    </View>
  );
}

function LegalRow({ icon, label, onPress, last }: { icon: 'file' | 'shield'; label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.legalRow, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon === 'shield'
        ? <Shield size={15} color={colors.gold[400]} strokeWidth={1.5} />
        : <FileText size={15} color={colors.gold[400]} strokeWidth={1.5} />
      }
      <Text style={styles.legalText}>{label}</Text>
      <ChevronRight size={15} color={colors.cream[200]} />
    </TouchableOpacity>
  );
}

function statusColor(status: string): string {
  if (status === 'confirmed') return '#4CAF50';
  if (status === 'refunded' || status === 'failed') return '#F44336';
  return colors.gold[400];
}

function statusBgColor(status: string): string {
  if (status === 'confirmed') return 'rgba(76,175,80,0.12)';
  if (status === 'refunded' || status === 'failed') return 'rgba(244,67,54,0.12)';
  return 'rgba(175,137,86,0.12)';
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,251,224,0.06)' },
  crumb: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 3, color: colors.gold[400], textTransform: 'uppercase' as any },
  scroll: { paddingBottom: spacing.xxxl },

  heroBanner: {
    height: 240,
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
    position: 'relative' as any,
    overflow: 'hidden',
  },
  heroSeal: { position: 'absolute' as any, top: 16, right: 16, width: 60, height: 60, opacity: 0.25 },
  heroContent: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: spacing.lg },
  avatarWrap: { position: 'relative' as any, marginBottom: spacing.sm },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,131,82,0.16)', borderColor: colors.gold[400], borderWidth: 2 },
  avatarImg: { width: 96, height: 96, borderRadius: 48, borderColor: colors.gold[400], borderWidth: 2 },
  cameraBadge: { position: 'absolute' as any, bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.gold[400], alignItems: 'center', justifyContent: 'center', borderColor: colors.burgundy[900], borderWidth: 2 },
  heroName: { fontFamily: fonts.headingItalic, fontSize: fontSize.xl, color: colors.cream[100] },
  email: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.sm, marginTop: 2 },

  sectionLabel: { fontFamily: fonts.supportMedium, fontSize: 10, color: colors.gold[400], letterSpacing: 3, textTransform: 'uppercase' as any, marginBottom: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.lg },

  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,251,224,0.05)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.2)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  subCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subTitle: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.cream[100] },
  subStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  subStatusDot: { width: 6, height: 6, borderRadius: 3 },
  subStatus: { fontFamily: fonts.support, fontSize: 11, color: colors.gold[400] },
  subDate: { fontFamily: fonts.support, fontSize: 11, color: colors.cream[200], opacity: 0.6 },
  subArrow: { padding: 4 },

  emptyHistoryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, padding: spacing.md, backgroundColor: 'rgba(255,251,224,0.04)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,251,224,0.08)' },
  emptyHistoryText: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.sm, opacity: 0.7 },

  historyCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,251,224,0.04)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.15)',
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,251,224,0.06)',
    gap: spacing.sm,
  },
  historyTitle: { fontFamily: fonts.bodyMedium, color: colors.cream[100], fontSize: fontSize.sm },
  historyMeta: { fontFamily: fonts.support, color: colors.cream[200], fontSize: 11, marginTop: 2 },
  historyAmount: { fontFamily: fonts.bodySemibold, color: colors.gold[400], fontSize: fontSize.sm },
  txStatusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  txStatusText: { fontFamily: fonts.supportMedium, fontSize: 10, textTransform: 'capitalize' as any },

  label: { fontFamily: fonts.supportMedium, fontSize: 11, color: colors.cream[200], letterSpacing: 0.5, marginBottom: 6, marginTop: spacing.md, paddingHorizontal: spacing.lg, opacity: 0.7 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, marginHorizontal: spacing.lg },
  input: { flex: 1, fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.base, paddingVertical: 14 },
  tzRow: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 6, paddingHorizontal: spacing.lg },
  tzPill: { paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: radius.pill, borderColor: colors.burgundy[700], borderWidth: 1 },
  tzPillActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  tzText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.cream[200] },
  tzTextActive: { color: colors.burgundy[900] },

  prefsCard: { marginHorizontal: spacing.lg, backgroundColor: 'rgba(255,251,224,0.04)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(175,137,86,0.15)', paddingHorizontal: spacing.md },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,251,224,0.07)' },
  prefLabel: { fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.sm },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.gold[400], borderRadius: radius.pill, paddingVertical: 14, marginTop: spacing.lg, marginHorizontal: spacing.lg },
  ctaText: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, letterSpacing: 0.5 },
  saved: { textAlign: 'center' as any, fontFamily: fonts.support, color: colors.cream[200], fontSize: 11, marginTop: spacing.sm },
  error: { fontFamily: fonts.body, color: colors.state.error, fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: 'center' as any, paddingHorizontal: spacing.lg },

  rolesCard: { marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.md, borderColor: colors.burgundy[700], borderWidth: 1, backgroundColor: 'rgba(255,251,224,0.04)', marginHorizontal: spacing.lg },
  rolesText: { fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.sm, paddingHorizontal: 0 },
  linkRow: { marginTop: spacing.md, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.burgundy[700], alignItems: 'center' },
  linkText: { fontFamily: fonts.bodySemibold, color: colors.gold[400], fontSize: fontSize.sm, letterSpacing: 1, textTransform: 'uppercase' as any },

  legalCard: { marginHorizontal: spacing.lg, backgroundColor: 'rgba(255,251,224,0.04)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,251,224,0.08)', paddingHorizontal: spacing.md },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,251,224,0.07)' },
  legalText: { flex: 1, fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.sm },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.burgundy[700], marginHorizontal: spacing.lg },
  signOutText: { fontFamily: fonts.bodyMedium, color: colors.cream[200], fontSize: fontSize.sm, letterSpacing: 1, textTransform: 'uppercase' as any },
});
