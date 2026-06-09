import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, ChevronRight, FileText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createRewardfulAffiliate, findRewardfulAffiliateByEmail } from '@/lib/rewardful';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

function generateCode(seed: string) {
  const base = seed.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'NF';
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${tail}`;
}

export default function AffiliateActivate() {
  const router = useRouter();
  const { user, profile, refresh } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onActivate = async () => {
    if (!user || !accepted) return;
    setError(null);
    setActivating(true);

    try {
      const { error: affError } = await supabase.from('affiliate_profiles').upsert({
        id: user.id,
        accepted_terms_at: new Date().toISOString(),
        status: 'active',
      });
      if (affError) {
        setError(affError.message);
        return;
      }

      await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'affiliate' }, { onConflict: 'user_id,role', ignoreDuplicates: true });

      const code = generateCode(profile?.full_name ?? user.email ?? 'NF');
      await supabase
        .from('affiliate_links')
        .upsert({ affiliate_user_id: user.id, code, is_active: true }, { ignoreDuplicates: true });

      // Sync to Rewardful — never blocks local activation regardless of outcome
      const email = user.email ?? '';
      const nameParts = (profile?.full_name ?? '').trim().split(/\s+/);
      const firstName = nameParts[0] ?? 'Copiloto';
      const lastName = nameParts.slice(1).join(' ') || 'NFA';

      try {
        let rwId: string | null = null;
        const rwRes = await createRewardfulAffiliate(email, firstName, lastName);
        if (rwRes.ok && rwRes.data?.id) {
          rwId = rwRes.data.id;
        } else {
          // Email already registered in Rewardful — find the existing affiliate
          const findRes = await findRewardfulAffiliateByEmail(email);
          if (findRes.ok && findRes.data?.id) {
            rwId = findRes.data.id;
          }
        }
        if (rwId) {
          await supabase
            .from('affiliate_profiles')
            .update({ rewardful_affiliate_id: rwId })
            .eq('id', user.id);
        }
      } catch {
        // Rewardful sync is non-critical — continue with local activation
      }

      await refresh();
      router.replace('/(app)/(tabs)/copilotos');
    } catch (err: any) {
      setError(err?.message ?? 'Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[800]]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.cream[100]} />
          </TouchableOpacity>
          <Text style={styles.crumb}>Activación Copiloto</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={28} color={colors.gold[400]} strokeWidth={1.4} />
          </View>
          <Text style={styles.title}>Únete a la cabina de Copilotos</Text>
          <Text style={styles.body}>
            Al activar tu rol de afiliada generamos tu enlace personal con código corto, una billetera vinculada al
            ledger inmutable y la posibilidad de solicitar retiros en USD vía PayPal cuando alcances el saldo
            mínimo de $50.
          </Text>

          <View style={styles.terms}>
            <Text style={styles.termsTitle}>Condiciones del programa</Text>
            <Text style={styles.termsBody}>
              · Comision por defecto del 90% sobre ingresos netos confirmados.{'\n'}
              · Atribucion last-click con ventana de 30 dias.{'\n'}
              · KYC obligatorio al primer retiro.{'\n'}
              · Saldos sujetos a periodos de retencion por reembolsos.
            </Text>

            <TouchableOpacity style={styles.docRow} onPress={() => router.push('/(legal)/affiliate-agreement')} activeOpacity={0.85}>
              <FileText size={15} color={colors.gold[400]} strokeWidth={1.5} />
              <Text style={styles.docRowText}>Acuerdo de Afiliados</Text>
              <ChevronRight size={14} color={colors.cream[200]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.docRow} onPress={() => router.push('/(legal)/affiliate-guidelines')} activeOpacity={0.85}>
              <FileText size={15} color={colors.gold[400]} strokeWidth={1.5} />
              <Text style={styles.docRowText}>Codigo de Conducta de Afiliados</Text>
              <ChevronRight size={14} color={colors.cream[200]} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAccepted(!accepted)} style={styles.checkboxRow}>
              <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                {accepted ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabel}>He leido y acepto los terminos del programa Copilotos.</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={[styles.cta, !accepted && { opacity: 0.5 }]} onPress={onActivate} disabled={!accepted || activating}>
            {activating ? <ActivityIndicator color={colors.burgundy[900]} /> : <Text style={styles.ctaText}>Activar mi cabina</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,251,224,0.06)' },
  crumb: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 3, color: colors.gold[400], textTransform: 'uppercase' },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  iconCircle: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,131,82,0.16)', borderColor: colors.gold[600], borderWidth: 1, marginVertical: spacing.md },
  title: { fontFamily: fonts.headingItalic, fontSize: fontSize.xxl, color: colors.cream[100], textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], lineHeight: 22, textAlign: 'center', paddingHorizontal: spacing.sm },
  terms: { backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, gap: spacing.sm },
  termsTitle: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  termsBody: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.sm, lineHeight: 22 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderColor: colors.gold[400], borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.gold[400] },
  checkboxMark: { color: colors.burgundy[900], fontFamily: fonts.bodySemibold, fontSize: 14 },
  checkboxLabel: { flex: 1, fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.sm },
  cta: { backgroundColor: colors.gold[400], borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
  ctaText: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, letterSpacing: 0.5 },
  error: { fontFamily: fonts.body, color: colors.state.error, fontSize: fontSize.sm, textAlign: 'center' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,251,224,0.1)' },
  docRowText: { flex: 1, fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.sm },
});
