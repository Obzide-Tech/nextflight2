import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { ShieldCheck, Sparkles, ChevronRight, ExternalLink, Receipt, LayoutDashboard, Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/contexts/AuthContext';
import { fetchActiveSubscription, fetchPublishedPrograms, fetchPurchaseHistory, type Program, type SubscriptionRow } from '@/lib/data';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const STATUS_LABEL: Record<SubscriptionRow['status'], string> = {
  active: 'Activa',
  grace_period: 'Período de gracia',
  on_hold: 'En espera',
  cancelled: 'Cancelada',
  expired: 'Expirada',
  inactive: 'Inactiva',
};

const STATUS_COLOR: Record<SubscriptionRow['status'], string> = {
  active: '#4CAF50',
  grace_period: '#FF9800',
  on_hold: '#FF9800',
  cancelled: '#F44336',
  expired: '#F44336',
  inactive: '#9E9E9E',
};

const TX_STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  refunded: 'Reembolsado',
  failed: 'Fallido',
  chargeback: 'Contracargo',
};

const TX_STATUS_BG: Record<string, string> = {
  confirmed: 'rgba(76,175,80,0.18)',
  pending: 'rgba(255,152,0,0.18)',
  refunded: 'rgba(100,181,246,0.18)',
  failed: 'rgba(244,67,54,0.18)',
  chargeback: 'rgba(244,67,54,0.18)',
};

const TX_STATUS_TEXT: Record<string, string> = {
  confirmed: '#4CAF50',
  pending: '#FF9800',
  refunded: '#64B5F6',
  failed: '#F44336',
  chargeback: '#F44336',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function Aduana() {
  const { user, roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const isPremium = roles.includes('student_premium');
  const isAdmin = roles.some((r) => r.startsWith('admin_'));
  const isStudent = roles.includes('student_free') || roles.includes('student_premium');
  const isAffiliateOnly = roles.includes('affiliate') && !isStudent && !isAdmin;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [sub, progs, txs] = await Promise.all([
        fetchActiveSubscription(user.id),
        fetchPublishedPrograms(),
        fetchPurchaseHistory(user.id),
      ]);
      setSubscription(sub);
      setPrograms(progs);
      setTransactions(txs);
      setLoading(false);
    })();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const currentProgram = subscription?.program_id
    ? programs.find((p) => p.id === subscription.program_id)
    : programs.find((p) => p.tier === 'free');

  const upgradeProgram = programs.find((p) => p.tier === 'premium' && p.price_usd > 0);

  const onCheckout = async () => {
    if (!upgradeProgram?.checkout_url) return;
    setCheckoutLoading(true);
    try {
      await Linking.openURL(upgradeProgram.checkout_url);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer subtitle="La Aduana" title="Tu inscripción" scrollRef={scrollRef}>
        <ActivityIndicator color={colors.gold[400]} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer subtitle="La Aduana" title="Tu inscripción" scrollRef={scrollRef}>
      {/* Status card */}
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: isAdmin ? colors.gold[500] : subscription ? STATUS_COLOR[subscription.status] : '#9E9E9E' }]}>
          <ShieldCheck size={13} color="#fff" strokeWidth={2.2} />
          <Text style={styles.statusBadgeText}>
            {isAdmin ? 'Acceso completo' : subscription ? STATUS_LABEL[subscription.status] : 'Sin inscripción'}
          </Text>
        </View>
        <Text style={styles.planName}>{isAdmin ? 'NextFlight Admin' : currentProgram?.title ?? 'NextFlight Starter'}</Text>
        <Text style={styles.planDesc}>
          {isAdmin ? 'Acceso ilimitado a todo el contenido y funciones de la plataforma.' : currentProgram?.subtitle ?? 'Acceso al primer módulo y a tu cabina.'}
        </Text>
        {!isAdmin && subscription?.current_period_start ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fecha de compra</Text>
            <Text style={styles.metaValue}>{formatDate(subscription.current_period_start)}</Text>
          </View>
        ) : null}
        {!isAdmin && subscription?.current_period_end ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Vigencia hasta</Text>
            <Text style={styles.metaValue}>{formatDate(subscription.current_period_end)}</Text>
          </View>
        ) : null}
        {!isAdmin && subscription?.platform ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Plataforma</Text>
            <Text style={styles.metaValue}>
              {subscription.platform === 'apple'
                ? 'Apple App Store'
                : subscription.platform === 'google'
                  ? 'Google Play'
                  : subscription.platform === 'stripe' || subscription.platform === 'stripe_checkout'
                    ? 'Tarjeta / Stripe'
                    : subscription.platform === 'rewardful'
                      ? 'Rewardful / Web'
                      : subscription.platform}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Affiliate-only summary card */}
      {isAffiliateOnly ? (
        <>
          <Text style={styles.section}>Tu cabina de copiloto</Text>
          <TouchableOpacity style={styles.affiliateCard} onPress={() => router.push('/(app)/(tabs)/copilotos')} activeOpacity={0.85}>
            <View style={styles.affiliateRow}>
              <View style={styles.affiliateIconWrap}>
                <Wallet size={18} color={colors.gold[400]} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.affiliateTitle}>Comisiones y retiros</Text>
                <Text style={styles.affiliateSub}>Consulta tu saldo, enlace y estadísticas de ventas en la sección Copilotos.</Text>
              </View>
              <ChevronRight size={16} color={colors.cream[200]} />
            </View>
          </TouchableOpacity>
        </>
      ) : null}

      {/* Upgrade card — only for students who haven't gone premium */}
      {!isPremium && isStudent && !isAdmin && upgradeProgram ? (
        <>
          <Text style={styles.section}>Mejora tu vuelo</Text>
          <View style={styles.upgradeCard}>
            <View style={styles.diamondRow}>
              <Sparkles size={18} color={colors.gold[600]} strokeWidth={1.5} />
              <Text style={styles.upgradeEyebrow}>Premium Method</Text>
            </View>
            <Text style={styles.upgradeTitle}>{upgradeProgram.title}</Text>
            <Text style={styles.upgradeDesc}>
              {upgradeProgram.description ?? 'Accede al método completo, mentorías y bitácoras avanzadas.'}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${upgradeProgram.price_usd.toFixed(0)}</Text>
              <Text style={styles.priceCcy}>USD · pago único</Text>
            </View>

            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => router.push('/(legal)/refund-policy')} style={styles.legalLinkRow}>
                <Text style={styles.legalLink}>Política de Reembolso</Text>
                <ChevronRight size={12} color={colors.ink[300]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(legal)/enrollment-agreement')} style={styles.legalLinkRow}>
                <Text style={styles.legalLink}>Acuerdo de Inscripción</Text>
                <ChevronRight size={12} color={colors.ink[300]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.payCta, !upgradeProgram.checkout_url && styles.payCtaDisabled]}
              onPress={onCheckout}
              disabled={checkoutLoading || !upgradeProgram.checkout_url}
            >
              {checkoutLoading ? (
                <ActivityIndicator color={colors.cream[100]} />
              ) : (
                <>
                  <ExternalLink size={18} color={colors.cream[100]} strokeWidth={1.6} />
                  <Text style={styles.payText}>Inscribirme ahora</Text>
                </>
              )}
            </TouchableOpacity>

            {!upgradeProgram.checkout_url ? (
              <Text style={[styles.message, { color: colors.ink[500] }]}>
                Enlace de pago no disponible. Contacta soporte.
              </Text>
            ) : null}

            <Text style={styles.fineprint}>
              Pago único de ${upgradeProgram.price_usd.toFixed(0)} USD · Cuotas disponibles según tu método de pago. Sin reembolsos una vez activado el acceso.
            </Text>
          </View>
        </>
      ) : null}

      {/* Purchase history */}
      {transactions.length > 0 ? (
        <>
          <Text style={styles.section}>Historial de compras</Text>
          <View style={styles.txCard}>
            {transactions.map((tx: any, i: number) => {
              const statusLabel = TX_STATUS_LABEL[tx.status] ?? tx.status;
              const bg = TX_STATUS_BG[tx.status] ?? 'rgba(255,251,224,0.08)';
              const fg = TX_STATUS_TEXT[tx.status] ?? colors.cream[200];
              const programTitle = tx.products_programs?.title ?? tx.source ?? 'Compra';
              return (
                <View key={tx.id} style={[styles.txRow, i < transactions.length - 1 && styles.txRowBorder]}>
                  <View style={styles.txLeft}>
                    <Receipt size={14} color={colors.gold[400]} strokeWidth={1.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle} numberOfLines={1}>{programTitle}</Text>
                      <Text style={styles.txDate}>{formatDate(tx.occurred_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    {tx.amount_usd != null ? (
                      <Text style={styles.txAmount}>${Number(tx.amount_usd).toFixed(2)}</Text>
                    ) : null}
                    <View style={[styles.txBadge, { backgroundColor: bg }]}>
                      <Text style={[styles.txBadgeText, { color: fg }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {/* Admin panel link — only visible for admin roles */}
      {isAdmin ? (
        <>
          <Text style={styles.section}>Panel de administración</Text>
          <TouchableOpacity
            style={styles.adminRow}
            onPress={() => router.push('/(admin)/dashboard')}
          >
            <View style={styles.adminIcon}>
              <LayoutDashboard size={18} color={colors.gold[400]} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>Ir al panel de administración</Text>
              <Text style={styles.adminSub}>Gestiona contenido, usuarios, pagos y más desde la vista web.</Text>
            </View>
            <ExternalLink size={16} color={colors.gold[400]} strokeWidth={1.6} />
          </TouchableOpacity>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: 'rgba(255,251,224,0.06)',
    borderColor: colors.burgundy[700],
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 2,
  },
  statusBadgeText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  planName: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.xl,
    color: colors.cream[100],
    marginTop: spacing.sm,
  },
  planDesc: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,251,224,0.08)',
  },
  metaLabel: {
    fontFamily: fonts.support,
    fontSize: 11,
    color: colors.cream[200],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
  },
  section: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.lg,
    color: colors.cream[100],
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  upgradeCard: {
    backgroundColor: colors.cream[100],
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  diamondRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upgradeEyebrow: {
    fontFamily: fonts.supportMedium,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.gold[600],
    textTransform: 'uppercase',
  },
  upgradeTitle: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.xl,
    color: colors.burgundy[900],
    marginTop: spacing.sm,
  },
  upgradeDesc: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.ink[700],
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: spacing.md },
  price: { fontFamily: fonts.headingBold, fontSize: fontSize.display, color: colors.burgundy[900] },
  priceCcy: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink[500] },
  payCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    backgroundColor: colors.burgundy[900],
    paddingVertical: 16,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  payText: {
    fontFamily: fonts.bodySemibold,
    color: colors.cream[100],
    fontSize: fontSize.base,
    letterSpacing: 0.5,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.burgundy[800],
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  fineprint: {
    fontFamily: fonts.support,
    fontSize: 11,
    color: colors.ink[500],
    lineHeight: 16,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  legalLinks: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.soft,
    paddingTop: spacing.sm,
  },
  legalLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  legalLink: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink[500],
    textDecorationLine: 'underline',
  },
  txCard: {
    backgroundColor: 'rgba(255,251,224,0.06)',
    borderColor: colors.burgundy[700],
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,251,224,0.07)',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    flex: 1,
  },
  txDate: {
    fontFamily: fonts.support,
    fontSize: 11,
    color: colors.cream[200],
    marginTop: 2,
  },
  txAmount: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
  },
  txBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  txBadgeText: {
    fontFamily: fonts.support,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  payCtaDisabled: {
    opacity: 0.5,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(175,137,86,0.08)',
    borderColor: 'rgba(175,137,86,0.30)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(175,137,86,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adminTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.gold[300],
  },
  adminSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.cream[200],
    marginTop: 2,
    lineHeight: 16,
  },
  affiliateCard: {
    backgroundColor: 'rgba(175,137,86,0.08)',
    borderColor: 'rgba(175,137,86,0.25)',
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  affiliateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  affiliateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(175,137,86,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  affiliateTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.gold[300],
  },
  affiliateSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.cream[200],
    marginTop: 2,
    lineHeight: 16,
  },
});
