import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Mail } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { LOGO_WORDMARK_CENTERED_CREAM, LOGO_SEAL_GOLD } from '@/constants/logos';

const { width: SW } = Dimensions.get('window');
const WM_W = Math.round(SW * 0.58);
const WM_H = Math.round(WM_W * 0.40);
const WM_ML = Math.round(WM_W * -0.30);

async function getSystemSettingText(key: string): Promise<string> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (!data) return '';
  const raw = data.value;
  if (!raw) return '';
  // jsonb string comes as JS string already deserialized by supabase-js
  if (typeof raw === 'string') return raw;
  // jsonb was a JSON-encoded string: "\"actual text\""
  if (typeof raw === 'object') return JSON.stringify(raw);
  try { return JSON.parse(String(raw)); } catch { return String(raw); }
}

type BlockType = 'main-heading' | 'section-heading' | 'bullet' | 'paragraph' | 'warning' | 'divider';

function classifyBlock(text: string): BlockType {
  const t = text.trim();
  if (!t || t === '---' || t === '***') return 'divider';

  // All-caps long string without lowercase = main heading
  if (
    t === t.toUpperCase() &&
    t.length >= 10 &&
    !t.startsWith('●') && !t.startsWith('•') && !t.startsWith('○') &&
    !/[a-z]/.test(t) &&
    !t.includes('@')
  ) return 'main-heading';

  // Numbered section heading: "1." or "1.1."
  if (/^\d+[\d.]*[\s.]\s+/.test(t)) return 'section-heading';

  // Bullet
  if (t.startsWith('●') || t.startsWith('•') || t.startsWith('○') || /^-\s/.test(t)) return 'bullet';

  // Warning / important block
  if (
    t.startsWith('⚠') ||
    /^(IMPORTANT|AVISO IMPORTANTE|ADVERTENCIA|NOTE:|NOTA:|WARNING:)/i.test(t)
  ) return 'warning';

  return 'paragraph';
}

function LegalBlock({ text }: { text: string }) {
  const t = text.trim();
  if (!t) return null;
  const type = classifyBlock(t);

  if (type === 'divider') {
    return <View style={styles.divider} />;
  }

  if (type === 'main-heading') {
    return (
      <View style={styles.mainHeadingWrap}>
        <View style={styles.mainHeadingLine} />
        <Text style={styles.mainHeading}>{t}</Text>
        <View style={styles.mainHeadingLine} />
      </View>
    );
  }

  if (type === 'section-heading') {
    return (
      <View style={styles.sectionWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionHeading}>{t}</Text>
      </View>
    );
  }

  if (type === 'bullet') {
    const body = t.replace(/^[●•○-]\s*/, '');
    return (
      <View style={styles.bulletRow}>
        <View style={styles.bulletDotWrap}>
          <View style={styles.bulletDot} />
        </View>
        <Text style={styles.bulletText}>{body}</Text>
      </View>
    );
  }

  if (type === 'warning') {
    return (
      <View style={styles.warningBlock}>
        <View style={styles.warningAccent} />
        <Text style={styles.warningText}>{t}</Text>
      </View>
    );
  }

  return <Text style={styles.paragraph}>{t}</Text>;
}

function LegalContent({ content }: { content: string }) {
  const blocks = content.split(/\n+/).filter((b) => b.trim().length > 0);
  return (
    <View style={{ gap: 8 }}>
      {blocks.map((block, i) => (
        <LegalBlock key={i} text={block} />
      ))}
    </View>
  );
}

interface LegalPageProps {
  settingsKey: string;
  title: string;
  subtitle?: string;
  version?: string;
  crumb?: string;
}

export function LegalPage({
  settingsKey,
  title,
  subtitle,
  version,
  crumb = 'Documentos Legales',
}: LegalPageProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemSettingText(settingsKey).then((text) => {
      setContent(text);
      setLoading(false);
    });
  }, [settingsKey]);

  return (
    <LinearGradient
      colors={[colors.burgundy[900], '#1A030A', colors.burgundy[800]]}
      locations={[0, 0.4, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={20} color={colors.cream[100]} strokeWidth={2} />
          </TouchableOpacity>
          <Image
            source={LOGO_WORDMARK_CENTERED_CREAM}
            style={{ width: WM_W, height: WM_H, marginLeft: WM_ML }}
            resizeMode="contain"
          />
          <View style={{ width: 40 }} />
        </View>

        {/* ── Gold rule ── */}
        <View style={styles.topRule} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <FileText size={22} color={colors.gold[400]} strokeWidth={1.5} />
            </View>
            <Text style={styles.crumbText}>{crumb.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>{title}</Text>
            {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
            {version ? (
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>{version}</Text>
              </View>
            ) : null}
            <View style={styles.heroDivider}>
              <View style={styles.heroDividerLine} />
              <View style={styles.heroDividerDiamond} />
              <View style={styles.heroDividerLine} />
            </View>
          </View>

          {/* ── Content ── */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.gold[400]} size="large" />
              <Text style={styles.loadingText}>Cargando documento...</Text>
            </View>
          ) : content ? (
            <View style={styles.contentCard}>
              <LegalContent content={content} />
            </View>
          ) : (
            <View style={styles.contentCard}>
              <Text style={styles.emptyText}>
                El contenido de este documento sera proporcionado por el equipo legal de NextFlight Academy.
                {'\n\n'}Contacta: soporte@nextflightacademy.com
              </Text>
            </View>
          )}

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.footerRule} />
            <Image
              source={LOGO_SEAL_GOLD}
              style={{ width: 56, height: 56, alignSelf: 'center' }}
              resizeMode="contain"
            />
            <Text style={styles.footerBrand}>NEXTFLIGHT ACADEMY</Text>
            <View style={styles.footerContactRow}>
              <Mail size={12} color={colors.gold[400]} strokeWidth={1.5} />
              <Text style={styles.footerContact}>soporte@nextflightacademy.com</Text>
            </View>
            <Text style={styles.footerJurisdiction}>
              Ley aplicable: Estado de Texas, EE.UU. · Condado de Harris
            </Text>
            {version ? <Text style={styles.footerVersion}>{version}</Text> : null}
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,251,224,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.25)',
  },
  topRule: {
    height: 1,
    backgroundColor: colors.gold[400],
    opacity: 0.35,
    marginHorizontal: spacing.lg,
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(175,137,86,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  crumbText: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold[400],
    marginBottom: spacing.sm,
    opacity: 0.85,
  },
  heroTitle: {
    fontFamily: fonts.headingItalic,
    fontSize: fontSize.xxl,
    color: colors.cream[100],
    textAlign: 'center',
    lineHeight: fontSize.xxl * 1.2,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  versionBadge: {
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.4)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(175,137,86,0.08)',
    marginTop: spacing.xs,
  },
  versionText: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    color: colors.gold[300],
    letterSpacing: 1,
  },
  heroDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '60%',
  },
  heroDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gold[400],
    opacity: 0.4,
  },
  heroDividerDiamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: colors.gold[400],
    transform: [{ rotate: '45deg' }],
    opacity: 0.7,
  },

  // ── Content card ──
  contentCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,251,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(194,160,107,0.18)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  // ── Block types ──
  mainHeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  mainHeadingLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gold[400],
    opacity: 0.3,
  },
  mainHeading: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.xs,
    color: colors.gold[300],
    letterSpacing: 2,
    textAlign: 'center',
  },
  sectionWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.gold[400],
    alignSelf: 'stretch',
    minHeight: 16,
    opacity: 0.7,
    marginTop: 2,
  },
  sectionHeading: {
    flex: 1,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.gold[200],
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: spacing.sm,
  },
  bulletDotWrap: {
    paddingTop: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold[400],
    opacity: 0.75,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    lineHeight: 21,
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    lineHeight: 22,
    opacity: 0.92,
  },
  warningBlock: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(175,137,86,0.10)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.35)',
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  warningAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.gold[400],
    alignSelf: 'stretch',
  },
  warningText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gold[400],
    opacity: 0.2,
    marginVertical: spacing.sm,
  },

  // ── Loading & empty ──
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.7,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.7,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerRule: {
    height: 1,
    width: '40%',
    backgroundColor: colors.gold[400],
    opacity: 0.25,
    marginBottom: spacing.md,
  },
  footerBrand: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold[400],
    opacity: 0.75,
    marginTop: spacing.xs,
  },
  footerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerContact: {
    fontFamily: fonts.support,
    fontSize: 11,
    color: colors.cream[200],
    opacity: 0.65,
  },
  footerJurisdiction: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.cream[300],
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 4,
  },
  footerVersion: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.gold[400],
    opacity: 0.45,
    marginTop: 2,
  },
});

export default LegalPage;
