import { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Plane, Compass, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { LOGO_WORDMARK_CENTERED_GOLD } from '@/constants/logos';
import { BrandMark } from '@/components/BrandMark';

const { width } = Dimensions.get('window');

const slides = [
  {
    Icon: Plane,
    eyebrow: 'Bienvenida a bordo',
    title: 'Tu cabina personal de aprendizaje',
    body: 'En La Terminal verás siempre tu próximo vuelo, tu progreso y los anuncios del comandante. Todo en un solo lugar.',
    dest: 'NFA',
    gate: 'G-01',
  },
  {
    Icon: Compass,
    eyebrow: 'En Vuelo',
    title: 'Lecciones, recursos y notas privadas',
    body: 'Cada lección guarda tu progreso, te deja descargar recursos y mantiene tu Bitácora privada sincronizada en todos tus dispositivos.',
    dest: 'LEARN',
    gate: 'G-02',
  },
  {
    Icon: Sparkles,
    eyebrow: 'Sección de Copilotos',
    title: 'Construye tu propia red',
    body: 'Activa tu cabina de afiliada cuando quieras. Recibe tu enlace, suma comisiones y solicita retiros desde la misma app.',
    dest: 'INCOME',
    gate: 'G-03',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [completing, setCompleting] = useState(false);

  const onNext = async () => {
    if (index < slides.length - 1) {
      const next = index + 1;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      return;
    }
    await complete();
  };

  const complete = async () => {
    setCompleting(true);
    if (user) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, onboarded_at: new Date().toISOString() });
      if (error) {
        setCompleting(false);
        return;
      }
      await refresh();
    }
    router.replace('/(app)/(tabs)/terminal');
  };

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[800]]} style={{ flex: 1 }}>
      <View style={styles.topRule} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>

        {/* ── Skip bar with wordmark ── */}
        <View style={styles.skipBar}>
          <Image
            source={LOGO_WORDMARK_CENTERED_GOLD}
            style={{ width: Math.round(width * 0.55), height: Math.round(width * 0.55 * 0.35) }}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={complete} disabled={completing} style={styles.skipBtn}>
            <Text style={styles.skip}>OMITIR</Text>
          </TouchableOpacity>
        </View>

        {/* ── Slide pager ── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          {slides.map((s, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              {/* Boarding gate badge */}
              <View style={styles.gateBadge}>
                <Text style={styles.gateLabel}>GATE</Text>
                <Text style={styles.gateValue}>{s.gate}</Text>
                <View style={styles.gateDivider} />
                <Text style={styles.gateLabel}>DEST</Text>
                <Text style={styles.gateValue}>{s.dest}</Text>
              </View>

              {/* Icon in branded circle */}
              <View style={styles.iconRing}>
                <View style={styles.iconRingInner}>
                  <s.Icon size={38} color={colors.gold[400]} strokeWidth={1.2} />
                </View>
              </View>

              <Text style={styles.eyebrow}>{s.eyebrow}</Text>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>

              {/* Decorative gold rule */}
              <View style={styles.rule} />
            </View>
          ))}
        </ScrollView>

        {/* ── Dots ── */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {/* ── Seal + CTA ── */}
        <View style={styles.ctaWrap}>
          <View style={styles.sealRow}>
            <BrandMark variant="seal" theme="light" size={60} />
          </View>
          <TouchableOpacity style={styles.cta} onPress={onNext} disabled={completing} activeOpacity={0.88}>
            <Text style={styles.ctaText}>{index === slides.length - 1 ? 'Empezar a volar' : 'Siguiente'}</Text>
            <ArrowRight size={16} color={colors.burgundy[900]} strokeWidth={2} />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
      <View style={styles.bottomRule} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topRule: { height: 2, backgroundColor: colors.gold[400], opacity: 0.6 },
  bottomRule: { height: 1, backgroundColor: colors.gold[400], opacity: 0.3 },

  skipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  skipBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
    borderRadius: radius.sm,
  },
  skip: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.cream[200],
    textTransform: 'uppercase',
  },

  slide: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },

  gateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(175,137,86,0.05)',
  },
  gateLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.gold[400],
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  gateValue: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.sm,
    color: colors.cream[100],
  },
  gateDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(175,137,86,0.3)',
  },

  iconRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(175,137,86,0.04)',
  },
  iconRingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.gold[600],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(175,137,86,0.12)',
  },

  eyebrow: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 3.5,
    color: colors.gold[400],
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  title: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.xxl,
    color: colors.cream[100],
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.cream[200],
    lineHeight: 24,
    textAlign: 'center',
  },
  rule: {
    width: 48,
    height: 1,
    backgroundColor: colors.gold[400],
    opacity: 0.35,
    marginTop: spacing.xl,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,251,224,0.2)',
  },
  dotActive: {
    backgroundColor: colors.gold[400],
    width: 24,
    borderRadius: 4,
  },

  ctaWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  sealRow: {
    alignItems: 'center',
    opacity: 0.55,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold[400],
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  ctaText: {
    fontFamily: fonts.bodySemibold,
    color: colors.burgundy[900],
    fontSize: fontSize.base,
    letterSpacing: 0.5,
  },
});
