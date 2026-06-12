import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  fetchDashboardKpis,
  DashboardKpis,
} from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { TrendingUp, Users, Wallet, Star } from 'lucide-react-native';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const k = await fetchDashboardKpis();
      setKpis(k);
      setLoading(false);
    })();
  }, []);

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
});
