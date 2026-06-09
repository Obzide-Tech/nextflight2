import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { fetchAuditLog } from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { Shield, ChevronDown, ChevronRight, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Zap } from 'lucide-react-native';

const ACTION_META: Record<string, { icon: any; color: string; label?: string }> = {
  approve_payout: { icon: CheckCircle, color: '#2C5E3C' },
  reject_payout: { icon: AlertTriangle, color: colors.state.error },
  mark_paid: { icon: CheckCircle, color: '#3A547A' },
  toggle_feature_flag: { icon: Zap, color: '#7A5A2A' },
  update_setting: { icon: Info, color: '#5A3E7A' },
};

function actionMeta(action: string) {
  const key = Object.keys(ACTION_META).find((k) => action.toLowerCase().includes(k)) ?? '';
  return ACTION_META[key] ?? { icon: Shield, color: colors.gold[500] };
}

function groupByDate(rows: any[]): { date: string; items: any[] }[] {
  const map = new Map<string, any[]>();
  for (const r of rows) {
    const d = new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(r);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function AuditAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetchAuditLog(150);
      setRows(r);
      setLoading(false);
    })();
  }, []);

  const groups = groupByDate(rows);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>Registro de seguridad</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Bitácora de auditoría</Text>
          <Text style={styles.subtitle}>Append-only · cada acción sensible queda registrada con actor y metadatos.</Text>
        </View>
        <View style={[styles.countBox, isMobile && styles.countBoxMobile]}>
          <Shield size={18} color={colors.gold[400]} strokeWidth={1.6} />
          <Text style={styles.countNum}>{loading ? '—' : rows.length}</Text>
          <Text style={styles.countLabel}>registros</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator color={colors.gold[500]} size="large" />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Shield size={40} color={colors.ink[100]} strokeWidth={1.4} />
          <Text style={styles.emptyTxt}>Sin movimientos administrativos por ahora.</Text>
        </View>
      ) : (
        <View style={[styles.timeline, isMobile && styles.timelineMobile]}>
          {groups.map(({ date, items }) => (
            <View key={date}>
              <View style={styles.dateSep}>
                <View style={styles.dateLine} />
                <Text style={styles.dateLabel}>{date}</Text>
                <View style={styles.dateLine} />
              </View>
              {items.map((r: any) => {
                const meta = actionMeta(r.action);
                const Icon = meta.icon;
                const isExpanded = expanded === r.id;
                const hasPayload = r.metadata && Object.keys(r.metadata).length > 0;

                return (
                  <View key={r.id} style={styles.entry}>
                    <View style={styles.entryLeft}>
                      <View style={[styles.entryDot, { backgroundColor: meta.color + '20', borderColor: meta.color + '50' }]}>
                        <Icon size={12} color={meta.color} strokeWidth={2} />
                      </View>
                      <View style={styles.entryConnector} />
                    </View>
                    <View style={styles.entryContent}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryAction}>{r.action}</Text>
                        <Text style={styles.entryTime}>
                          {new Date(r.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.entryMeta}>
                        <Text style={styles.entryActor}>{r.actor_name ?? 'system'}</Text>
                        {r.target_table ? ` · ${r.target_table}` : ''}
                        {r.target_id ? ` · ${String(r.target_id).slice(0, 8)}` : ''}
                      </Text>
                      {hasPayload ? (
                        <Pressable onPress={() => setExpanded(isExpanded ? null : r.id)} style={styles.payloadToggle}>
                          {isExpanded ? (
                            <ChevronDown size={12} color={colors.ink[500]} />
                          ) : (
                            <ChevronRight size={12} color={colors.ink[500]} />
                          )}
                          <Text style={styles.payloadToggleTxt}>
                            {isExpanded ? 'Ocultar metadatos' : 'Ver metadatos'}
                          </Text>
                        </Pressable>
                      ) : null}
                      {isExpanded && hasPayload ? (
                        <View style={styles.payload}>
                          <Text style={styles.payloadTxt}>{JSON.stringify(r.metadata, null, 2)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
  container: { paddingBottom: 48, maxWidth: 900, width: '100%', alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: '#12040A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(175,137,86,0.2)',
  },
  headerMobile: {
    flexDirection: 'column',
    padding: spacing.md,
    gap: spacing.md,
  },
  headerLeft: { flex: 1 },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[400], fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.cream[100], fontSize: 26, marginTop: 4 },
  titleMobile: { fontSize: 20 },
  subtitle: { fontFamily: fonts.body, color: 'rgba(241,238,219,0.5)', fontSize: fontSize.sm, marginTop: 4, maxWidth: 500 },
  countBox: {
    backgroundColor: 'rgba(175,137,86,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.25)',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  countBoxMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  countNum: { fontFamily: fonts.headingBold, color: colors.gold[300], fontSize: 26 },
  countLabel: { fontFamily: fonts.support, color: colors.gold[500], fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as any },

  loadWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyWrap: { paddingVertical: 60, alignItems: 'center', gap: spacing.sm },
  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500] },

  timeline: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  timelineMobile: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: colors.border.soft },
  dateLabel: {
    fontFamily: fonts.support,
    color: colors.ink[500],
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as any,
  },

  entry: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 4,
  },
  entryLeft: {
    width: 44,
    alignItems: 'center',
  },
  entryDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  entryConnector: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border.soft,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
    paddingTop: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  entryAction: {
    fontFamily: fonts.bodySemibold,
    color: colors.burgundy[900],
    fontSize: fontSize.sm,
    flex: 1,
  },
  entryTime: {
    fontFamily: fonts.support,
    color: colors.ink[500],
    fontSize: 11,
  },
  entryMeta: {
    fontFamily: fonts.body,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  entryActor: { fontFamily: fonts.bodySemibold, color: colors.ink[700] },

  payloadToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  payloadToggleTxt: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11 },

  payload: {
    backgroundColor: '#F4F1E4',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  payloadTxt: {
    fontFamily: fonts.support,
    fontSize: 11,
    color: colors.ink[700],
    lineHeight: 17,
  },
});
