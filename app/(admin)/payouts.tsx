import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { StatusPill } from '@/components/admin/StatusPill';
import { fetchPayouts, processPayoutAction, PayoutRow } from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import {
  CircleCheck as CheckCircle2, Circle as XCircle, Banknote, RefreshCw, Clock, DollarSign,
} from 'lucide-react-native';

const FILTERS = ['todos', 'requested', 'approved', 'paid', 'rejected'] as const;
type Filter = typeof FILTERS[number];

type PendingAction = { row: PayoutRow; action: 'approve' | 'reject' | 'mark_paid' };

const FILTER_META: Record<string, { color: string; label: string }> = {
  todos: { color: colors.ink[500], label: 'Todas' },
  requested: { color: '#D97706', label: 'Solicitadas' },
  approved: { color: '#3A547A', label: 'Aprobadas' },
  paid: { color: '#2C5E3C', label: 'Pagadas' },
  rejected: { color: colors.state.error, label: 'Rechazadas' },
};

function initials(name: string): string {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function Payouts() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('requested');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [inputValue, setInputValue] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setRows(await fetchPayouts());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = filter === 'todos' ? rows : rows.filter((r) => r.status === filter);

  const initAction = (row: PayoutRow, action: 'approve' | 'reject' | 'mark_paid') => {
    if (action === 'reject' || action === 'mark_paid') {
      setInputValue('');
      setPendingAction({ row, action });
    } else {
      runAction(row, action, undefined, undefined);
    }
  };

  const runAction = async (row: PayoutRow, action: 'approve' | 'reject' | 'mark_paid', externalRef?: string, reason?: string) => {
    setErrorMsg(null);
    setBusyId(row.id);
    setPendingAction(null);
    const r = await processPayoutAction(row.id, action, { external_ref: externalRef, reason });
    if (!r.ok) setErrorMsg(r.error ?? 'Error');
    setBusyId(null);
    await reload();
  };

  const confirmPending = () => {
    if (!pendingAction) return;
    const { row, action } = pendingAction;
    if (action === 'mark_paid') runAction(row, action, inputValue.trim() || undefined, undefined);
    else if (action === 'reject') runAction(row, action, undefined, inputValue.trim() || undefined);
  };

  const pendingTotal = rows.filter((r) => r.status === 'requested').reduce((s, r) => s + Number(r.amount_usd), 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={{ flex: isMobile ? 0 : 1 }}>
          <Text style={styles.eyebrow}>Operación financiera</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Cola de payouts</Text>
          <Text style={styles.subtitle}>Aprueba, rechaza o marca como pagado — cada acción queda auditada.</Text>
        </View>
        <View style={[styles.headerActions, isMobile && styles.headerActionsMobile]}>
          <View style={styles.statBox}>
            <Clock size={14} color={colors.gold[400]} strokeWidth={1.8} />
            <View>
              <Text style={styles.statLabel}>Pendiente</Text>
              <Text style={styles.statValue}>${pendingTotal.toFixed(2)}</Text>
            </View>
          </View>
          <Pressable onPress={reload} style={styles.refreshBtn}>
            <RefreshCw size={14} color={colors.burgundy[800]} strokeWidth={2} />
            <Text style={styles.refreshTxt}>Actualizar</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterTabs, isMobile && styles.filterTabsMobile]}>
        {FILTERS.map((f) => {
          const count = f === 'todos' ? rows.length : rows.filter((r) => r.status === f).length;
          const meta = FILTER_META[f];
          return (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterTab, filter === f && styles.filterTabActive]}>
              <Text style={[styles.filterTabTxt, filter === f && { color: meta.color }]}>{meta.label}</Text>
              <View style={[styles.filterBadge, filter === f && { backgroundColor: meta.color }]}>
                <Text style={[styles.filterBadgeTxt, filter === f && { color: colors.cream[100] }]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {pendingAction ? (
        <View style={[styles.confirmCard, isMobile && styles.confirmCardMobile]}>
          <Text style={styles.confirmTitle}>
            {pendingAction.action === 'mark_paid' ? 'Confirmar pago' : 'Confirmar rechazo'}
          </Text>
          <Text style={styles.confirmSub}>
            {pendingAction.row.affiliate_name} · ${Number(pendingAction.row.amount_usd).toFixed(2)}
          </Text>
          <TextInput
            style={styles.confirmInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={pendingAction.action === 'mark_paid' ? 'Ref. externa (ej. TRF-2024-001)' : 'Motivo del rechazo'}
            placeholderTextColor={colors.ink[300]}
            autoFocus
          />
          <View style={styles.confirmBtns}>
            <Pressable onPress={() => setPendingAction(null)} style={styles.confirmCancel}>
              <Text style={styles.confirmCancelTxt}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={confirmPending}
              style={[styles.confirmOk, pendingAction.action === 'reject' && styles.confirmOkDanger]}
            >
              <Text style={styles.confirmOkTxt}>
                {pendingAction.action === 'mark_paid' ? 'Marcar pagado' : 'Rechazar'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Payout cards */}
      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator color={colors.gold[500]} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <DollarSign size={36} color={colors.ink[100]} strokeWidth={1.4} />
          <Text style={styles.emptyTxt}>No hay solicitudes con este filtro.</Text>
        </View>
      ) : (
        <View style={[styles.cardGrid, isMobile && styles.cardGridMobile]}>
          {filtered.map((r) => (
            <View key={r.id} style={[styles.payCard, isMobile && styles.payCardMobile]}>
              <View style={styles.payCardTop}>
                <View style={styles.payAvatar}>
                  <Text style={styles.payAvatarTxt}>{initials(r.affiliate_name ?? '?')}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.payName} numberOfLines={1}>{r.affiliate_name}</Text>
                  <Text style={styles.payProvider} numberOfLines={1}>{r.provider} · {new Date(r.requested_at).toLocaleDateString()}</Text>
                </View>
                <StatusPill value={r.status} />
              </View>

              <View style={styles.payAmount}>
                <Text style={styles.payAmountLabel}>Monto solicitado</Text>
                <Text style={styles.payAmountValue}>${Number(r.amount_usd).toFixed(2)}</Text>
                <Text style={styles.payAmountCurrency}>USD</Text>
              </View>

              {r.external_ref ? (
                <Text style={styles.payRef}>Ref: {r.external_ref}</Text>
              ) : null}

              {(r.status === 'requested' || r.status === 'approved') ? (
                <View style={styles.payActions}>
                  {r.status === 'requested' ? (
                    <Pressable
                      onPress={() => initAction(r, 'approve')}
                      disabled={busyId === r.id}
                      style={[styles.actionBtn, styles.actionBtnApprove, busyId === r.id && { opacity: 0.5 }]}
                    >
                      <CheckCircle2 size={14} color="#fff" />
                      <Text style={styles.actionBtnTxt}>Aprobar</Text>
                    </Pressable>
                  ) : null}
                  {r.status === 'approved' ? (
                    <Pressable
                      onPress={() => initAction(r, 'mark_paid')}
                      disabled={busyId === r.id}
                      style={[styles.actionBtn, styles.actionBtnPaid, busyId === r.id && { opacity: 0.5 }]}
                    >
                      <Banknote size={14} color="#fff" />
                      <Text style={styles.actionBtnTxt}>Marcar pagado</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => initAction(r, 'reject')}
                    disabled={busyId === r.id}
                    style={[styles.actionBtn, styles.actionBtnReject, busyId === r.id && { opacity: 0.5 }]}
                  >
                    <XCircle size={14} color={colors.state.error} />
                    <Text style={styles.actionBtnTxtDanger}>Rechazar</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50], minWidth: 0 },
  container: { paddingBottom: 48, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    backgroundColor: colors.surface.raised,
  },
  headerMobile: {
    flexDirection: 'column',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  eyebrow: {
    fontFamily: fonts.support,
    color: colors.gold[600],
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase' as any,
  },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 28, marginTop: 4 },
  titleMobile: { fontSize: 22 },
  subtitle: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexShrink: 0 },
  headerActionsMobile: { flexDirection: 'row', marginTop: spacing.sm },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.burgundy[900],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  statLabel: { fontFamily: fonts.support, color: colors.gold[400], fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as any },
  statValue: { fontFamily: fonts.headingBold, color: colors.cream[100], fontSize: 18 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.raised,
  },
  refreshTxt: { fontFamily: fonts.bodyMedium, color: colors.burgundy[800], fontSize: fontSize.sm },

  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap' as any,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  filterTabsMobile: { paddingHorizontal: spacing.md },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface.raised,
  },
  filterTabActive: { borderColor: colors.border.medium, backgroundColor: colors.surface.raised },
  filterTabTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.sm },
  filterBadge: { backgroundColor: colors.cream[200], borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  filterBadgeTxt: { fontFamily: fonts.bodySemibold, color: colors.ink[500], fontSize: 11 },

  errorBanner: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: '#FCE3E3',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D89A9A',
  },
  errorText: { fontFamily: fonts.bodyMedium, color: '#7A1A2C', fontSize: fontSize.sm },

  confirmCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.surface.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  confirmCardMobile: { marginHorizontal: spacing.md },
  confirmTitle: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.base },
  confirmSub: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm },
  confirmInput: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.ink[800],
    backgroundColor: colors.cream[100],
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    outlineStyle: 'none' as any,
  },
  confirmBtns: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  confirmCancel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  confirmCancelTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.sm },
  confirmOk: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.state.success,
  },
  confirmOkDanger: { backgroundColor: colors.state.error },
  confirmOkTxt: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: fontSize.sm },

  loadWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyWrap: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500] },

  cardGrid: {
    padding: spacing.xl,
    gap: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap' as any,
    alignItems: 'flex-start',
  },
  cardGridMobile: {
    padding: spacing.md,
    flexDirection: 'column',
  },
  payCard: {
    backgroundColor: colors.surface.raised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.soft,
    padding: spacing.lg,
    minWidth: 280,
    flex: 1,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  payCardMobile: {
    minWidth: 0,
    flex: 0,
    width: '100%',
  },
  payCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, overflow: 'hidden' },
  payAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.burgundy[900],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  payAvatarTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: 15 },
  payName: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.base, minWidth: 0 },
  payProvider: { fontFamily: fonts.support, color: colors.ink[500], fontSize: fontSize.xs, marginTop: 2, minWidth: 0 },

  payAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.soft,
  },
  payAmountLabel: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as any, flex: 1 },
  payAmountValue: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 22 },
  payAmountCurrency: { fontFamily: fonts.support, color: colors.ink[500], fontSize: fontSize.sm },

  payRef: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11 },

  payActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' as any, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  actionBtnApprove: { backgroundColor: colors.state.success },
  actionBtnPaid: { backgroundColor: colors.state.info },
  actionBtnReject: { backgroundColor: '#FCE3E3', borderWidth: 1, borderColor: '#D89A9A' },
  actionBtnTxt: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: fontSize.sm },
  actionBtnTxtDanger: { fontFamily: fonts.bodySemibold, color: colors.state.error, fontSize: fontSize.sm },
});
