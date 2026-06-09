import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Plane } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAffiliateNetwork } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { isRewardfulEnabled, fetchRewardfulReferrals } from '@/lib/rewardful';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

export default function Network() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const useRewardful = await isRewardfulEnabled();
      if (useRewardful) {
        const { data: afProfile } = await supabase
          .from('affiliate_profiles')
          .select('rewardful_affiliate_id')
          .eq('id', user.id)
          .maybeSingle();
        const rwId = afProfile?.rewardful_affiliate_id;
        if (rwId) {
          const res = await fetchRewardfulReferrals(rwId);
          if (res.ok && Array.isArray(res.data)) {
            setRows(res.data.map((r: any) => ({
              id: r.id,
              profile: { full_name: r.customer?.name ?? r.customer?.email ?? 'Referida', country: '' },
              attributedAt: r.created_at,
              sales: { confirmed: Number(r.sale_amount ?? 0) / 100, pending: 0, total: Number(r.sale_amount ?? 0) / 100 },
            })));
          }
        }
        setLoading(false);
        return;
      }
      const data = await fetchAffiliateNetwork(user.id);
      setRows(data);
      setLoading(false);
    })();
  }, [user?.id]);

  const totalReferrals = rows.length;
  const totalSales = rows.reduce((acc, r) => acc + (r.sales?.confirmed ?? 0), 0);
  const conversion = totalReferrals > 0
    ? Math.round((rows.filter((r) => (r.sales?.confirmed ?? 0) > 0).length / totalReferrals) * 100)
    : 0;

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[800]]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.cream[100]} />
          </TouchableOpacity>
          <Text style={styles.crumb}>Mi red</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.xxl }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.heroTitle}>Tu tripulación a bordo</Text>
            <Text style={styles.heroSub}>Cada pasajera referida se enlaza a tu cabina con atribución last-click de 30 días.</Text>

            <View style={styles.kpis}>
              <View style={styles.kpi}><Text style={styles.kpiValue}>{totalReferrals}</Text><Text style={styles.kpiLabel}>Referidas</Text></View>
              <View style={styles.kpi}><Text style={styles.kpiValue}>${totalSales.toFixed(2)}</Text><Text style={styles.kpiLabel}>Ventas confirmadas</Text></View>
              <View style={styles.kpi}><Text style={styles.kpiValue}>{conversion}%</Text><Text style={styles.kpiLabel}>Conversión</Text></View>
            </View>

            {rows.length === 0 ? (
              <View style={styles.empty}>
                <Plane size={32} color={colors.gold[400]} strokeWidth={1.4} />
                <Text style={styles.emptyTitle}>Aún no hay pasajeras a bordo</Text>
                <Text style={styles.emptyBody}>Comparte tu enlace personal desde la cabina para empezar a sumar referidas.</Text>
              </View>
            ) : (
              rows.map((r) => {
                const initials = (r.profile?.full_name ?? 'NN').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();
                const sale = r.sales?.confirmed ?? 0;
                const pending = r.sales?.pending ?? 0;
                return (
                  <View key={r.id} style={styles.card}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{r.profile?.full_name ?? 'Pasajera anónima'}</Text>
                      <View style={styles.metaRow}>
                        {r.profile?.country ? (
                          <View style={styles.metaChip}>
                            <MapPin size={10} color={colors.cream[200]} />
                            <Text style={styles.metaText}>{r.profile.country}</Text>
                          </View>
                        ) : null}
                        <Text style={styles.metaDate}>{new Date(r.attributedAt).toLocaleDateString('es-ES')}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amount}>${sale.toFixed(2)}</Text>
                      {pending > 0 ? <Text style={styles.pending}>+${pending.toFixed(2)} pendiente</Text> : null}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,251,224,0.06)' },
  crumb: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 3, color: colors.gold[400], textTransform: 'uppercase' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  heroTitle: { fontFamily: fonts.headingItalic, fontSize: fontSize.xxl, color: colors.cream[100] },
  heroSub: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], marginTop: spacing.xs, lineHeight: 22 },
  kpis: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  kpi: { flex: 1, backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  kpiValue: { fontFamily: fonts.headingItalic, fontSize: fontSize.lg, color: colors.cream[100] },
  kpiLabel: { fontFamily: fonts.support, fontSize: 10, color: colors.cream[200], letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm, backgroundColor: 'rgba(255,251,224,0.04)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.lg, marginTop: spacing.md },
  emptyTitle: { fontFamily: fonts.headingItalic, fontSize: fontSize.lg, color: colors.cream[100] },
  emptyBody: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], textAlign: 'center', lineHeight: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,131,82,0.18)' },
  avatarText: { fontFamily: fonts.bodySemibold, color: colors.gold[400], fontSize: fontSize.sm, letterSpacing: 1 },
  name: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.support, color: colors.cream[200], fontSize: 11 },
  metaDate: { fontFamily: fonts.support, color: colors.cream[200], fontSize: 11, opacity: 0.8 },
  amount: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.gold[400] },
  pending: { fontFamily: fonts.support, fontSize: 10, color: colors.cream[200], marginTop: 2 },
});
