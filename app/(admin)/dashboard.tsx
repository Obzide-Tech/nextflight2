import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable,
  useWindowDimensions, Platform,
} from 'react-native';
import { StatusPill } from '@/components/admin/StatusPill';
import {
  fetchDashboardKpis, fetchPlatformBreakdown,
  DashboardKpis, PlatformBreakdown, fetchPayouts, PayoutRow,
  generatePremiumPaymentLink,
} from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { TrendingUp, Users, Wallet, Star, Link2, TriangleAlert } from 'lucide-react-native';

function formatUsd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const KPI_META = [
  { icon: TrendingUp, accent: colors.gold[500], label: 'Ingresos 30d (gross)' },
  { icon: Users, accent: '#3A7A5C', label: 'Alumnas activas' },
  { icon: Wallet, accent: colors.burgundy[600], label: 'Payouts pendientes' },
  { icon: Star, accent: '#3A547A', label: 'Afiliadas activas' },
];

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [platforms, setPlatforms] = useState<PlatformBreakdown[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [linkLoading, setLinkLoading] = useState(false);
  const [linkResult, setLinkResult] = useState<{ url: string | null; error: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const [k, p, pq] = await Promise.all([fetchDashboardKpis(), fetchPlatformBreakdown(), fetchPayouts()]);
      setKpis(k);
      setPlatforms(p);
      setRecentPayouts(pq.slice(0, 6));
      setLoading(false);
    })();
  }, []);

  const onGenerateLink = async () => {
    setLinkLoading(true);
    setLinkResult(null);
    const r = await generatePremiumPaymentLink();
    setLinkResult(r);
    setLinkLoading(false);

    if (r.url && Platform.OS === 'web') {
      try { await (navigator as any).clipboard?.writeText(r.url); } catch {}
    }
  };

  if (loading || !kpis) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.gold[500]} size="large" />
      </View>
    );
  }

  const cards = [
    { ...KPI_META[0], value: formatUsd(kpis.grossLast30Usd), sub: `Net ${formatUsd(kpis.netLast30Usd)}` },
    { ...KPI_META[1], value: String(kpis.activeSubs), sub: `+${kpis.newSubsLast30} nuevas · ${kpis.cancelledLast30} bajas` },
    { ...KPI_META[2], value: formatUsd(kpis.pendingPayoutsUsd), sub: `${kpis.pendingPayoutsCount} solicitudes pendientes` },
    { ...KPI_META[3], value: String(kpis.affiliatesActive), sub: `${kpis.studentsTotal} estudiantes totales` },
  ];

  const totalGross = platforms.reduce((s, p) => s + p.gross, 0) || 1;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
    >
      {/* Hero header */}
      <View style={[styles.hero, isMobile && styles.heroMobile]}>
        <View>
          <Text style={styles.heroEyebrow}>Cabina de mando</Text>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>Vista financiera</Text>
          <Text style={styles.heroSub}>Resumen consolidado · últimos 30 días</Text>
        </View>
        <View style={styles.heroDot} />
      </View>

      {/* KPI stat cards */}
      {isMobile ? (
        <>
          <View style={styles.kpiRowMobile}>
            {cards.slice(0, 2).map((c) => {
              const Icon = c.icon;
              return (
                <View key={c.label} style={styles.kpiCardMobile}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: c.accent + '1A' }]}>
                    <Icon size={16} color={c.accent} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.kpiLabelMobile} numberOfLines={2}>{c.label}</Text>
                  <Text style={styles.kpiValueMobile} numberOfLines={1} adjustsFontSizeToFit>{c.value}</Text>
                  <Text style={styles.kpiSub} numberOfLines={2}>{c.sub}</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.kpiRowMobile, { marginTop: 8 }]}>
            {cards.slice(2, 4).map((c) => {
              const Icon = c.icon;
              return (
                <View key={c.label} style={styles.kpiCardMobile}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: c.accent + '1A' }]}>
                    <Icon size={16} color={c.accent} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.kpiLabelMobile} numberOfLines={2}>{c.label}</Text>
                  <Text style={styles.kpiValueMobile} numberOfLines={1} adjustsFontSizeToFit>{c.value}</Text>
                  <Text style={styles.kpiSub} numberOfLines={2}>{c.sub}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.kpiRow}>
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <View key={c.label} style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: c.accent + '1A' }]}>
                  <Icon size={18} color={c.accent} strokeWidth={1.8} />
                </View>
                <Text style={styles.kpiLabel} numberOfLines={2}>{c.label}</Text>
                <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{c.value}</Text>
                <Text style={styles.kpiSub} numberOfLines={2}>{c.sub}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Main panels */}
      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {/* Platform breakdown */}
        <View style={[styles.panel, isMobile && styles.panelMobile]}>
          <Text style={styles.panelEyebrow}>Desglose</Text>
          <Text style={styles.panelTitle}>Reparto por plataforma</Text>
          <Text style={styles.panelSub}>Últimos 30 días · transacciones confirmadas</Text>
          <View style={styles.divider} />
          {platforms.length === 0 ? (
            <Text style={styles.empty}>Sin transacciones en el periodo.</Text>
          ) : (
            <View style={{ gap: spacing.lg }}>
              {platforms.map((p) => {
                const pct = (p.gross / totalGross) * 100;
                return (
                  <View key={p.platform}>
                    <View style={styles.platRow}>
                      <Text style={styles.platLabel}>{p.platform}</Text>
                      <View style={styles.platRight}>
                        <Text style={styles.platPct}>{pct.toFixed(0)}%</Text>
                        <Text style={styles.platValue}>{formatUsd(p.gross)}</Text>
                      </View>
                    </View>
                    <View style={styles.platTrack}>
                      <View style={[styles.platFill, { width: `${pct}%` as any }]} />
                    </View>
                    <Text style={styles.platMeta}>{p.count} transacciones</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent payouts */}
        <View style={[styles.panel, isMobile && styles.panelMobile]}>
          <Text style={styles.panelEyebrow}>Cola reciente</Text>
          <Text style={styles.panelTitle}>Últimos retiros</Text>
          <Text style={styles.panelSub}>6 solicitudes más recientes</Text>
          <View style={styles.divider} />
          {recentPayouts.length === 0 ? (
            <Text style={styles.empty}>Sin solicitudes recientes.</Text>
          ) : (
            <View style={{ gap: 2 }}>
              {recentPayouts.map((p) => (
                <View key={p.id} style={styles.payRow}>
                  <View style={styles.payAvatar}>
                    <Text style={styles.payAvatarTxt}>{(p.affiliate_name ?? '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.payName} numberOfLines={1}>{p.affiliate_name}</Text>
                    <Text style={styles.payDate}>{new Date(p.requested_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.payAmount}>{formatUsd(Number(p.amount_usd))}</Text>
                  <StatusPill value={p.status} />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* TEMPORARY: Generate Stripe Payment Link for Premium Program */}
      <View style={[styles.tempSection, isMobile && styles.tempSectionMobile]}>
        <View style={styles.tempHeader}>
          <TriangleAlert size={14} color={colors.gold[600]} strokeWidth={1.8} />
          <Text style={styles.tempEyebrow}>TEMPORAL — borrar después de usar</Text>
        </View>
        <Text style={styles.tempTitle}>Generar Payment Link Premium</Text>
        <Text style={styles.tempDesc}>
          Crea el Stripe Payment Link para el programa premium y lo guarda en la base de datos.
          Solo necesitas hacer esto una vez.
        </Text>

        {linkResult?.url ? (
          <View style={styles.linkSuccess}>
            <Text style={styles.linkSuccessLabel}>
              Payment Link generado{Platform.OS === 'web' ? ' (copiado al portapapeles)' : ''}:
            </Text>
            <Text style={styles.linkUrl} selectable>{linkResult.url}</Text>
          </View>
        ) : linkResult?.error ? (
          <View style={styles.linkError}>
            <Text style={styles.linkErrorTxt}>Error: {linkResult.error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onGenerateLink}
          disabled={linkLoading || !!linkResult?.url}
          style={[styles.linkBtn, (linkLoading || !!linkResult?.url) && styles.linkBtnDone]}
        >
          {linkLoading ? (
            <ActivityIndicator size="small" color={colors.cream[100]} />
          ) : (
            <>
              <Link2 size={15} color={colors.cream[100]} strokeWidth={2} />
              <Text style={styles.linkBtnTxt}>
                {linkResult?.url ? 'Link generado correctamente' : 'Generar Payment Link Premium'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: colors.cream[50], minWidth: 0 },
  container: { paddingBottom: 48, maxWidth: 1280, width: '100%', alignSelf: 'center' },
  containerMobile: { paddingBottom: 32 },

  hero: {
    backgroundColor: colors.burgundy[900],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroMobile: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  heroEyebrow: {
    fontFamily: fonts.support,
    color: colors.gold[400],
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase' as any,
  },
  heroTitle: {
    fontFamily: fonts.headingBold,
    color: colors.cream[100],
    fontSize: 32,
    marginTop: 6,
  },
  heroTitleMobile: { fontSize: 22 },
  heroSub: {
    fontFamily: fonts.body,
    color: 'rgba(241,238,219,0.55)',
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  heroDot: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(175,137,86,0.08)',
    position: 'absolute',
    right: -40,
    bottom: -60,
  },

  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: 0,
  },
  kpiRowMobile: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: colors.surface.raised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.soft,
    padding: spacing.lg,
    gap: 4,
    overflow: 'hidden',
  },
  kpiCardMobile: {
    flex: 1,
    backgroundColor: colors.surface.raised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.soft,
    padding: spacing.md,
    gap: 4,
    overflow: 'hidden',
    minWidth: 0,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontFamily: fonts.support,
    color: colors.ink[500],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as any,
    minWidth: 0,
  },
  kpiLabelMobile: {
    fontFamily: fonts.support,
    color: colors.ink[500],
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase' as any,
    minWidth: 0,
  },
  kpiValue: {
    fontFamily: fonts.headingBold,
    color: colors.burgundy[900],
    fontSize: 26,
    marginTop: 4,
    lineHeight: 30,
    minWidth: 0,
  },
  kpiValueMobile: {
    fontFamily: fonts.headingBold,
    color: colors.burgundy[900],
    fontSize: 18,
    marginTop: 4,
    lineHeight: 22,
    minWidth: 0,
  },
  kpiSub: {
    fontFamily: fonts.body,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    minWidth: 0,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as any,
    gap: spacing.md,
    padding: spacing.xl,
  },
  gridMobile: {
    padding: spacing.md,
    flexDirection: 'column',
  },
  panel: {
    flex: 1,
    minWidth: 280,
    backgroundColor: colors.surface.raised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.soft,
    padding: spacing.lg,
  },
  panelMobile: {
    flex: 0,
    minWidth: 0,
    width: '100%',
  },
  panelEyebrow: {
    fontFamily: fonts.support,
    color: colors.gold[600],
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase' as any,
  },
  panelTitle: {
    fontFamily: fonts.headingBold,
    color: colors.burgundy[900],
    fontSize: fontSize.lg,
    marginTop: 4,
  },
  panelSub: {
    fontFamily: fonts.body,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.soft,
    marginVertical: spacing.md,
  },
  empty: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm },

  platRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  platLabel: {
    fontFamily: fonts.bodySemibold,
    color: colors.burgundy[900],
    fontSize: fontSize.sm,
    textTransform: 'capitalize' as any,
    flex: 1,
  },
  platRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  platPct: { fontFamily: fonts.support, color: colors.ink[500], fontSize: fontSize.xs },
  platValue: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, minWidth: 70, textAlign: 'right' as any },
  platTrack: { height: 6, borderRadius: 3, backgroundColor: colors.cream[200], overflow: 'hidden' },
  platFill: { height: 6, borderRadius: 3, backgroundColor: colors.gold[500] },
  platMeta: { fontFamily: fonts.support, color: colors.ink[500], fontSize: fontSize.xs, marginTop: 4 },

  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  payAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.burgundy[900],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  payAvatarTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: 13 },
  payName: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm },
  payDate: { fontFamily: fonts.support, color: colors.ink[500], fontSize: fontSize.xs },
  payAmount: {
    fontFamily: fonts.bodySemibold,
    color: colors.burgundy[900],
    fontSize: fontSize.base,
    minWidth: 72,
    textAlign: 'right' as any,
    flexShrink: 0,
  },

  tempSection: {
    margin: spacing.xl,
    marginTop: 0,
    padding: spacing.lg,
    backgroundColor: '#FFFBF0',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.gold[400],
    gap: spacing.sm,
  },
  tempSectionMobile: {
    margin: spacing.md,
    marginTop: 0,
  },
  tempHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tempEyebrow: {
    fontFamily: fonts.support,
    color: colors.gold[600],
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as any,
  },
  tempTitle: {
    fontFamily: fonts.headingBold,
    color: colors.burgundy[900],
    fontSize: fontSize.lg,
  },
  tempDesc: {
    fontFamily: fonts.body,
    color: colors.ink[700],
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  linkSuccess: {
    backgroundColor: '#E8F5EC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#9DC4A4',
    padding: spacing.md,
    gap: 4,
  },
  linkSuccessLabel: {
    fontFamily: fonts.bodySemibold,
    color: '#2F5E3D',
    fontSize: fontSize.xs,
  },
  linkUrl: {
    fontFamily: fonts.body,
    color: '#2F5E3D',
    fontSize: fontSize.xs,
    textDecorationLine: 'underline' as any,
  },
  linkError: {
    backgroundColor: '#FCE3E3',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D89A9A',
    padding: spacing.md,
  },
  linkErrorTxt: {
    fontFamily: fonts.bodyMedium,
    color: '#7A1A2C',
    fontSize: fontSize.sm,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold[600],
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  linkBtnDone: {
    backgroundColor: '#2C5E3C',
    opacity: 0.75,
  },
  linkBtnTxt: {
    fontFamily: fonts.bodySemibold,
    color: colors.cream[100],
    fontSize: fontSize.sm,
  },
});
