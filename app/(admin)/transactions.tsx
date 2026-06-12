import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { StatusPill } from '@/components/admin/StatusPill';
import { fetchTransactions } from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { ArrowDownLeft, ListFilter as Filter } from 'lucide-react-native';

const PLATFORMS = ['todas', 'apple', 'google', 'manual'] as const;
const STATUSES = ['todas', 'confirmed', 'pending', 'refunded', 'failed', 'expired'] as const;

const PLATFORM_COLOR: Record<string, string> = {
  apple: '#1B1B1B',
  google: '#1A73E8',
  manual: '#5A4631',
  todas: colors.burgundy[900],
};

export default function TransactionsAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('todas');
  const [status, setStatus] = useState<typeof STATUSES[number]>('todas');

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchTransactions({
      platform: platform === 'todas' ? undefined : platform,
      status: status === 'todas' ? undefined : status,
    });
    setRows(data);
    setLoading(false);
  }, [platform, status]);

  useEffect(() => { reload(); }, [reload]);

  const totalGross = rows.reduce((s, r) => s + Number(r.amount_usd || 0), 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headerIcon}>
          <ArrowDownLeft size={22} color={colors.gold[400]} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Trazabilidad</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Transacciones</Text>
          <Text style={styles.subtitle}>Apple StoreKit · Google Play Billing · Manual</Text>
        </View>
      </View>

      {/* Summary strip */}
      {!loading && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryCard}>
            <Filter size={16} color={colors.gold[400]} strokeWidth={1.8} />
            <View>
              <Text style={styles.summaryLabel}>Bruto filtrado</Text>
              <Text style={styles.summaryValue}>
                ${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>Registros</Text>
              <Text style={[styles.summaryValue, { color: colors.gold[300] }]}>{rows.length}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={[styles.filtersBar, isMobile && styles.filtersBarMobile]}>
        <View style={styles.filterRow}>
          <View style={styles.filterIcon}>
            <Filter size={14} color={colors.ink[500]} strokeWidth={1.8} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterSection}>
            {PLATFORMS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPlatform(p)}
                style={[
                  styles.chip,
                  platform === p && { backgroundColor: PLATFORM_COLOR[p], borderColor: PLATFORM_COLOR[p] },
                ]}
              >
                <Text style={[styles.chipTxt, platform === p && styles.chipTxtActive]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View style={styles.filterRow}>
          <View style={styles.filterIconSpacer} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterSection}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.chip, status === s && styles.chipActiveNeutral]}
              >
                <Text style={[styles.chipTxt, status === s && styles.chipTxtActiveNeutral]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Ledger */}
      <View style={[styles.ledger, isMobile && styles.ledgerMobile]}>
        {!isMobile && (
          <View style={styles.ledgerHead}>
            <Text style={[styles.th, { flex: 2.5 }]}>Programa</Text>
            <Text style={[styles.th, { flex: 1 }]}>Plataforma</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' as any }]}>Bruto</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' as any }]}>Neto</Text>
            <Text style={[styles.th, { flex: 1 }]}>Estado</Text>
            <Text style={[styles.th, { flex: 2 }]}>Ref / Fecha</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadWrap}>
            <ActivityIndicator color={colors.gold[500]} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ArrowDownLeft size={32} color={colors.ink[100]} strokeWidth={1.4} />
            <Text style={styles.emptyTxt}>Sin transacciones con este filtro.</Text>
          </View>
        ) : isMobile ? (
          rows.map((r, i) => (
            <View key={r.id} style={[styles.mobileRow, i % 2 === 1 && styles.ledgerRowAlt]}>
              <View style={styles.mobileRowTop}>
                <Text style={styles.programName} numberOfLines={1}>{r.products_programs?.title ?? '—'}</Text>
                <Text style={styles.amountPos}>${Number(r.amount_usd).toFixed(2)}</Text>
              </View>
              <View style={styles.mobileRowBottom}>
                <StatusPill value={r.platform} />
                <StatusPill value={r.status} />
                <Text style={styles.rowMeta}>{new Date(r.occurred_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        ) : (
          rows.map((r, i) => (
            <View key={r.id} style={[styles.ledgerRow, i % 2 === 1 && styles.ledgerRowAlt]}>
              <View style={{ flex: 2.5 }}>
                <Text style={styles.programName}>{r.products_programs?.title ?? '—'}</Text>
                <Text style={styles.rowMeta}>{r.id.slice(0, 8)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <StatusPill value={r.platform} />
              </View>
              <Text style={[styles.amountPos, { flex: 1, textAlign: 'right' as any }]}>
                ${Number(r.amount_usd).toFixed(2)}
              </Text>
              <Text style={[styles.amountNet, { flex: 1, textAlign: 'right' as any }]}>
                ${Number(r.net_amount_usd).toFixed(2)}
              </Text>
              <View style={{ flex: 1 }}>
                <StatusPill value={r.status} />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={styles.rowRef}>{r.external_ref || '—'}</Text>
                <Text style={styles.rowMeta}>{new Date(r.occurred_at).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50], minWidth: 0 },
  container: { paddingBottom: 48, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface.raised,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: spacing.md,
  },
  headerMobile: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.burgundy[900],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eyebrow: {
    fontFamily: fonts.support,
    color: colors.gold[600],
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase' as any,
  },
  title: {
    fontFamily: fonts.headingBold,
    color: colors.burgundy[900],
    fontSize: 26,
    marginTop: 2,
  },
  titleMobile: { fontSize: 20 },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.ink[500],
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.burgundy[900],
    gap: spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  summaryLabel: {
    fontFamily: fonts.support,
    color: 'rgba(241,238,219,0.55)',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase' as any,
  },
  summaryValue: {
    fontFamily: fonts.headingBold,
    color: colors.gold[300],
    fontSize: 20,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(175,137,86,0.2)',
  },

  filtersBar: {
    flexDirection: 'column',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  filtersBarMobile: { paddingHorizontal: spacing.md },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterIconSpacer: {
    width: 30,
    height: 30,
    flexShrink: 0,
  },
  filterSection: { flexDirection: 'row', gap: 6, paddingRight: spacing.md },
  filterDivider: { width: 1, height: 20, backgroundColor: colors.border.medium, marginHorizontal: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface.raised,
  },
  chipTxt: {
    fontFamily: fonts.bodyMedium,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    textTransform: 'capitalize' as any,
  },
  chipTxtActive: { color: '#fff' },
  chipActiveNeutral: { backgroundColor: colors.burgundy[900], borderColor: colors.burgundy[900] },
  chipTxtActiveNeutral: { color: colors.cream[100] },

  ledger: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    overflow: 'hidden',
    backgroundColor: colors.surface.raised,
  },
  ledgerMobile: { marginHorizontal: spacing.md },
  ledgerHead: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.cream[200],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
    gap: spacing.sm,
  },
  th: {
    fontFamily: fonts.support,
    color: colors.ink[500],
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as any,
  },
  loadWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyWrap: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm },

  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: spacing.sm,
  },
  ledgerRowAlt: { backgroundColor: colors.cream[50] },

  mobileRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: 6,
  },
  mobileRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mobileRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as any,
  },

  programName: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, flex: 1 },
  rowRef: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.xs },
  rowMeta: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11, marginTop: 2 },
  amountPos: { fontFamily: fonts.bodySemibold, color: colors.state.success, fontSize: fontSize.sm },
  amountNet: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm },
});
