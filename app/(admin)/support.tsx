import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Linking } from 'react-native';
import { StatusPill } from '@/components/admin/StatusPill';
import { fetchSupportTickets } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { LifeBuoy, ExternalLink, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  high: { color: '#7A1A2C', bg: '#FCE3E3' },
  medium: { color: '#7A5A14', bg: '#FFF4D6' },
  low: { color: '#2C5E3C', bg: '#E6F1E8' },
};

const STATUS_ICON: Record<string, any> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
};

export default function SupportAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kartraEnabled, setKartraEnabled] = useState(false);
  const [kartraUrl, setKartraUrl] = useState('');

  useEffect(() => {
    (async () => {
      const [r, kartraFlag, kartraUrlSetting] = await Promise.all([
        fetchSupportTickets(),
        supabase.from('feature_flags').select('enabled').eq('key', 'kartra_helpdesk_enabled').maybeSingle(),
        supabase.from('system_settings').select('value').eq('key', 'kartra_helpdesk_url').maybeSingle(),
      ]);
      setRows(r);
      setKartraEnabled(kartraFlag.data?.enabled === true);
      const rawUrl = kartraUrlSetting.data?.value;
      let url = '';
      if (rawUrl) {
        try { url = JSON.parse(rawUrl); } catch { url = rawUrl; }
      }
      setKartraUrl(url);
      setLoading(false);
    })();
  }, []);

  const open = rows.filter((r) => r.status === 'open' || r.status === 'in_progress').length;
  const resolved = rows.filter((r) => r.status === 'resolved' || r.status === 'closed').length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={[styles.headerLeft, isMobile && styles.headerLeftMobile]}>
          <Text style={styles.eyebrow}>Atención al cliente</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Tickets de soporte</Text>
          <Text style={styles.subtitle}>Lista de solicitudes registradas y su estado actual.</Text>
        </View>
        <View style={[styles.statRow, isMobile && styles.statRowMobile]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{loading ? '—' : open}</Text>
            <Text style={styles.statLabel}>Abiertos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#2C5E3C' }]}>{loading ? '—' : resolved}</Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>
        </View>
      </View>

      {/* Kartra integration banner */}
      {kartraEnabled && kartraUrl ? (
        <View style={[styles.kartraBanner, isMobile && styles.kartraBannerMobile]}>
          <LifeBuoy size={18} color='#3A547A' strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.kartraTitle}>Kartra Helpdesk activo</Text>
            <Text style={styles.kartraSub}>Los tickets de soporte se gestionan desde el panel de Kartra.</Text>
          </View>
          <TouchableOpacity onPress={() => { if (kartraUrl) Linking.openURL(kartraUrl); }} style={styles.kartraBtn}>
            <ExternalLink size={13} color="#fff" strokeWidth={2} />
            <Text style={styles.kartraBtnTxt}>Abrir Kartra</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Table */}
      <View style={[styles.tableWrap, isMobile && styles.tableWrapMobile]}>
        {!isMobile && (
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 3 }]}>Asunto</Text>
            <Text style={[styles.th, { flex: 2 }]}>Usuaria</Text>
            <Text style={[styles.th, { flex: 1 }]}>Prioridad</Text>
            <Text style={[styles.th, { flex: 1 }]}>Estado</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'right' as any }]}>Creado</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadWrap}>
            <ActivityIndicator color={colors.gold[500]} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <LifeBuoy size={36} color={colors.ink[100]} strokeWidth={1.4} />
            <Text style={styles.emptyTxt}>No hay tickets registrados.</Text>
          </View>
        ) : isMobile ? (
          rows.map((t: any, i) => {
            const priMeta = PRIORITY_META[t.priority] ?? PRIORITY_META.low;
            const StatusIcon = STATUS_ICON[t.status] ?? AlertCircle;
            return (
              <View key={t.id} style={[styles.mobileRow, i % 2 === 1 && styles.rowAlt]}>
                <View style={styles.mobileRowTop}>
                  <Text style={styles.subject} numberOfLines={1}>{t.subject}</Text>
                  <View style={[styles.priTag, { backgroundColor: priMeta.bg }]}>
                    <Text style={[styles.priTxt, { color: priMeta.color }]}>{t.priority}</Text>
                  </View>
                </View>
                <View style={styles.mobileRowBottom}>
                  <Text style={styles.mobileUser} numberOfLines={1}>{t.user_name}</Text>
                  <StatusPill value={t.status} />
                  <Text style={styles.dateCell}>
                    {new Date(t.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          rows.map((t: any, i) => {
            const priMeta = PRIORITY_META[t.priority] ?? PRIORITY_META.low;
            const StatusIcon = STATUS_ICON[t.status] ?? AlertCircle;
            return (
              <View key={t.id} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.subject} numberOfLines={1}>{t.subject}</Text>
                  <Text style={styles.rowMeta}>{t.id.slice(0, 8)}</Text>
                </View>
                <Text style={[styles.cellTxt, { flex: 2 }]} numberOfLines={1}>{t.user_name}</Text>
                <View style={{ flex: 1 }}>
                  <View style={[styles.priTag, { backgroundColor: priMeta.bg }]}>
                    <Text style={[styles.priTxt, { color: priMeta.color }]}>{t.priority}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <StatusPill value={t.status} />
                </View>
                <Text style={[styles.dateCell, { flex: 1.2 }]}>
                  {new Date(t.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            );
          })
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
    justifyContent: 'space-between',
    padding: spacing.xl,
    backgroundColor: colors.surface.raised,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: spacing.md,
    flexWrap: 'wrap' as any,
  },
  headerMobile: {
    flexDirection: 'column',
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, minWidth: 200 },
  headerLeftMobile: { flex: 0, minWidth: 0, width: '100%' },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[600], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 26, marginTop: 4 },
  titleMobile: { fontSize: 20 },
  subtitle: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm, marginTop: 2 },

  statRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.cream[100],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statRowMobile: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statNum: { fontFamily: fonts.headingBold, fontSize: 26 },
  statLabel: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as any },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border.soft },

  kartraBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: '#EDF2FA',
    borderWidth: 1,
    borderColor: '#B8CCE8',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  kartraBannerMobile: { marginHorizontal: spacing.md },
  kartraTitle: { fontFamily: fonts.bodySemibold, color: '#3A547A', fontSize: fontSize.sm },
  kartraSub: { fontFamily: fonts.body, color: '#5A6E8A', fontSize: fontSize.xs, marginTop: 2 },
  kartraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3A547A',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  kartraBtnTxt: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: fontSize.xs },

  tableWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    overflow: 'hidden',
    backgroundColor: colors.surface.raised,
  },
  tableWrapMobile: { marginHorizontal: spacing.md },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#F4F1E4',
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
  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: spacing.sm,
  },
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
  mobileUser: {
    fontFamily: fonts.body,
    color: colors.ink[500],
    fontSize: fontSize.xs,
    flex: 1,
  },
  rowAlt: { backgroundColor: '#FAF8F1' },
  subject: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, flex: 1 },
  rowMeta: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11, marginTop: 2 },
  cellTxt: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm },
  priTag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  priTxt: { fontFamily: fonts.bodyMedium, fontSize: 11, textTransform: 'capitalize' as any },
  dateCell: { fontFamily: fonts.support, color: colors.ink[500], fontSize: fontSize.xs, textAlign: 'right' as any },
});
