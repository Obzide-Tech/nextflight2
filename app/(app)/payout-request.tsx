import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Wallet, ShieldCheck, Info } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchKycProfile, fetchPayoutRequests } from '@/lib/data';
import { isRewardfulEnabled, fetchRewardfulPayouts } from '@/lib/rewardful';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const MIN_PAYOUT = 50;

export default function PayoutRequest() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(0);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [kycStatus, setKycStatus] = useState<string>('not_started');
  const [history, setHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
      setLoading(true);
      const useRewardful = await isRewardfulEnabled();

      const [{ data: balance }, kyc, payouts] = await Promise.all([
        supabase.from('wallet_balances').select('available_usd').eq('affiliate_user_id', user.id).maybeSingle(),
        fetchKycProfile(user.id),
        fetchPayoutRequests(user.id),
      ]);
      setAvailable(Number(balance?.available_usd ?? 0));
      setKycStatus(kyc?.status ?? 'not_started');

      if (useRewardful) {
        const { data: afProfile } = await supabase
          .from('affiliate_profiles')
          .select('rewardful_affiliate_id')
          .eq('id', user.id)
          .maybeSingle();
        const rwId = afProfile?.rewardful_affiliate_id;
        if (rwId) {
          const rwPayouts = await fetchRewardfulPayouts(rwId);
          if (rwPayouts.ok && Array.isArray(rwPayouts.data)) {
            const rwMapped = rwPayouts.data.map((p: any) => ({
              id: p.id,
              amount_usd: Number(p.amount ?? 0) / 100,
              requested_at: p.created_at,
              status: p.paid ? 'paid' : 'processing',
            }));
            setHistory([...rwMapped, ...payouts]);
          } else {
            setHistory(payouts);
          }
        } else {
          setHistory(payouts);
        }
      } else {
        setHistory(payouts);
      }

      } catch {
        // leave loading=false so user isn't stuck
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const onSubmit = async () => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    const value = Number(amount);
    if (isNaN(value) || !value || value < MIN_PAYOUT) {
      setError(`El monto mínimo es de $${MIN_PAYOUT} USD.`);
      return;
    }
    if (value > available) {
      setError('El monto solicitado supera tu saldo disponible.');
      return;
    }
    if (kycStatus !== 'approved') {
      setError('Debes completar tu KYC antes de tu primer retiro.');
      return;
    }

    setSubmitting(true);

    const { error: insErr } = await supabase.from('payout_requests').insert({
      affiliate_user_id: user.id,
      amount_usd: value,
      provider: 'internal',
      destination: notes.trim() || 'Acreditación interna NextFlight',
      status: 'requested',
    });

    if (insErr) {
      setError(insErr.message);
      setSubmitting(false);
      return;
    }

    setSuccess('Solicitud registrada. El equipo financiero te contactará para coordinar la acreditación.');
    setAmount('');
    setNotes('');
    const updated = await fetchPayoutRequests(user.id);
    setHistory(updated);
    setSubmitting(false);
  };

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[800]]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.cream[100]} />
          </TouchableOpacity>
          <Text style={styles.crumb}>Solicitar retiro</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.xxl }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceAmount}>${available.toFixed(2)} <Text style={styles.balanceCcy}>USD</Text></Text>
              <Text style={styles.balanceFoot}>Mínimo de retiro: ${MIN_PAYOUT} USD</Text>
            </View>

            <View style={styles.infoCard}>
              <Info size={16} color={colors.gold[400]} strokeWidth={1.6} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Acreditación interna NextFlight</Text>
                <Text style={styles.infoBody}>
                  Las comisiones se acreditan manualmente por el equipo financiero. Una vez aprobada tu solicitud,
                  coordinaremos contigo el método de cobro disponible en tu país.
                </Text>
              </View>
            </View>

            {kycStatus !== 'approved' ? (
              <TouchableOpacity style={styles.kycCta} onPress={() => router.push('/(app)/kyc')}>
                <ShieldCheck size={18} color={colors.gold[400]} strokeWidth={1.6} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.kycTitle}>Completa tu KYC</Text>
                  <Text style={styles.kycSub}>Es obligatorio antes de tu primer retiro.</Text>
                </View>
                <Text style={styles.kycStatus}>{(kycStatus ?? 'not_started').toUpperCase()}</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.label}>Monto a retirar (USD)</Text>
            <View style={styles.field}>
              <Text style={styles.prefix}>$</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder={`${MIN_PAYOUT}.00`}
                placeholderTextColor={colors.cream[200]}
              />
            </View>

            <Text style={styles.label}>Notas para el equipo (opcional)</Text>
            <View style={[styles.field, { alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Indica tu país, banco preferido o método sugerido"
                placeholderTextColor={colors.cream[200]}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            <TouchableOpacity style={styles.cta} onPress={onSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.burgundy[900]} />
              ) : (
                <>
                  <Wallet size={16} color={colors.burgundy[900]} strokeWidth={1.6} />
                  <Text style={styles.ctaText}>Confirmar solicitud</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.section}>Tu historial</Text>
            {history.length === 0 ? (
              <Text style={styles.empty}>Aún no has solicitado retiros.</Text>
            ) : (
              history.map((p) => (
                <View key={p.id} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyAmount}>${Number(p.amount_usd).toFixed(2)} USD</Text>
                    <Text style={styles.historyDate}>{new Date(p.requested_at).toLocaleDateString('es-ES')}</Text>
                  </View>
                  <View style={[styles.statusPill, statusStyle(p.status)]}>
                    <Text style={styles.statusText}>{p.status}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'paid':
      return { backgroundColor: 'rgba(63,122,79,0.2)', borderColor: colors.state.success };
    case 'failed':
    case 'rejected':
      return { backgroundColor: 'rgba(156,34,56,0.25)', borderColor: colors.state.error };
    case 'processing':
    case 'approved':
      return { backgroundColor: 'rgba(184,134,47,0.2)', borderColor: colors.state.warning };
    default:
      return { backgroundColor: 'rgba(255,251,224,0.08)', borderColor: colors.gold[600] };
  }
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,251,224,0.06)' },
  crumb: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 3, color: colors.gold[400], textTransform: 'uppercase' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  balanceCard: { backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.gold[600], borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  balanceLabel: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 2, color: colors.gold[400], textTransform: 'uppercase' },
  balanceAmount: { fontFamily: fonts.headingItalic, fontSize: fontSize.display, color: colors.cream[100], marginTop: 4 },
  balanceCcy: { fontFamily: fonts.support, fontSize: fontSize.md, color: colors.cream[200] },
  balanceFoot: { fontFamily: fonts.support, fontSize: 11, color: colors.cream[200], marginTop: spacing.xs },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: 'rgba(167,131,82,0.10)', borderColor: colors.gold[600], borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  infoTitle: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  infoBody: { fontFamily: fonts.body, color: colors.cream[200], fontSize: 12, lineHeight: 18, marginTop: 4 },
  kycCta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.state.warning, backgroundColor: 'rgba(184,134,47,0.1)', marginBottom: spacing.lg },
  kycTitle: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  kycSub: { fontFamily: fonts.body, color: colors.cream[200], fontSize: 11, marginTop: 2 },
  kycStatus: { fontFamily: fonts.supportMedium, fontSize: 10, letterSpacing: 1, color: colors.gold[400] },
  label: { fontFamily: fonts.supportMedium, fontSize: 11, color: colors.gold[400], letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginTop: spacing.md },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md },
  prefix: { fontFamily: fonts.bodySemibold, color: colors.gold[400], fontSize: fontSize.base },
  input: { flex: 1, fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.base, paddingVertical: 14 },
  error: { fontFamily: fonts.body, color: colors.state.error, fontSize: fontSize.sm, marginTop: spacing.sm },
  success: { fontFamily: fonts.body, color: colors.state.success, fontSize: fontSize.sm, marginTop: spacing.sm },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.gold[400], borderRadius: radius.pill, paddingVertical: 14, marginTop: spacing.lg },
  ctaText: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, letterSpacing: 0.5 },
  section: { fontFamily: fonts.headingItalic, fontSize: fontSize.lg, color: colors.cream[100], marginTop: spacing.xl, marginBottom: spacing.sm },
  empty: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.sm, padding: spacing.md, textAlign: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  historyAmount: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  historyDate: { fontFamily: fonts.support, color: colors.cream[200], fontSize: 11, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  statusText: { fontFamily: fonts.supportMedium, color: colors.cream[100], fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
});
