import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { LOGO_PLANE_GOLD_GRAD, LOGO_WORDMARK_CENTERED_GOLD } from '@/constants/logos';

const { width: SW } = Dimensions.get('window');
const PLANE   = Math.round(SW * 0.14);
const RING    = Math.round(PLANE * 1.5);
const WM_W    = SW;
const WM_H    = Math.round(WM_W * 0.52);
const OVERLAP = Math.round(PLANE * 0.12);

export default function Recover() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);
    if (error) setError(error.message);
    else setMessage('Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.');
  };

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[700]]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ChevronLeft color={colors.cream[100]} size={22} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

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

        <Text style={styles.title}>Recuperar acceso</Text>
        <Text style={styles.subtitle}>
          Te enviaremos un enlace seguro para que recuperes tu cabina.
        </Text>

        <View style={styles.card}>
          <View style={styles.field}>
            <Mail size={16} color={colors.burgundy[700]} />
            <TextInput
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.ink[300]}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <TouchableOpacity style={styles.cta} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.cream[100]} /> : <Text style={styles.ctaText}>Enviar enlace</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backText: { color: colors.cream[100], fontFamily: fonts.body, fontSize: fontSize.sm },
  title: { fontFamily: fonts.headingItalic, fontSize: fontSize.xxl, color: colors.cream[100], textAlign: 'center', marginTop: spacing.md },
  subtitle: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  card: { backgroundColor: colors.cream[100], borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.cream[50], borderColor: colors.border.soft, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md },
  input: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.base, color: colors.ink[800], paddingVertical: 14 },
  cta: { backgroundColor: colors.burgundy[800], borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.base, letterSpacing: 0.5 },
  error: { color: colors.state.error, textAlign: 'center', fontFamily: fonts.body, fontSize: fontSize.sm },
  success: { color: colors.state.success, textAlign: 'center', fontFamily: fonts.body, fontSize: fontSize.sm },
});
