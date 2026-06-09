import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { useFocusEffect } from 'expo-router';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleCheck as CheckCircle2,
  Clock,
  Lock,
  Play,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  fetchEnrolledProgramsWithProgress,
  fetchModulesWithLessons,
  type ModuleWithLessons,
  type Program,
} from '@/lib/data';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasVideo(l: { video_storage_path?: string | null; video_external_url?: string | null }) {
  return !!(l.video_storage_path || l.video_external_url);
}

function fmtDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.round(seconds / 60);
  if (m < 1) return '< 1 min';
  return `${m} min`;
}

function getLessonTypeLabel(l: {
  video_storage_path?: string | null;
  video_external_url?: string | null;
  is_free?: boolean;
}): { label: string; isVideo: boolean } {
  if (hasVideo(l)) return { label: 'VIDEO', isVideo: true };
  return { label: 'LECTURA', isVideo: false };
}

// ─── Collapsible module block ─────────────────────────────────────────────────

function ModuleBlock({
  mod,
  index,
  completedIds,
  isPremium,
  programTier,
  onLessonPress,
  initiallyExpanded,
  scrollRef,
  blockOffset,
}: {
  mod: ModuleWithLessons;
  index: number;
  completedIds: Set<string>;
  isPremium: boolean;
  programTier: 'free' | 'premium';
  onLessonPress: (id: string) => void;
  initiallyExpanded: boolean;
  scrollRef: React.RefObject<ScrollView | null>;
  blockOffset: number;
}) {
  const completedCount = mod.lessons.filter((l) => completedIds.has(l.id)).length;
  const total = mod.lessons.length;
  const allDone = completedCount === total && total > 0;

  const [collapsed, setCollapsed] = useState(!initiallyExpanded);
  const animRef = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;
  const blockRef = useRef<View>(null);

  // Auto-scroll to active module on first render
  useEffect(() => {
    if (initiallyExpanded && blockOffset > 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: blockOffset, animated: true });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [initiallyExpanded, blockOffset]);

  const toggle = () => {
    const toValue = collapsed ? 1 : 0;
    Animated.timing(animRef, {
      toValue,
      duration: 240,
      useNativeDriver: false,
    }).start();
    setCollapsed(!collapsed);
  };

  return (
    <View ref={blockRef} style={mStyles.block}>
      {/* Module header */}
      <TouchableOpacity style={mStyles.header} onPress={toggle} activeOpacity={0.85}>
        <View style={mStyles.headerLeft}>
          <View style={[mStyles.numBadge, allDone && mStyles.numBadgeDone]}>
            {allDone ? (
              <CheckCircle2 size={13} color={colors.gold[400]} strokeWidth={2} />
            ) : (
              <Text style={mStyles.numText}>{index + 1}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mStyles.modTitle} numberOfLines={2}>{mod.title}</Text>
            <Text style={mStyles.modMeta}>
              {completedCount}/{total} lecciones completadas
            </Text>
          </View>
        </View>
        <View style={mStyles.chevron}>
          {collapsed
            ? <ChevronDown size={16} color={colors.cream[200]} strokeWidth={2} />
            : <ChevronUp size={16} color={colors.cream[200]} strokeWidth={2} />
          }
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={mStyles.progressTrack}>
        <View
          style={[
            mStyles.progressFill,
            { width: total > 0 ? `${(completedCount / total) * 100}%` as any : '0%' },
          ]}
        />
      </View>

      {/* Animated lessons container */}
      <Animated.View
        style={{ opacity: animRef, overflow: 'hidden' }}
      >
        {!collapsed && (
          <View>
            {mod.lessons.map((l, li) => {
              const locked = !l.is_free && !isPremium;
              const done = completedIds.has(l.id);
              const { label, isVideo } = getLessonTypeLabel(l);
              const dur = fmtDuration(l.duration_seconds);

              return (
                <TouchableOpacity
                  key={l.id}
                  style={[mStyles.lesson, locked && mStyles.lessonLocked]}
                  disabled={locked}
                  activeOpacity={0.75}
                  onPress={() => onLessonPress(l.id)}
                >
                  {/* Icon column */}
                  <View style={[mStyles.lessonIcon, done && mStyles.lessonIconDone]}>
                    {done ? (
                      <CheckCircle2 size={17} color={colors.gold[400]} strokeWidth={2} fill={colors.gold[400]} />
                    ) : locked ? (
                      <Lock size={15} color={colors.ink[300]} strokeWidth={1.5} />
                    ) : isVideo ? (
                      <Play size={15} color={colors.gold[400]} strokeWidth={1.5} fill={colors.gold[400]} />
                    ) : (
                      <BookOpen size={15} color={colors.gold[400]} strokeWidth={1.5} />
                    )}
                  </View>

                  {/* Title + meta */}
                  <View style={{ flex: 1 }}>
                    <Text style={[mStyles.lessonTitle, done && mStyles.lessonTitleDone]} numberOfLines={2}>
                      {li + 1}. {l.title}
                    </Text>
                    <View style={mStyles.lessonMetaRow}>
                      {/* Type chip */}
                      <View style={[mStyles.typeChip, !isVideo && mStyles.typeChipRead]}>
                        {isVideo
                          ? <Play size={9} color={colors.gold[400]} strokeWidth={2} fill={colors.gold[400]} />
                          : <BookOpen size={9} color={colors.cream[200]} strokeWidth={2} />
                        }
                        <Text style={[mStyles.typeChipText, !isVideo && mStyles.typeChipTextRead]}>
                          {label}
                        </Text>
                      </View>
                      {dur ? (
                        <View style={mStyles.durRow}>
                          <Clock size={9} color={colors.ink[300]} strokeWidth={2} />
                          <Text style={mStyles.durText}>{dur}</Text>
                        </View>
                      ) : null}
                      {l.is_free && !locked ? (
                        <View style={mStyles.freeChip}>
                          <Text style={mStyles.freeChipText}>PREVIEW</Text>
                        </View>
                      ) : null}
                      {locked ? (
                        <View style={mStyles.lockedChip}>
                          <Lock size={8} color={colors.ink[300]} strokeWidth={2} />
                          <Text style={mStyles.lockedChipText}>PREMIUM</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Access gate for affiliate-only users ────────────────────────────────────

function AffiliateAccessGate() {
  const router = useRouter();
  return (
    <LinearGradient colors={[colors.burgundy[900], colors.ink[900]]} style={s.fill}>
      <SafeAreaView edges={['top']} style={s.fill}>
        <View style={s.pageHeader}>
          <Text style={s.pageEyebrow}>EN VUELO</Text>
          <Text style={s.pageTitle}>Tus Lecciones</Text>
        </View>
        <View style={s.center}>
          <BookOpen size={48} color={colors.ink[300]} strokeWidth={1} />
          <Text style={s.emptyTitle}>Contenido exclusivo para estudiantes</Text>
          <Text style={s.emptyBody}>
            Las lecciones son parte del programa de NextFlight Academy. Inscríbete para acceder al contenido completo.
          </Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => router.push('/(app)/(tabs)/aduana')}
            activeOpacity={0.85}
          >
            <Text style={s.emptyBtnTxt}>Ver planes de inscripción</Text>
            <ArrowRight size={15} color={colors.burgundy[900]} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Cursos() {
  const router = useRouter();
  const { user, roles } = useAuth();

  const isStudent = roles.includes('student_free') || roles.includes('student_premium');
  if (!isStudent) return <AffiliateAccessGate />;

  const [program, setProgram] = useState<Program | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [moduleOffsets, setModuleOffsets] = useState<number[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const isPremium = roles.includes('student_premium');

  const loadData = useCallback(async () => {
    if (!user) return;
    const programs = await fetchEnrolledProgramsWithProgress(user.id);
    const current = programs[0] ?? null;
    setProgram(current);
    if (current) {
      const mods = await fetchModulesWithLessons(current.id);
      setModules(mods);

      const lessonIds = mods.flatMap((m) => m.lessons.map((l) => l.id));
      if (lessonIds.length) {
        const { data } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)
          .eq('completed', true);
        setCompletedIds(new Set((data ?? []).map((r: any) => r.lesson_id)));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Refresh completed lessons when user comes back from a lesson screen
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      if (!user || modules.length === 0) return;
      (async () => {
        const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
        if (!lessonIds.length) return;
        const { data } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)
          .eq('completed', true);
        setCompletedIds(new Set((data ?? []).map((r: any) => r.lesson_id)));
      })();
    }, [user?.id, modules])
  );

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const totalCompleted = completedIds.size;
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  // Find the module containing the next pending lesson
  const activeModuleIndex = (() => {
    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi];
      const hasIncomplete = mod.lessons.some((l) => !completedIds.has(l.id));
      if (hasIncomplete) return mi;
    }
    return 0;
  })();

  // Find the next pending lesson across all modules
  const nextLesson = (() => {
    for (const mod of modules) {
      for (const l of mod.lessons) {
        if (!completedIds.has(l.id)) return l;
      }
    }
    return null;
  })();

  if (loading) {
    return (
      <LinearGradient colors={[colors.burgundy[900], colors.ink[900]]} style={s.fill}>
        <SafeAreaView edges={['top']} style={s.fill}>
          <View style={s.pageHeader}>
            <Text style={s.pageEyebrow}>EN VUELO</Text>
            <Text style={s.pageTitle}>Tus Lecciones</Text>
          </View>
          <View style={s.center}>
            <ActivityIndicator color={colors.gold[400]} size="large" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!program) {
    return (
      <LinearGradient colors={[colors.burgundy[900], colors.ink[900]]} style={s.fill}>
        <SafeAreaView edges={['top']} style={s.fill}>
          <View style={s.pageHeader}>
            <Text style={s.pageEyebrow}>EN VUELO</Text>
            <Text style={s.pageTitle}>Tus Lecciones</Text>
          </View>
          <View style={s.center}>
            <BookOpen size={48} color={colors.ink[300]} strokeWidth={1} />
            <Text style={s.emptyTitle}>Sin vuelos reservados</Text>
            <Text style={s.emptyBody}>
              Activa tu inscripción para empezar a aprender.
            </Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => router.push('/(app)/(tabs)/aduana')}
              activeOpacity={0.85}
            >
              <Text style={s.emptyBtnTxt}>Ir a La Aduana</Text>
              <ArrowRight size={15} color={colors.burgundy[900]} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.ink[900]]} style={s.fill}>
      <SafeAreaView edges={['top']} style={s.fill}>
        {/* ── Page header ── */}
        <View style={s.pageHeader}>
          <Text style={s.pageEyebrow}>EN VUELO</Text>
          <Text style={s.pageTitle} numberOfLines={1}>{program.title}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* ── Hero card ── */}
          <View style={s.heroCard}>
            {program.cover_url ? (
              <Image source={{ uri: program.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={[colors.burgundy[700], colors.burgundy[800]]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={s.heroOverlay} />
            <View style={s.heroContent}>
              <View style={s.heroPill}>
                <Text style={s.heroPillText}>
                  {program.tier === 'premium' ? 'ACCESO COMPLETO' : 'PROGRAMA ACTUAL'}
                </Text>
              </View>
              <Text style={s.heroTitle}>{program.subtitle ?? program.title}</Text>

              {/* Overall progress */}
              <View style={s.heroStats}>
                <Text style={s.heroStatNum}>{totalCompleted}</Text>
                <Text style={s.heroStatOf}>/{totalLessons}</Text>
                <Text style={s.heroStatLabel}> lecciones · </Text>
                <Text style={s.heroStatNum}>{modules.length}</Text>
                <Text style={s.heroStatLabel}> módulos</Text>
              </View>
              <View style={s.heroProgressTrack}>
                <View style={[s.heroProgressFill, { width: `${overallPct}%` as any }]} />
              </View>
              <Text style={s.heroProgressLabel}>{overallPct}% completado</Text>
            </View>
          </View>

          {/* ── Modules ── */}
          <View style={s.moduleList}>
            {modules.map((mod, idx) => (
              <View
                key={mod.id}
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  setModuleOffsets((prev) => {
                    const next = [...prev];
                    next[idx] = y;
                    return next;
                  });
                }}
              >
                <ModuleBlock
                  mod={mod}
                  index={idx}
                  completedIds={completedIds}
                  isPremium={isPremium}
                  programTier={program.tier}
                  onLessonPress={(id) => router.push(`/(app)/lesson/${id}`)}
                  initiallyExpanded={idx === activeModuleIndex}
                  scrollRef={scrollRef}
                  blockOffset={moduleOffsets[idx] ?? 0}
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ── Floating continue button ── */}
        {nextLesson ? (
          <View style={s.floatBar}>
            <TouchableOpacity
              style={s.floatBtn}
              onPress={() => router.push(`/(app)/lesson/${nextLesson.id}`)}
              activeOpacity={0.88}
            >
              <Play size={15} color={colors.burgundy[900]} strokeWidth={2} fill={colors.burgundy[900]} />
              <Text style={s.floatBtnTxt} numberOfLines={1}>
                Continuar · {nextLesson.title}
              </Text>
              <ArrowRight size={15} color={colors.burgundy[900]} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Module styles ────────────────────────────────────────────────────────────

const mStyles = StyleSheet.create({
  block: {
    backgroundColor: 'rgba(18,4,10,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(112,4,29,0.5)',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(175,137,86,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
    flexShrink: 0,
  },
  numBadgeDone: {
    backgroundColor: 'rgba(175,137,86,0.2)',
    borderColor: colors.gold[400],
  },
  numText: {
    fontFamily: fonts.supportMedium,
    fontSize: 12,
    color: colors.gold[400],
  },
  modTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    lineHeight: 18,
  },
  modMeta: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.cream[200],
    opacity: 0.6,
    marginTop: 2,
  },
  chevron: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,251,224,0.08)',
    marginHorizontal: spacing.md,
    borderRadius: 1,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%' as any,
    backgroundColor: colors.gold[400],
    borderRadius: 1,
  },
  lesson: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: 'rgba(18,4,10,0.5)',
    backgroundColor: 'rgba(18,4,10,0.25)',
  },
  lessonLocked: {
    opacity: 0.45,
  },
  lessonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,251,224,0.05)',
    borderWidth: 1,
    borderColor: colors.burgundy[700],
    marginTop: 1,
    flexShrink: 0,
  },
  lessonIconDone: {
    backgroundColor: 'rgba(175,137,86,0.12)',
    borderColor: 'rgba(175,137,86,0.35)',
  },
  lessonTitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    lineHeight: 19,
  },
  lessonTitleDone: {
    color: colors.cream[200],
    opacity: 0.75,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(175,137,86,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.25)',
  },
  typeChipText: {
    fontFamily: fonts.supportMedium,
    fontSize: 9,
    color: colors.gold[400],
    letterSpacing: 0.6,
  },
  typeChipRead: {
    backgroundColor: 'rgba(255,251,224,0.06)',
    borderColor: 'rgba(255,251,224,0.12)',
  },
  typeChipTextRead: {
    color: colors.cream[200],
    opacity: 0.7,
  },
  durRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durText: {
    fontFamily: fonts.support,
    fontSize: 9,
    color: colors.ink[300],
  },
  freeChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(58,107,70,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(58,107,70,0.4)',
  },
  freeChipText: {
    fontFamily: fonts.supportMedium,
    fontSize: 9,
    color: '#6BB885',
    letterSpacing: 0.5,
  },
  lockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(154,120,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(154,120,128,0.25)',
  },
  lockedChipText: {
    fontFamily: fonts.supportMedium,
    fontSize: 9,
    color: colors.ink[300],
    letterSpacing: 0.5,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  scroll: { paddingBottom: 96, paddingHorizontal: spacing.md },
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.burgundy[700],
    marginBottom: spacing.md,
  },
  pageEyebrow: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold[400],
    marginBottom: 2,
  },
  pageTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.xl,
    color: colors.cream[100],
  },
  heroCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 180,
    marginBottom: spacing.lg,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,4,10,0.82)',
  },
  heroContent: {
    padding: spacing.md,
  },
  heroPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(175,137,86,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.4)',
    marginBottom: spacing.sm,
  },
  heroPillText: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    color: colors.gold[300],
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.xl,
    color: colors.cream[100],
    marginBottom: spacing.sm,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  heroStatNum: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.gold[300],
  },
  heroStatOf: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.7,
  },
  heroStatLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.7,
  },
  heroProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginBottom: 5,
  },
  heroProgressFill: {
    height: '100%' as any,
    backgroundColor: colors.gold[400],
    borderRadius: 2,
  },
  heroProgressLabel: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.cream[200],
    opacity: 0.6,
  },
  moduleList: {
    gap: 0,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.md,
    color: colors.cream[200],
    textAlign: 'center' as any,
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.6,
    textAlign: 'center' as any,
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold[400],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  emptyBtnTxt: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.burgundy[900],
  },
  floatBar: {
    position: 'absolute' as any,
    bottom: 20,
    left: spacing.lg,
    right: spacing.lg,
  },
  floatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold[400],
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  floatBtnTxt: {
    flex: 1,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.burgundy[900],
  },
});
