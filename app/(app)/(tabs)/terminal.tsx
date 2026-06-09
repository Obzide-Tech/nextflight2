import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowRight, Bell, GraduationCap, Users, Megaphone, Globe, TrendingUp, LogOut, ShoppingBag,
  Wallet, Copy,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  fetchEnrolledProgramsWithProgress,
  fetchModulesWithLessons,
  fetchWeeklyProgress,
  type WeeklyProgress,
} from '@/lib/data';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { LOGO_WORDMARK_CENTERED_GOLD } from '@/constants/logos';

const { width: SW } = Dimensions.get('window');

const HEADER_LOGO_W = Math.round(SW * 0.72);
const HEADER_LOGO_H = Math.round(HEADER_LOGO_W * 0.40);
const HEADER_LOGO_ML = Math.round(HEADER_LOGO_W * -0.30);

const APP_BASE_URL =
  process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://nextflight.app';

// ─── Affiliate-only terminal ──────────────────────────────────────────────────

function AffiliateTerminal() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const name = profile?.full_name?.split(' ')[0] ?? 'Copilota';
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [link, setLink] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [wallet, setWallet] = useState({ available: 0, pending: 0, paid: 0 });
  const [referralsCount, setReferralsCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('app_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)
      .then(({ count }) => setUnreadCount(count ?? 0))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: links }, { data: balance }, { count: refs }, { count: sales }] = await Promise.all([
        supabase.from('affiliate_links').select('code').eq('affiliate_user_id', user.id).eq('is_active', true).limit(1),
        supabase.from('wallet_balances').select('*').eq('affiliate_user_id', user.id).maybeSingle(),
        supabase.from('referral_attributions').select('id', { count: 'exact', head: true }).eq('affiliate_user_id', user.id),
        supabase.from('payment_transactions').select('id', { count: 'exact', head: true }).eq('affiliate_user_id', user.id).eq('status', 'confirmed'),
      ]);
      const c = links?.[0]?.code ?? null;
      setCode(c);
      setLink(c ? `${APP_BASE_URL}/r/${c}` : null);
      setWallet({
        available: Number(balance?.available_usd ?? 0),
        pending: Number(balance?.pending_usd ?? 0),
        paid: Number(balance?.paid_usd ?? 0),
      });
      setReferralsCount(refs ?? 0);
      setSalesCount(sales ?? 0);
      setLoading(false);
    })();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const onCopy = async () => {
    if (!link) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const conversion = referralsCount > 0 ? Math.round((salesCount / referralsCount) * 100) : 0;
  const canPayout = wallet.available >= 50;

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={LOGO_WORDMARK_CENTERED_GOLD}
            style={{ width: HEADER_LOGO_W, height: HEADER_LOGO_H, marginLeft: HEADER_LOGO_ML }}
            resizeMode="contain"
          />
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellWrap} onPress={() => router.push('/(app)/notifications')}>
              <Bell size={22} color={colors.gold[400]} strokeWidth={1.5} />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellNum}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
              <LogOut size={20} color="#E0DBC3" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Greeting */}
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetName}>Hola, {name}</Text>
              <Text style={styles.greetSub}>
                Bienvenida a tu cabina de copilota.{'\n'}Comparte tu enlace, sigue tus referidos{'\n'}y solicita tus retiros en USD.
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.gold[400]} style={{ marginVertical: spacing.xl }} />
          ) : (
            <>
              {/* Balance card */}
              <View style={styles.affiliateBalanceCard}>
                <Text style={styles.affiliateBalanceEye}>SALDO DISPONIBLE</Text>
                <Text style={styles.affiliateBalanceAmt}>
                  $ {wallet.available.toFixed(2)} <Text style={styles.affiliateBalanceCcy}>USD</Text>
                </Text>
                <View style={styles.affiliateBalanceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Pendiente</Text>
                    <Text style={styles.miniValue}>$ {wallet.pending.toFixed(2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Pagado</Text>
                    <Text style={styles.miniValue}>$ {wallet.paid.toFixed(2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniLabel}>Conversión</Text>
                    <Text style={styles.miniValue}>{conversion}%</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.affiliatePayoutBtn, !canPayout && { opacity: 0.5 }]}
                  disabled={!canPayout}
                  onPress={() => router.push('/(app)/payout-request')}
                >
                  <Wallet size={16} color={colors.burgundy[900]} strokeWidth={1.6} />
                  <Text style={styles.affiliatePayoutTxt}>
                    {canPayout ? 'Solicitar retiro' : 'Mínimo $50 USD para retirar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{referralsCount}</Text>
                  <Text style={styles.statLbl}>Referidos</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{salesCount}</Text>
                  <Text style={styles.statLbl}>Ventas</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{conversion}%</Text>
                  <Text style={styles.statLbl}>Conversión</Text>
                </View>
              </View>

              {/* Referral link */}
              {link ? (
                <>
                  <Text style={styles.sectionLabel}>TU ENLACE PERSONAL</Text>
                  <View style={styles.linkRow}>
                    <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
                    <TouchableOpacity style={styles.copyBtn} onPress={onCopy}>
                      <Copy size={16} color={colors.gold[400]} strokeWidth={1.6} />
                    </TouchableOpacity>
                  </View>
                  {code ? (
                    <View style={styles.codeRow}>
                      <Text style={styles.codeLbl}>Código: </Text>
                      <Text style={styles.codeVal}>{code}</Text>
                      {copied ? <Text style={styles.copiedTxt}>Copiado</Text> : null}
                    </View>
                  ) : null}
                </>
              ) : null}

              {/* Quick access */}
              <Text style={styles.sectionLabel}>ACCESOS RÁPIDOS</Text>
              <View style={styles.tilesRow}>
                <QuickTile icon={<Users size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="Copilotos" onPress={() => router.push('/(app)/(tabs)/copilotos')} />
                <QuickTile icon={<TrendingUp size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="Mi red" onPress={() => router.push('/(app)/network')} />
                <QuickTile icon={<Megaphone size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="Anuncios" onPress={() => router.push('/(app)/(tabs)/bitacora')} />
                <QuickTile icon={<Globe size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="Mi cuenta" onPress={() => router.push('/(app)/(tabs)/aduana')} />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Student terminal ─────────────────────────────────────────────────────────

export default function Terminal() {
  const router = useRouter();
  const { user, profile, roles, signOut } = useAuth();
  const isStudent = roles.includes('student_free') || roles.includes('student_premium');

  if (!isStudent) return <AffiliateTerminal />;

  const name = profile?.full_name?.split(' ')[0] ?? 'Pasajera';
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [program, setProgram] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextLesson, setNextLesson] = useState<{
    title: string; moduleTitle: string; moduleIndex: number; lessonIndex: number;
  } | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [weekly, setWeekly] = useState<WeeklyProgress[]>([]);
  const [storeEnabled, setStoreEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('app_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)
      .then(({ count }) => setUnreadCount(count ?? 0))
      .catch(() => {});
  }, [user?.id]);

  const loadProgress = useCallback(async () => {
    if (!user || !program) return;
    const mods = await fetchModulesWithLessons(program.id);
    const allLessons = mods.flatMap((m, mi) =>
      m.lessons.map((l, li) => ({
        id: l.id, title: l.title,
        moduleTitle: m.title, moduleIndex: mi + 1, lessonIndex: li + 1,
      }))
    );
    if (!allLessons.length) return;
    const { data: completed } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .in('lesson_id', allLessons.map((l) => l.id));
    const completedSet = new Set((completed ?? []).map((r: any) => r.lesson_id));
    setProgressPct(Math.round((completedSet.size / allLessons.length) * 100));
    const next = allLessons.find((l) => !completedSet.has(l.id)) ?? allLessons[0];
    setNextLesson(next);
  }, [user?.id, program?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [loadProgress])
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const programs = await fetchEnrolledProgramsWithProgress(user.id);
        const current = programs[0] ?? null;
        setProgram(current);

        if (current) {
          const mods = await fetchModulesWithLessons(current.id);
          const allLessons = mods.flatMap((m, mi) =>
            m.lessons.map((l, li) => ({
              id: l.id, title: l.title,
              moduleTitle: m.title, moduleIndex: mi + 1, lessonIndex: li + 1,
            }))
          );
          if (allLessons.length) {
            const { data: completed } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', user.id)
              .eq('completed', true)
              .in('lesson_id', allLessons.map((l) => l.id));
            const completedSet = new Set((completed ?? []).map((r: any) => r.lesson_id));
            setProgressPct(Math.round((completedSet.size / allLessons.length) * 100));
            const next = allLessons.find((l) => !completedSet.has(l.id)) ?? allLessons[0];
            setNextLesson(next);
          }
        }

        const week = await fetchWeeklyProgress(user.id);
        setWeekly(week);

        supabase
          .from('feature_flags')
          .select('value')
          .eq('key', 'store_enabled')
          .maybeSingle()
          .then(({ data }) => setStoreEnabled(data?.value === true || data?.value === 'true'));
      } catch {
        setLoadError(true);
      }
      setLoading(false);
    })();
  }, [user?.id, retryCount]);

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Image
            source={LOGO_WORDMARK_CENTERED_GOLD}
            style={{ width: HEADER_LOGO_W, height: HEADER_LOGO_H, marginLeft: HEADER_LOGO_ML }}
            resizeMode="contain"
          />
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellWrap} onPress={() => router.push('/(app)/notifications')}>
              <Bell size={22} color={colors.gold[400]} strokeWidth={1.5} />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellNum}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
              <LogOut size={20} color="#E0DBC3" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Greeting ── */}
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetName}>Hola, {name}</Text>
              <Text style={styles.greetSub}>
                Bienvenida a tu cabina. Aquí encuentras{'\n'}tu próximo vuelo, tus lecciones y los{'\n'}anuncios del comandante.
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.gold[400]} style={{ marginVertical: spacing.xl }} />
          ) : loadError ? (
            <View style={styles.errorState}>
              <Text style={styles.errorStateText}>No se pudo cargar tu cabina.</Text>
              <TouchableOpacity style={styles.errorStateBtn} onPress={() => { setLoadError(false); setRetryCount((c) => c + 1); }}>
                <Text style={styles.errorStateBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── Hero card ── */}
              <View style={styles.heroCard}>
                <Image
                  source={Platform.OS === 'web'
                    ? { uri: '/dashboard-flight-window.webp' }
                    : require('../../../public/dashboard-flight-window.webp')}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.heroOverlay} />
                <View style={styles.heroBody}>
                  <View style={styles.heroTopRow}>
                    <Text style={styles.heroEyebrow}>PRÓXIMO VUELO</Text>
                    <View style={styles.pctBox}>
                      <Text style={styles.pctTxt}>{progressPct}%</Text>
                    </View>
                  </View>
                  <Text style={styles.heroTitle}>Next Flight{'\n'}Academy</Text>
                  {nextLesson ? (
                    <Text style={styles.heroMeta}>
                      MÓDULO {nextLesson.moduleIndex} · LECCIÓN {nextLesson.lessonIndex}{'\n'}
                      {nextLesson.title.toUpperCase()}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.heroCta}
                    onPress={() => router.push(program ? '/(app)/(tabs)/cursos' : '/(app)/(tabs)/aduana')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.heroCtaTxt}>{program ? 'Continuar vuelo' : 'Ir a La Aduana'}</Text>
                    <ArrowRight size={16} color={colors.burgundy[700]} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Progress ── */}
              <View style={styles.progressCard}>
                <View style={styles.progressIcon}>
                  <TrendingUp size={22} color={colors.gold[400]} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.progressLabel}>MI PROGRESO</Text>
                  <Text style={styles.progressSub}>Últimos 7 días</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(progressPct, 100)}%` as any }]} />
                  </View>
                </View>
                <Text style={styles.progressPct}>{progressPct}%</Text>
              </View>

              {/* ── Store Banner ── */}
              {storeEnabled ? (
                <TouchableOpacity
                  style={styles.storeBanner}
                  onPress={() => router.push('/(app)/store' as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.storeBannerIcon}>
                    <ShoppingBag size={26} color={colors.gold[400]} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeBannerEye}>NUEVA SECCIÓN</Text>
                    <Text style={styles.storeBannerTitle}>Tienda NextFlight</Text>
                    <Text style={styles.storeBannerSub}>Descubre merch, servicios y más.</Text>
                  </View>
                  <ArrowRight size={18} color={colors.gold[400]} strokeWidth={2} />
                </TouchableOpacity>
              ) : null}

              {/* ── Quick access ── */}
              <Text style={styles.sectionLabel}>ACCESOS RÁPIDOS</Text>
              <View style={styles.tilesRow}>
                <QuickTile icon={<GraduationCap size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="Lecciones" onPress={() => router.push('/(app)/(tabs)/cursos')} />
                <QuickTile icon={<Users size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="Copilotos" onPress={() => router.push('/(app)/(tabs)/copilotos')} />
                <QuickTile icon={<Megaphone size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="Anuncios" onPress={() => router.push('/(app)/(tabs)/bitacora')} />
                <QuickTile icon={<Globe size={28} color={colors.gold[400]} strokeWidth={1.5} />} label="La Aduana" onPress={() => router.push('/(app)/(tabs)/aduana')} />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function QuickTile({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#30050E' },

  errorState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  errorStateText: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.sm, textAlign: 'center' },
  errorStateBtn: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(175,137,86,0.4)' },
  errorStateBtnText: { fontFamily: fonts.bodySemibold, color: colors.gold[400], fontSize: fontSize.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bellWrap: { position: 'relative', padding: 6 },
  logoutBtn: { padding: 6 },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.gold[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellNum: { fontFamily: fonts.bodySemibold, fontSize: 9, color: '#30050E' },

  content: { paddingHorizontal: 20, paddingBottom: 100 },

  greetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
    paddingTop: 8,
  },
  greetName: {
    fontFamily: fonts.headingBold,
    fontSize: 36,
    color: '#F1EEDB',
    marginBottom: 6,
    lineHeight: 42,
  },
  greetSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#E0DBC3',
    lineHeight: 20,
  },

  // ─── Affiliate balance card ───
  affiliateBalanceCard: {
    backgroundColor: 'rgba(175,137,86,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.35)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  affiliateBalanceEye: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold[400],
    textTransform: 'uppercase' as any,
    marginBottom: 4,
  },
  affiliateBalanceAmt: {
    fontFamily: fonts.headingBold,
    fontSize: 42,
    color: colors.cream[50],
    lineHeight: 50,
  },
  affiliateBalanceCcy: {
    fontFamily: fonts.support,
    fontSize: 18,
    color: colors.cream[200],
  },
  affiliateBalanceRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,251,224,0.10)',
    gap: 8,
  },
  affiliatePayoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    justifyContent: 'center',
    marginTop: 16,
  },
  affiliatePayoutTxt: {
    fontFamily: fonts.bodySemibold,
    color: colors.burgundy[900],
    fontSize: fontSize.sm,
    letterSpacing: 0.4,
  },
  miniLabel: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.cream[200],
    textTransform: 'uppercase' as any,
    letterSpacing: 1,
  },
  miniValue: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    marginTop: 2,
  },

  // ─── Stats row ───
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,251,224,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,251,224,0.10)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.xl,
    color: colors.cream[100],
  },
  statLbl: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.cream[200],
    letterSpacing: 1,
    textTransform: 'uppercase' as any,
  },

  // ─── Link ───
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,251,224,0.06)',
    borderColor: 'rgba(255,251,224,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  linkText: {
    flex: 1,
    fontFamily: fonts.support,
    fontSize: 12,
    color: colors.cream[100],
    letterSpacing: 0.3,
  },
  copyBtn: { padding: 6 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  codeLbl: {
    fontFamily: fonts.support,
    fontSize: 12,
    color: colors.cream[200],
  },
  codeVal: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.gold[400],
    letterSpacing: 1,
  },
  copiedTxt: {
    fontFamily: fonts.support,
    fontSize: 11,
    color: '#6BB885',
    marginLeft: 6,
  },

  // ─── Hero card ───
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 280,
    marginBottom: 14,
    backgroundColor: '#4D0C12',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,2,8,0.62)',
  },
  heroBody: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroEyebrow: {
    fontFamily: fonts.supportMedium,
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.cream[100],
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  pctBox: {
    backgroundColor: 'rgba(20,2,8,0.70)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
  },
  pctTxt: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.cream[100] },
  heroTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 34,
    color: colors.cream[50],
    lineHeight: 40,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroMeta: {
    fontFamily: fonts.supportMedium,
    fontSize: 11,
    color: colors.cream[100],
    letterSpacing: 0.8,
    lineHeight: 17,
    marginBottom: 14,
    opacity: 0.9,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.cream[100],
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
  },
  heroCtaTxt: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.burgundy[700] },

  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(175,137,86,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.20)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  progressIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(175,137,86,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: '#F1EEDB',
    marginBottom: 2,
  },
  progressSub: { fontFamily: fonts.body, fontSize: 12, color: '#E0DBC3', marginBottom: 6 },
  track: { height: 4, backgroundColor: 'rgba(255,251,224,0.15)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: '#8A1A2C' },
  progressPct: { fontFamily: fonts.bodySemibold, fontSize: 22, color: '#F1EEDB' },

  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(175,137,86,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.30)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  storeBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(175,137,86,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBannerEye: {
    fontFamily: fonts.support,
    fontSize: 9,
    letterSpacing: 2.5,
    color: colors.gold[400],
    textTransform: 'uppercase' as any,
    marginBottom: 2,
  },
  storeBannerTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.base,
    color: colors.cream[100],
    lineHeight: 21,
  },
  storeBannerSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.cream[200],
    marginTop: 1,
  },

  sectionLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.cream[100],
    marginBottom: 12,
  },

  tilesRow: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(175,137,86,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.22)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
  },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(175,137,86,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.cream[100],
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
