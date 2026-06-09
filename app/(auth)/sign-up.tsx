import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { ChevronLeft, User, Mail, Lock, Check, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { LOGO_PLANE_GOLD_GRAD, LOGO_WORDMARK_CENTERED_GOLD } from '@/constants/logos';

const { width: SW } = Dimensions.get('window');
const PLANE   = Math.round(SW * 0.14);
const RING    = Math.round(PLANE * 1.5);
const WM_W    = SW;
const WM_H    = Math.round(WM_W * 0.52);
const OVERLAP = Math.round(PLANE * 0.12);

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError('Por favor ingresa tu nombre.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (!termsAccepted) return setError('Debes aceptar los Terminos y Condiciones para continuar.');
    setLoading(true);
    const { error } = await signUp(email.trim().toLowerCase(), password, name.trim());
    setLoading(false);
    if (error) setError(error);
    else router.replace('/(auth)/onboarding');
  };

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[700]]} style={{ flex: 1 }}>
      <View style={styles.topRule} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Back button ── */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <ChevronLeft color={colors.cream[100]} size={22} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>

          {/* ── Avión + 1 ring + Wordmark grande ── */}
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center', marginBottom: -OVERLAP }}>
              <View style={{
                position: 'absolute',
                width: RING, height: RING,
                borderRadius: RING / 2,
                backgroundColor: 'rgba(175,137,86,0.11)',
                borderWidth: 1.5,
                borderColor: 'rgba(175,137,86,0.30)',
              }} />
              <Image source={LOGO_PLANE_GOLD_GRAD} style={{ width: PLANE, height: PLANE }} resizeMode="contain" />
            </View>
            <Image source={LOGO_WORDMARK_CENTERED_GOLD} style={{ width: WM_W, height: WM_H }} resizeMode="contain" />
          </View>

          {/* ── Decorative boarding ticket ── */}
          <View style={styles.ticketBadge}>
            <View style={styles.ticketLeft}>
              <Text style={styles.ticketLabel}>BOARDING PASS</Text>
              <Text style={styles.ticketDest}>Your Next Flight</Text>
            </View>
            <View style={styles.ticketRight}>
              <Text style={styles.ticketLabel}>SEAT</Text>
              <Text style={styles.ticketDest}>A-1</Text>
            </View>
          </View>

          <Text style={styles.title}>Reserva tu asiento</Text>
          <Text style={styles.subtitle}>Comienza tu vuelo con nosotros. Es gratis empezar.</Text>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <View style={styles.cardAccent} />

            <View style={styles.field}>
              <User size={16} color={colors.burgundy[700]} strokeWidth={1.5} />
              <TextInput
                placeholder="Tu nombre completo"
                placeholderTextColor={colors.ink[300]}
                style={styles.input}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Mail size={16} color={colors.burgundy[700]} strokeWidth={1.5} />
              <TextInput
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.ink[300]}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Lock size={16} color={colors.burgundy[700]} strokeWidth={1.5} />
              <TextInput
                placeholder="Contraseña (mín. 8 caracteres)"
                placeholderTextColor={colors.ink[300]}
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.85}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted ? <Check size={14} color={colors.cream[100]} strokeWidth={2.5} /> : null}
              </View>
              <Text style={styles.termsText}>
                He leido y acepto los{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/(legal)/terms')}>
                  Terminos de Servicio
                </Text>
                {', '}la{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/(legal)/privacy')}>
                  Politica de Privacidad
                </Text>
                {' '}y la{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/(legal)/refund-policy')}>
                  Politica de No Reembolso
                </Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.legalNote}>
              Al registrarte tambien aceptas nuestro{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/(legal)/income-disclaimer')}>
                Aviso de Resultados e Ingresos
              </Text>
              {' '}y el{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/(legal)/conduct')}>
                Codigo de Conducta Estudiantil
              </Text>
              .
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.cta, !termsAccepted && { opacity: 0.55 }]}
              onPress={onSubmit}
              disabled={loading || !termsAccepted}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.cream[100]} />
              ) : (
                <>
                  <Text style={styles.ctaText}>Despegar ahora</Text>
                  <ArrowRight size={16} color={colors.cream[100]} strokeWidth={2} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <Link href="/(auth)/check-in" style={styles.linkGold}>
              Ir a Check-In →
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomRule} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topRule: { height: 2, backgroundColor: colors.gold[400], opacity: 0.6 },
  bottomRule: { height: 1, backgroundColor: colors.gold[400], opacity: 0.3 },

  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(241,238,219,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
  },


  ticketBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(175,137,86,0.05)',
  },
  ticketLeft: {},
  ticketRight: { alignItems: 'flex-end' },
  ticketLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 9,
    letterSpacing: 2.5,
    color: colors.gold[400],
    textTransform: 'uppercase',
    marginBottom: 2,
    opacity: 0.8,
  },
  ticketDest: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.sm,
    color: colors.cream[100],
  },

  title: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.xxl,
    color: colors.cream[100],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  card: {
    backgroundColor: colors.cream[100],
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.gold[400],
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(241,238,219,0.6)',
    borderColor: colors.border.soft,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.ink[800],
    paddingVertical: 14,
  },
  cta: {
    backgroundColor: colors.burgundy[700],
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
  },
  ctaText: {
    fontFamily: fonts.bodySemibold,
    color: colors.cream[100],
    fontSize: fontSize.base,
    letterSpacing: 0.5,
  },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.burgundy[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.burgundy[700], borderColor: colors.burgundy[700] },
  termsText: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink[700], lineHeight: 20 },
  termsLink: { fontFamily: fonts.bodySemibold, color: colors.gold[400], textDecorationLine: 'underline' },
  legalNote: { fontFamily: fonts.body, fontSize: 12, color: colors.ink[500], lineHeight: 18 },
  error: { color: colors.state.error, textAlign: 'center', fontFamily: fonts.body, fontSize: fontSize.sm },

  footer: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs },
  footerText: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200] },
  linkGold: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.gold[400],
    letterSpacing: 1,
  },
});
