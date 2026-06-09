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
import { Link, useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  HERO_BACKGROUND,
  LOGO_PLANE_GOLD_GRAD,
  LOGO_WORDMARK_CENTERED_GOLD,
} from '@/constants/logos';

const { width: SW, height: SH } = Dimensions.get('window');
const HERO_H = Math.round(SH * 0.30);

// Avión: más grande, sin círculo
const PLANE   = Math.round(SW * 0.22);
// Wordmark: protagonista
const WM_W    = SW;
const WM_H    = Math.round(WM_W * 0.52);
// Overlap agresivo para pegar avión y wordmark
const OVERLAP = Math.round(PLANE * 0.55);

export default function CheckIn() {
  const router  = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: authError } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (authError) setError(authError);
    else router.replace('/');
  };

  return (
    <View style={styles.root}>

      <View style={[styles.heroBg, { height: HERO_H }]} pointerEvents="none">
        <Image source={HERO_BACKGROUND} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={StyleSheet.absoluteFill}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: HERO_H + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Avión sin círculo ── */}
          <Image
            source={LOGO_PLANE_GOLD_GRAD}
            style={{ width: PLANE, height: PLANE, marginBottom: -OVERLAP }}
            resizeMode="contain"
          />

          {/* ── Wordmark NEXTFLIGHT / ACADEMY — protagonista ── */}
          <Image
            source={LOGO_WORDMARK_CENTERED_GOLD}
            style={{ width: WM_W, height: WM_H }}
            resizeMode="contain"
          />

          {/* ── Headline ── */}
          <Text style={styles.headline}>Bienvenida a bordo</Text>
          <Text style={styles.subtitle}>
            Tu asiento te espera. Inicia tu Check-In{'\n'}para acceder a la cabina.
          </Text>

          {/* ── Card ── */}
          <View style={styles.card}>
            <View style={styles.field}>
              <Mail size={20} color="#8A1A2C" strokeWidth={1.5} />
              <TextInput
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#9A7880"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Lock size={20} color="#8A1A2C" strokeWidth={1.5} />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#9A7880"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>

            {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.cta, loading && { opacity: 0.65 }]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#F1EEDB" />
                : <Text style={styles.ctaText}>Hacer Check-In</Text>}
            </TouchableOpacity>

            <Link href="/(auth)/recover" style={styles.forgot}>
              ¿Olvidaste tu contraseña?
            </Link>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerLabel}>¿Primer vuelo con nosotros?</Text>
            <Link href="/(auth)/sign-up" style={styles.footerLink}>
              Reserva tu asiento
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#30050E' },

  heroBg: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    overflow: 'hidden',
  },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
  },

  headline: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 26,
    color: '#F1EEDB',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#C9B89A',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },

  card: {
    width: '100%',
    backgroundColor: '#FDFCF5',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    marginBottom: 18,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F1EEDB',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0DBC3',
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#1E0810',
    paddingVertical: 16,
  },
  cta: {
    backgroundColor: '#4D0C12',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#F1EEDB',
    letterSpacing: 0.2,
  },
  forgot: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#70041D',
    textAlign: 'center',
  },
  errorMsg: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#70041D',
    textAlign: 'center',
  },

  footer: { alignItems: 'center', gap: 4 },
  footerLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#E0DBC3',
  },
  footerLink: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#AF8956',
  },
});
