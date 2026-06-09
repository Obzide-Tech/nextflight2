import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ActivityIndicator, Share, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Copy, ArrowUpRight, Wallet, TrendingUp, Users, Sparkles } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isRewardfulEnabled, fetchRewardfulAffiliate, fetchRewardfulCommissions } from '@/lib/rewardful';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const APP_BASE_URL =
  process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://nextflight.app';

function buildReferralLink(code: string) {
  return `${APP_BASE_URL}/r/${code}`;
}

export default function Copilotos() {
  const router = useRouter();
  const { user, roles } = useAuth();
  const isAffiliate = roles.includes('affiliate');
  const [dataSource, setDataSource] = useState<'builtin' | 'rewardful'>('builtin');
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [link, setLink] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [wallet, setWallet] = useState<{ pending: number; available: number; retained: number; paid: number }>({ pending: 0, available: 0, retained: 0, paid: 0 });
  const [referralsCount, setReferralsCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!user || !isAffiliate) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const useRewardful = await isRewardfulEnabled();
        setDataSource(useRewardful ? 'rewardful' : 'builtin');

        if (useRewardful) {
          const { data: afProfile } = await supabase
            .from('affiliate_profiles')
            .select('rewardful_affiliate_id')
            .eq('id', user.id)
            .maybeSingle();
          const rwId = afProfile?.rewardful_affiliate_id;
          if (rwId) {
            const [afRes, comRes] = await Promise.all([
              fetchRewardfulAffiliate(rwId),
              fetchRewardfulCommissions(rwId),
            ]);
            if (afRes.ok && afRes.data) {
              // unpaid_earnings = total not yet paid; paid_earnings = already paid out
              // pending = commissions not yet approved; available = approved but not paid
              const unpaid = Number(afRes.data.unpaid_earnings ?? 0) / 100;
              const paid = Number(afRes.data.paid_earnings ?? 0) / 100;
              const pendingCommissions = (comRes.ok && Array.isArray(comRes.data))
                ? comRes.data.filter((c: any) => c.state === 'pending').reduce((s: number, c: any) => s + Number(c.amount ?? 0) / 100, 0)
                : 0;
              setWallet({
                pending: pendingCommissions,
                available: Math.max(0, unpaid - pendingCommissions),
                retained: 0,
                paid,
              });
              setReferralsCount(afRes.data.visitors ?? 0);
              setSalesCount(afRes.data.conversions ?? 0);
            }
          }
          const { data: links } = await supabase.from('affiliate_links').select('code').eq('affiliate_user_id', user.id).eq('is_active', true).limit(1);
          const c = links?.[0]?.code ?? null;
          setCode(c);
          setLink(c ? buildReferralLink(c) : null);
          setLoading(false);
          return;
        }

        const [{ data: links }, { data: balance }, { count: refs }, { count: sales }] = await Promise.all([
          supabase.from('affiliate_links').select('code').eq('affiliate_user_id', user.id).eq('is_active', true).limit(1),
          supabase.from('wallet_balances').select('*').eq('affiliate_user_id', user.id).maybeSingle(),
          supabase.from('referral_attributions').select('id', { count: 'exact', head: true }).eq('affiliate_user_id', user.id),
          supabase.from('payment_transactions').select('id', { count: 'exact', head: true }).eq('affiliate_user_id', user.id).eq('status', 'confirmed'),
        ]);

        const c = links?.[0]?.code ?? null;
        setCode(c);
        setLink(c ? buildReferralLink(c) : null);
        setWallet({
          pending: Number(balance?.pending_usd ?? 0),
          available: Number(balance?.available_usd ?? 0),
          retained: Number(balance?.retained_usd ?? 0),
          paid: Number(balance?.paid_usd ?? 0),
        });
        setReferralsCount(refs ?? 0);
        setSalesCount(sales ?? 0);
      } catch {
        setLoadError(true);
      }
      setLoading(false);
    })();
  }, [user?.id, isAffiliate, retryCount]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const onCopy = async () => {
    if (!link) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link).catch(() => {});
    } else {
      await Share.share({ message: link });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onCopyCode = async () => {
    if (!code) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(code).catch(() => {});
    } else {
      await Share.share({ message: code });
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const onShare = async () => {
    if (!link || Platform.OS === 'web') {
      await onCopy();
      return;
    }
    await Share.share({ message: `Únete a NextFlight Academy con mi enlace: ${link}` });
  };

  if (!isAffiliate) {
    return (
      <ScreenContainer subtitle="Sección de Copilotos" title="Tu cabina de afiliada" scrollRef={scrollRef}>
        <View style={styles.activateCard}>
          <View style={styles.activateIcon}><Sparkles size={22} color={colors.gold[400]} strokeWidth={1.5} /></View>
          <Text style={styles.activateTitle}>Aún no eres Copiloto</Text>
          <Text style={styles.activateBody}>
            Activa tu cabina para generar tu enlace personal, recibir comisiones del 90% y solicitar retiros en USD.
          </Text>
          <TouchableOpacity style={styles.activateCta} onPress={() => router.push('/(app)/affiliate-activate')}>
            <Text style={styles.activateCtaText}>Activar mi cabina</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer subtitle="Sección de Copilotos" title="Tu cabina de afiliada" scrollRef={scrollRef}>
        <ActivityIndicator color={colors.gold[400]} />
      </ScreenContainer>
    );
  }

  if (loadError) {
    return (
      <ScreenContainer subtitle="Sección de Copilotos" title="Tu cabina de afiliada" scrollRef={scrollRef}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>No se pudo cargar tu cabina</Text>
          <Text style={styles.errorBody}>Verifica tu conexión e intenta de nuevo.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoadError(false); setLoading(true); setRetryCount((c) => c + 1); }}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const conversion = referralsCount > 0 ? Math.round((salesCount / referralsCount) * 100) : 0;
  const canPayout = wallet.available >= 50;

  return (
    <ScreenContainer subtitle="Sección de Copilotos" title="Tu cabina de afiliada" scrollRef={scrollRef}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo disponible</Text>
        <Text style={styles.balanceAmount}>$ {wallet.available.toFixed(2)} <Text style={styles.balanceCcy}>USD</Text></Text>
        <View style={styles.balanceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Pendiente</Text>
            <Text style={styles.miniValue}>$ {wallet.pending.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Retenido</Text>
            <Text style={styles.miniValue}>$ {wallet.retained.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Pagado</Text>
            <Text style={styles.miniValue}>$ {wallet.paid.toFixed(2)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.payoutCta, !canPayout && { opacity: 0.5 }]}
          disabled={!canPayout}
          onPress={() => router.push('/(app)/payout-request')}
        >
          <Wallet size={16} color={colors.burgundy[900]} strokeWidth={1.6} />
          <Text style={styles.payoutText}>{canPayout ? 'Solicitar retiro' : 'Mínimo $50 USD'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Tu enlace personal</Text>
      <View style={styles.linkBox}>
        <Text style={styles.link} numberOfLines={1}>{link ?? '—'}</Text>
        <Pressable style={styles.copyBtn} onPress={onCopy}>
          <Copy size={16} color={colors.gold[500]} strokeWidth={1.6} />
        </Pressable>
      </View>
      <View style={styles.linkActions}>
        <TouchableOpacity style={styles.linkAction} onPress={onShare}>
          <Text style={styles.linkActionText}>
            {copied ? 'Copiado' : Platform.OS === 'web' ? 'Copiar enlace' : 'Compartir enlace'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.codePill} onPress={onCopyCode} activeOpacity={0.75}>
          <Text style={styles.codePillLabel}>{codeCopied ? 'Copiado' : 'Código'}</Text>
          <Text style={styles.codePillCode}>{code}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Tu vuelo en números</Text>
      <View style={styles.statsGrid}>
        <Stat icon={<Users size={18} color={colors.gold[500]} />} label="Referidos" value={String(referralsCount)} />
        <Stat icon={<TrendingUp size={18} color={colors.gold[500]} />} label="Conversión" value={`${conversion}%`} />
        <Stat icon={<ArrowUpRight size={18} color={colors.gold[500]} />} label="Ventas" value={String(salesCount)} />
      </View>

      <TouchableOpacity style={styles.networkCta} onPress={() => router.push('/(app)/network')} activeOpacity={0.85}>
        <View style={{ flex: 1 }}>
          <Text style={styles.networkTitle}>Ver mi red completa</Text>
          <Text style={styles.networkSub}>Pasajeras referidas, conversiones y comisiones por vuelo.</Text>
        </View>
        <ArrowUpRight size={18} color={colors.gold[400]} strokeWidth={1.6} />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

function Stat({ icon, label, value }: any) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activateCard: { backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.gold[600], borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  activateIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,131,82,0.16)' },
  activateTitle: { fontFamily: fonts.headingItalic, fontSize: fontSize.xl, color: colors.cream[100], marginTop: spacing.xs },
  activateBody: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], textAlign: 'center', lineHeight: 22 },
  activateCta: { backgroundColor: colors.gold[400], paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: radius.pill, marginTop: spacing.sm },
  activateCtaText: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, letterSpacing: 0.5 },
  balanceCard: { backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.gold[600], borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  balanceLabel: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 2, color: colors.gold[400], textTransform: 'uppercase' },
  balanceAmount: { fontFamily: fonts.headingItalic, fontSize: fontSize.display, color: colors.cream[100], marginTop: 4 },
  balanceCcy: { fontFamily: fonts.support, fontSize: fontSize.md, color: colors.cream[200] },
  balanceRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  miniLabel: { fontFamily: fonts.support, fontSize: 11, color: colors.cream[200], textTransform: 'uppercase', letterSpacing: 1 },
  miniValue: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.cream[100], marginTop: 2 },
  payoutCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gold[400], paddingVertical: 14, borderRadius: radius.pill, justifyContent: 'center', marginTop: spacing.lg },
  payoutText: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, letterSpacing: 0.5 },
  section: { fontFamily: fonts.headingItalic, fontSize: fontSize.lg, color: colors.cream[100], marginBottom: spacing.sm, marginTop: spacing.sm },
  linkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  link: { flex: 1, fontFamily: fonts.support, fontSize: fontSize.sm, color: colors.cream[100], letterSpacing: 0.5 },
  copyBtn: { padding: spacing.xs },
  linkActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
  linkAction: { flex: 1, backgroundColor: colors.burgundy[700], paddingVertical: 12, borderRadius: radius.pill, alignItems: 'center' },
  linkActionText: { fontFamily: fonts.bodySemibold, color: colors.gold[400], fontSize: fontSize.sm, letterSpacing: 1, textTransform: 'uppercase' },
  codePill: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderColor: colors.gold[600], borderWidth: 1 },
  codePillLabel: { fontFamily: fonts.support, fontSize: 9, letterSpacing: 2, color: colors.gold[400], textTransform: 'uppercase' },
  codePillCode: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.cream[100] },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  stat: { flex: 1, backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, padding: spacing.md, alignItems: 'flex-start' },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,131,82,0.12)', marginBottom: spacing.sm },
  statValue: { fontFamily: fonts.bodySemibold, fontSize: fontSize.md, color: colors.cream[100] },
  statLabel: { fontFamily: fonts.support, fontSize: 11, color: colors.cream[200], marginTop: 2, letterSpacing: 1 },
  networkCta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderColor: colors.gold[600], borderWidth: 1, backgroundColor: 'rgba(167,131,82,0.08)' },
  networkTitle: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  networkSub: { fontFamily: fonts.body, color: colors.cream[200], fontSize: 11, marginTop: 2, lineHeight: 16 },
  errorCard: { backgroundColor: 'rgba(244,67,54,0.08)', borderColor: 'rgba(244,67,54,0.3)', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  errorTitle: { fontFamily: fonts.bodySemibold, fontSize: fontSize.base, color: colors.cream[100] },
  errorBody: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], textAlign: 'center' },
  retryBtn: { marginTop: spacing.xs, backgroundColor: colors.burgundy[700], paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill },
  retryText: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.gold[400], letterSpacing: 0.5 },
});
