import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, Globe } from 'lucide-react-native';
import { saveReferralCode, captureAttribution } from '@/lib/attribution';
import { supabase } from '@/lib/supabase';
import { LOGO_WORDMARK_CENTERED_GOLD } from '@/constants/logos';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const { width: SW } = Dimensions.get('window');
const LOGO_W = Math.round(SW * 0.65);
const LOGO_H = Math.round(LOGO_W * 0.40);

const APP_STORE_URL = 'https://apps.apple.com/app/nextflight-academy/id6745891557';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.nextflightacademy';

function getDevicePlatform(): 'ios' | 'android' | 'other' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent ?? '';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (/android/i.test(ua)) return 'android';
  }
  return 'other';
}

export default function ReferralLanding() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const normalizedCode = (Array.isArray(code) ? code[0] : code ?? '').toUpperCase();

  useEffect(() => {
    if (!normalizedCode) return;
    saveReferralCode(normalizedCode).catch(() => {});

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        captureAttribution(normalizedCode, user.id);
      }
    });
  }, [normalizedCode]);

  const device = getDevicePlatform();

  const onDownload = () => {
    const url = device === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url);
  };

  const onWeb = () => {
    router.replace('/(auth)/sign-up');
  };

  return (
    <LinearGradient
      colors={['#30050E', '#4D0C12', '#30050E']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={LOGO_WORDMARK_CENTERED_GOLD}
              style={{ width: LOGO_W, height: LOGO_H }}
              resizeMode="contain"
            />
          </View>

          {/* Badge */}
          <View style={styles.inviteBadge}>
            <Text style={styles.inviteLabel}>INVITACIÓN PERSONAL</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Alguien te invitó{'\n'}a volar</Text>
          <Text style={styles.sub}>
            Únete a NextFlight Academy — la academia de emprendimiento digital para mujeres latinas.
            Tu mentora ya está esperándote adentro.
          </Text>

          {/* Code pill */}
          {normalizedCode ? (
            <View style={styles.codePill}>
              <Text style={styles.codeLabel}>CÓDIGO DE REFERIDO</Text>
              <Text style={styles.code}>{normalizedCode}</Text>
            </View>
          ) : null}

          {/* CTAs */}
          <View style={styles.actions}>
            {(device === 'ios' || device === 'android') ? (
              <TouchableOpacity style={styles.btnPrimary} onPress={onDownload} activeOpacity={0.85}>
                <Download size={18} color={colors.burgundy[900]} strokeWidth={2} />
                <Text style={styles.btnPrimaryText}>
                  {device === 'ios' ? 'Descargar en App Store' : 'Descargar en Play Store'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => Linking.openURL(APP_STORE_URL)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>App Store (iPhone)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => Linking.openURL(PLAY_STORE_URL)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnSecondaryText}>Google Play (Android)</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.btnWeb} onPress={onWeb} activeOpacity={0.8}>
              <Globe size={15} color={colors.cream[200]} strokeWidth={1.5} />
              <Text style={styles.btnWebText}>Continuar en el navegador</Text>
            </TouchableOpacity>
          </View>

          {/* Fine print */}
          <Text style={styles.fine}>
            Al registrarte, tu compra quedará atribuida a quien te invitó.{'\n'}
            La referencia se guarda por 30 días.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  logoWrap: { marginBottom: spacing.sm },
  inviteBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold[500],
    backgroundColor: 'rgba(175,137,86,0.10)',
  },
  inviteLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold[400],
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fonts.headingBold,
    fontSize: 38,
    color: colors.cream[50],
    textAlign: 'center',
    lineHeight: 46,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  codePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.30)',
    backgroundColor: 'rgba(175,137,86,0.08)',
    alignItems: 'center',
    gap: 4,
    marginVertical: spacing.sm,
  },
  codeLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 9,
    letterSpacing: 3,
    color: colors.gold[400],
    textTransform: 'uppercase',
  },
  code: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.xl,
    color: colors.cream[100],
    letterSpacing: 4,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.gold[400],
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  btnPrimaryText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.burgundy[900],
    letterSpacing: 0.5,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold[500],
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  btnSecondaryText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.gold[400],
    letterSpacing: 0.5,
  },
  btnWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  btnWebText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    textDecorationLine: 'underline',
  },
  fine: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.cream[200],
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.6,
    marginTop: spacing.sm,
  },
});
