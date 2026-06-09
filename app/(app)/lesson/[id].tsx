import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen,
  CircleCheck as CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  PenLine,
  Play,
  Scale,
  Shield,
  FileWarning,
  RefreshCcw,
  ClipboardList,
  Users,
  Handshake,
  Megaphone,
  TriangleAlert,
} from 'lucide-react-native';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchLesson,
  fetchLessonAssets,
  fetchLessonNote,
  fetchLessonProgress,
  fetchModulesWithLessons,
  markLessonCompleted,
  saveLessonNote,
  type LessonRow,
} from '@/lib/data';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const TNC_LESSON_ID = '00000001-0001-4000-8000-000000000000';

const LEGAL_ITEMS: {
  label: string;
  route: `/(legal)/${string}`;
  Icon: React.ComponentType<any>;
}[] = [
  { label: 'Términos de Servicio',       route: '/(legal)/terms',               Icon: Scale },
  { label: 'Política de Privacidad',      route: '/(legal)/privacy',             Icon: Shield },
  { label: 'Aviso de Ingresos',           route: '/(legal)/income-disclaimer',   Icon: FileWarning },
  { label: 'Política de Reembolso',       route: '/(legal)/refund-policy',       Icon: RefreshCcw },
  { label: 'Acuerdo de Inscripción',      route: '/(legal)/enrollment-agreement', Icon: ClipboardList },
  { label: 'Código de Conducta',          route: '/(legal)/conduct',             Icon: Users },
  { label: 'Acuerdo de Afiliados',        route: '/(legal)/affiliate-agreement', Icon: Handshake },
  { label: 'Guías de Marketing Afiliado', route: '/(legal)/affiliate-guidelines', Icon: Megaphone },
];

// ─── Markdown / rich-text renderer ────────────────────────────────────────────

type Span = { type: 'bold' | 'link' | 'text'; text: string; href?: string };

function parseInline(raw: string): Span[] {
  const spans: Span[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) spans.push({ type: 'text', text: raw.slice(last, m.index) });
    if (m[1] !== undefined) {
      spans.push({ type: 'bold', text: m[1] });
    } else {
      spans.push({ type: 'link', text: m[2], href: m[3] });
    }
    last = re.lastIndex;
  }
  if (last < raw.length) spans.push({ type: 'text', text: raw.slice(last) });
  return spans;
}

function InlineParagraph({
  text,
  onLink,
}: {
  text: string;
  onLink: (url: string, label: string) => void;
}) {
  const spans = parseInline(text);
  return (
    <Text style={md.para}>
      {spans.map((s, i) => {
        if (s.type === 'bold') return <Text key={i} style={md.bold}>{s.text}</Text>;
        if (s.type === 'link')
          return (
            <Text key={i} style={md.link} onPress={() => onLink(s.href!, s.text)}>
              {s.text}
            </Text>
          );
        return <Text key={i}>{s.text}</Text>;
      })}
    </Text>
  );
}

function MarkdownText({
  content,
  onLink,
}: {
  content: string;
  onLink: (url: string, label: string) => void;
}) {
  // Strip [RECURSOS_HINT] from body (rendered separately in ResumenTab)
  const cleaned = content.replace(/\[RECURSOS_HINT\]/gi, '').trim();
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <View style={{ gap: 14 }}>
      {paragraphs.map((p, i) => (
        <InlineParagraph key={i} text={p} onLink={onLink} />
      ))}
    </View>
  );
}

const md = StyleSheet.create({
  para: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.cream[100],
    lineHeight: 26,
  },
  bold: {
    fontFamily: fonts.bodySemibold,
    color: colors.cream[100],
  },
  link: {
    fontFamily: fonts.body,
    color: colors.gold[400],
    textDecorationLine: 'underline',
  },
});

// ─── Link icon helper ─────────────────────────────────────────────────────────

function LinkIcon({ url, size = 16 }: { url: string; size?: number }) {
  const lower = url.toLowerCase();
  if (lower.includes('canva.com')) return <Globe size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  if (lower.includes('docs.google.com') || lower.includes('drive.google.com'))
    return <FileText size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  if (lower.includes('systeme.io'))
    return <Globe size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  if (lower.includes('chatgpt.com') || lower.includes('openai'))
    return <Globe size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  if (lower.includes('hotmart.com'))
    return <Globe size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  if (lower.includes('amazon.com'))
    return <Globe size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  if (lower.includes('instagram.com') || lower.includes('tiktok.com'))
    return <ExternalLink size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  if (lower.includes('.pdf'))
    return <FileText size={size} color={colors.gold[400]} strokeWidth={1.5} />;
  return <ExternalLink size={size} color={colors.gold[400]} strokeWidth={1.5} />;
}

// ─── Legal links section (T&C lesson only) ───────────────────────────────────

function LegalLinksSection({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <View style={lgl.container}>
      <View style={lgl.headerRow}>
        <Scale size={13} color={colors.gold[400]} strokeWidth={1.5} />
        <Text style={lgl.headerLabel}>DOCUMENTOS LEGALES</Text>
      </View>
      <View style={lgl.grid}>
        {LEGAL_ITEMS.map(({ label, route, Icon }) => (
          <TouchableOpacity
            key={route}
            style={lgl.card}
            activeOpacity={0.8}
            onPress={() => onNavigate(route)}
          >
            <View style={lgl.iconWrap}>
              <Icon size={18} color={colors.gold[400]} strokeWidth={1.5} />
            </View>
            <Text style={lgl.cardLabel} numberOfLines={2}>{label}</Text>
            <ChevronRight size={14} color={colors.ink[300]} strokeWidth={1.5} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const lgl = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold[400],
  },
  grid: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(18,4,10,0.45)',
    borderWidth: 1,
    borderColor: colors.burgundy[700],
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(175,137,86,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.2)',
    flexShrink: 0,
  },
  cardLabel: {
    flex: 1,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    lineHeight: 18,
  },
});

// ─── Recursos hint banner ─────────────────────────────────────────────────────

function RecursosHintBanner({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={hint.wrap} activeOpacity={0.8} onPress={onPress}>
      <FileText size={14} color={colors.gold[400]} strokeWidth={1.5} />
      <Text style={hint.text}>
        Esta lección tiene materiales descargables en la pestaña{' '}
        <Text style={hint.bold}>Recursos</Text>
      </Text>
      <ChevronRight size={13} color={colors.gold[400]} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

const hint = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(175,137,86,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.28)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    lineHeight: 18,
  },
  bold: {
    fontFamily: fonts.bodySemibold,
    color: colors.gold[400],
  },
});

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'resumen' | 'notas' | 'recursos';

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [savingNote, setSavingNote] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [tab, setTab] = useState<Tab>('resumen');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [nextLesson, setNextLesson] = useState<LessonRow | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const lessonRow = await fetchLesson(id);
        setLesson(lessonRow);
        if (lessonRow) {
          const [note, progress, lessonAssets] = await Promise.all([
            fetchLessonNote(user.id, id),
            fetchLessonProgress(user.id, id),
            fetchLessonAssets(lessonRow.module_id),
          ]);
          setNotes(note);
          setCompleted(!!progress?.completed);
          setAssets(lessonAssets.filter((a: any) => !a.lesson_id || a.lesson_id === id));

          // Find the next lesson in the same module
          try {
            const mod = await fetchLesson(id);
            if (mod?.module_id) {
              const { supabase } = await import('@/lib/supabase');
              const { data: siblings } = await supabase
                .from('course_lessons')
                .select('id, title, display_order, module_id, duration_seconds, is_free, description, body_content, tutor_name, tutor_title, tutor_avatar_url, video_external_url, video_storage_path')
                .eq('module_id', mod.module_id)
                .eq('is_published', true)
                .order('display_order');
              if (siblings) {
                const idx = siblings.findIndex((l: any) => l.id === id);
                if (idx >= 0 && idx < siblings.length - 1) {
                  setNextLesson(siblings[idx + 1] as LessonRow);
                }
              }
            }
          } catch {
            // next lesson is non-critical
          }
        }
      } catch {
        setLoadError(true);
      }
      setLoading(false);
    })();
  }, [id, user?.id]);

  const onChangeNotes = (text: string) => {
    setNotes(text);
    setSavingNote('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!user || !id) return;
      await saveLessonNote(user.id, id, text);
      setSavingNote('saved');
    }, 1200);
  };

  const onComplete = async () => {
    if (!user || !id || completed || completing) return;
    setCompleting(true);
    await markLessonCompleted(user.id, id);
    setCompleted(true);
    setCompleting(false);
  };

  const onDurationLoaded = useCallback((secs: number) => {
    setVideoDuration(secs);
  }, []);

  const openLink = useCallback(
    (url: string, label: string) => {
      // In-app legal routes navigate directly, no WebView
      if (url.startsWith('/(legal)/')) {
        router.push(url as any);
        return;
      }
      router.push(
        `/(app)/webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(label)}`
      );
    },
    [router]
  );

  const goToRecursos = useCallback(() => setTab('recursos'), []);

  const displayDuration = videoDuration > 0 ? videoDuration : (lesson?.duration_seconds ?? 0);
  const durationMin = displayDuration > 0 ? Math.round(displayDuration / 60) : 0;
  const hasVideo = !!(lesson?.video_storage_path || lesson?.video_external_url);
  const isTnC = id === TNC_LESSON_ID;
  const hasRecursosHint = !!(lesson?.body_content?.includes('[RECURSOS_HINT]')) && assets.length > 0;

  if (loading) {
    return (
      <LinearGradient colors={[colors.burgundy[900], colors.ink[900]]} style={s.fill}>
        <SafeAreaView edges={['top']} style={s.fillCenter}>
          <ActivityIndicator color={colors.gold[400]} size="large" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (loadError || !lesson) {
    return (
      <LinearGradient colors={[colors.burgundy[900], colors.ink[900]]} style={s.fill}>
        <SafeAreaView edges={['top']} style={s.fill}>
          <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { margin: spacing.md }]} hitSlop={8}>
            <ChevronLeft size={20} color={colors.cream[100]} strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.fillCenter}>
            <TriangleAlert size={36} color={colors.state.error} strokeWidth={1.5} />
            <Text style={[s.emptyTitle, { marginTop: spacing.sm }]}>
              {loadError ? 'No se pudo cargar la lección' : 'Lección no encontrada'}
            </Text>
            <Text style={s.emptyBody}>
              {loadError ? 'Verifica tu conexión e intenta de nuevo.' : 'Este contenido no está disponible.'}
            </Text>
            {loadError ? (
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => { setLoadError(false); setLoading(true); }}
              >
                <Text style={s.retryText}>Reintentar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.ink[900]]} style={s.fill}>
      <SafeAreaView edges={['top']} style={s.fill}>

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <ChevronLeft size={20} color={colors.cream[100]} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            {lesson.module_title ? (
              <Text style={s.crumb} numberOfLines={1}>
                {lesson.module_title}
              </Text>
            ) : null}
          </View>
          {durationMin > 0 ? (
            <View style={s.durationPill}>
              <Clock size={11} color={colors.gold[400]} strokeWidth={2} />
              <Text style={s.durationText}>{durationMin} min</Text>
            </View>
          ) : null}
        </View>

        {/* ── Video player ── */}
        {hasVideo ? (
          <VideoPlayer
            lessonId={id!}
            videoExternalUrl={lesson.video_external_url}
            onDurationLoaded={onDurationLoaded}
          />
        ) : null}

        {/* ── Lesson title ── */}
        <View style={[s.metaSection, !hasVideo && s.metaSectionNoVideo]}>
          {!hasVideo ? (
            <View style={s.readingBadge}>
              <BookOpen size={13} color={colors.gold[400]} strokeWidth={1.5} />
              <Text style={s.readingBadgeText}>LECTURA</Text>
            </View>
          ) : null}
          <Text style={[s.title, !hasVideo && s.titleLarge]} numberOfLines={3}>
            {lesson.title}
          </Text>
          {lesson.tutor_name ? (
            <View style={s.tutorRow}>
              <Text style={s.tutorName}>{lesson.tutor_name}</Text>
              {lesson.tutor_title ? (
                <Text style={s.tutorTitle}> · {lesson.tutor_title}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Complete button ── */}
        <View style={s.completeBtnWrapper}>
          <TouchableOpacity
            style={[s.completeBtn, completed && s.completeBtnDone]}
            onPress={onComplete}
            disabled={completed || completing}
            activeOpacity={0.85}
          >
            {completing ? (
              <ActivityIndicator
                size="small"
                color={completed ? colors.cream[100] : colors.burgundy[900]}
              />
            ) : (
              <CheckCircle2
                size={16}
                color={completed ? colors.gold[400] : colors.burgundy[900]}
                strokeWidth={2}
                fill={completed ? colors.gold[400] : 'none'}
              />
            )}
            <Text style={[s.completeBtnText, completed && s.completeBtnTextDone]}>
              {completed ? 'Lección completada' : 'Marcar como completada'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabBar}>
          {(['resumen', 'notas', 'recursos'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={s.tabItem} onPress={() => setTab(t)}>
              <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>
                {t === 'resumen'
                  ? 'Resumen'
                  : t === 'notas'
                  ? 'Mis notas'
                  : `Recursos${assets.length > 0 ? ` (${assets.length})` : ''}`}
              </Text>
              {tab === t && <View style={s.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        <ScrollView
          style={s.tabScroll}
          contentContainerStyle={[s.tabContent, !hasVideo && s.tabContentArticle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tab === 'resumen' && (
            <ResumenTab
              lesson={lesson}
              isTnC={isTnC}
              hasRecursosHint={hasRecursosHint}
              onLink={openLink}
              onGoToRecursos={goToRecursos}
            />
          )}
          {tab === 'notas' && (
            <NotasTab
              notes={notes}
              savingNote={savingNote}
              onChangeNotes={onChangeNotes}
            />
          )}
          {tab === 'recursos' && (
            <RecursosTab assets={assets} onLink={openLink} />
          )}
        </ScrollView>

        {/* ── Next lesson CTA ── */}
        {completed && nextLesson ? (
          <View style={s.nextBar}>
            <TouchableOpacity
              style={s.nextBtn}
              activeOpacity={0.88}
              onPress={() => router.replace(`/(app)/lesson/${nextLesson.id}` as any)}
            >
              <Play size={14} color={colors.burgundy[900]} strokeWidth={2} fill={colors.burgundy[900]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.nextLabel}>Siguiente lección</Text>
                <Text style={s.nextTitle} numberOfLines={1}>{nextLesson.title}</Text>
              </View>
              <ChevronRight size={16} color={colors.burgundy[900]} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Tab components ───────────────────────────────────────────────────────────

function ResumenTab({
  lesson,
  isTnC,
  hasRecursosHint,
  onLink,
  onGoToRecursos,
}: {
  lesson: LessonRow;
  isTnC: boolean;
  hasRecursosHint: boolean;
  onLink: (url: string, label: string) => void;
  onGoToRecursos: () => void;
}) {
  const hasContent = !!(lesson.body_content?.replace(/\[RECURSOS_HINT\]/gi, '').trim());
  const hasDescription = !!(lesson.description?.trim());

  if (!hasContent && !hasDescription && !isTnC) {
    return (
      <View style={s.emptyContent}>
        <BookOpen size={36} color={colors.ink[300]} strokeWidth={1.5} />
        <Text style={s.emptyTitle}>Contenido en preparación</Text>
        <Text style={s.emptyBody}>
          El resumen de esta lección estará disponible próximamente.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {hasContent ? (
        <MarkdownText content={lesson.body_content!} onLink={onLink} />
      ) : hasDescription ? (
        <Text style={md.para}>{lesson.description}</Text>
      ) : null}

      {/* T&C lesson: legal document grid */}
      {isTnC && <LegalLinksSection onNavigate={(route) => onLink(route, '')} />}

      {/* Conditional hint when lesson has assets */}
      {hasRecursosHint && <RecursosHintBanner onPress={onGoToRecursos} />}
    </View>
  );
}

function NotasTab({
  notes,
  savingNote,
  onChangeNotes,
}: {
  notes: string;
  savingNote: 'idle' | 'saving' | 'saved';
  onChangeNotes: (t: string) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={s.notesHeader}>
        <PenLine size={13} color={colors.gold[400]} strokeWidth={1.5} />
        <Text style={s.sectionLabel}>BITÁCORA DE CABINA</Text>
      </View>
      <TextInput
        multiline
        placeholder="Anota tus reflexiones de vuelo aquí..."
        placeholderTextColor={colors.ink[300]}
        style={s.notesInput}
        value={notes}
        onChangeText={onChangeNotes}
        textAlignVertical="top"
      />
      <Text style={s.autosaveLabel}>
        {savingNote === 'saving'
          ? 'Guardando...'
          : savingNote === 'saved'
          ? 'Guardado · solo tú puedes ver esto'
          : 'Guardado automático · solo tú puedes ver esto'}
      </Text>
    </View>
  );
}

function RecursosTab({
  assets,
  onLink,
}: {
  assets: any[];
  onLink: (url: string, label: string) => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (assets.length === 0) {
    return (
      <View style={s.emptyContent}>
        <FileText size={36} color={colors.ink[300]} strokeWidth={1.5} />
        <Text style={s.emptyTitle}>Sin recursos en esta lección</Text>
        <Text style={s.emptyBody}>
          Los materiales y herramientas de esta lección aparecerán aquí.
        </Text>
      </View>
    );
  }

  const pdfs = assets.filter((a) => a.asset_type === 'pdf');
  const links = assets.filter((a) => a.asset_type !== 'pdf' && (a.asset_type === 'link' || a.external_url));
  const files = assets.filter((a) => a.asset_type !== 'pdf' && a.storage_path && !a.external_url);

  const openPdf = async (asset: any) => {
    if (loadingId) return;
    setLoadingId(asset.id);
    setPdfError(null);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const res = await fetch(`${supabaseUrl}/functions/v1/sign-pdf-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ assetId: asset.id }),
      });
      const data = await res.json();
      const url = data.url ?? asset.external_url;
      if (url) {
        onLink(url, asset.title ?? 'PDF');
      } else {
        setPdfError('No se pudo generar el enlace. Intenta de nuevo.');
      }
    } catch {
      if (asset.external_url) {
        onLink(asset.external_url, asset.title ?? 'PDF');
      } else {
        setPdfError('No se pudo abrir el PDF. Verifica tu conexión.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {pdfError ? (
        <View style={s.pdfErrorBanner}>
          <TriangleAlert size={14} color={colors.state.error} strokeWidth={1.5} />
          <Text style={s.pdfErrorText}>{pdfError}</Text>
        </View>
      ) : null}
      {pdfs.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <View style={s.sectionHeaderRow}>
            <FileText size={13} color={colors.gold[400]} strokeWidth={1.5} />
            <Text style={s.sectionLabel}>DESCARGAS</Text>
          </View>
          {pdfs.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.resourceRow}
              activeOpacity={0.82}
              disabled={loadingId === r.id}
              onPress={() => openPdf(r)}
            >
              <View style={s.resourceIcon}>
                {loadingId === r.id
                  ? <ActivityIndicator size="small" color={colors.gold[400]} />
                  : <FileText size={18} color={colors.gold[400]} strokeWidth={1.5} />}
              </View>
              <Text style={s.resourceName} numberOfLines={2}>{r.title ?? 'PDF'}</Text>
              <ChevronRight size={14} color={colors.ink[300]} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {links.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <View style={s.sectionHeaderRow}>
            <Globe size={13} color={colors.gold[400]} strokeWidth={1.5} />
            <Text style={s.sectionLabel}>HERRAMIENTAS Y RECURSOS</Text>
          </View>
          {links.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.resourceRow}
              activeOpacity={0.82}
              onPress={() => {
                const url = r.external_url ?? r.url ?? '';
                if (url) onLink(url, r.title ?? 'Recurso');
              }}
            >
              <View style={s.resourceIcon}>
                <LinkIcon url={r.external_url ?? r.url ?? ''} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resourceName} numberOfLines={2}>{r.title ?? 'Recurso'}</Text>
                <Text style={s.resourceUrl} numberOfLines={1}>
                  {extractDomain(r.external_url ?? r.url ?? '')}
                </Text>
              </View>
              <ChevronRight size={14} color={colors.ink[300]} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {files.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <View style={s.sectionHeaderRow}>
            <FileText size={13} color={colors.gold[400]} strokeWidth={1.5} />
            <Text style={s.sectionLabel}>ARCHIVOS</Text>
          </View>
          {files.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.resourceRow}
              activeOpacity={0.82}
              onPress={() => {
                const url = r.external_url ?? r.url ?? '';
                if (url) onLink(url, r.title ?? r.file_name ?? 'Archivo');
              }}
            >
              <View style={s.resourceIcon}>
                <FileText size={18} color={colors.gold[400]} strokeWidth={1.5} />
              </View>
              <Text style={s.resourceName} numberOfLines={2}>
                {r.title ?? r.file_name ?? 'Archivo'}
              </Text>
              <ChevronRight size={14} color={colors.ink[300]} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch {
    return url.slice(0, 40);
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { flex: 1 },
  fillCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18,4,10,0.6)',
    backgroundColor: 'rgba(18,4,10,0.25)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,4,10,0.4)',
    borderWidth: 1,
    borderColor: colors.burgundy[700],
  },
  crumb: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold[400],
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.22)',
  },
  durationText: {
    fontFamily: fonts.supportMedium,
    fontSize: 11,
    color: colors.gold[400],
  },

  // Title area — typography standardized to Poppins (no italic)
  metaSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: 4,
    backgroundColor: 'rgba(18,4,10,0.2)',
  },
  metaSectionNoVideo: {
    paddingTop: spacing.lg,
  },
  readingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(175,137,86,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.25)',
    marginBottom: 6,
  },
  readingBadgeText: {
    fontFamily: fonts.supportMedium,
    fontSize: 9,
    color: colors.gold[400],
    letterSpacing: 1,
  },
  // ↓ Section 5: was fonts.headingItalic — now fonts.bodySemibold (Poppins, no italic)
  title: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.xl,
    color: colors.cream[100],
    lineHeight: 30,
  },
  titleLarge: {
    fontSize: fontSize.xxl,
    lineHeight: 36,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tutorName: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[200],
  },
  tutorTitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.7,
  },

  completeBtnWrapper: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(18,4,10,0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18,4,10,0.5)',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold[400],
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  completeBtnDone: {
    backgroundColor: 'rgba(175,137,86,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
  },
  completeBtnText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.burgundy[900],
    letterSpacing: 0.3,
  },
  completeBtnTextDone: {
    color: colors.gold[400],
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18,4,10,0.7)',
    backgroundColor: 'rgba(18,4,10,0.3)',
  },
  tabItem: {
    marginRight: spacing.lg,
    paddingBottom: 10,
    paddingTop: 4,
    position: 'relative',
  },
  // ↓ Section 5: was fonts.bodyMedium — now fonts.supportMedium (Inter-Medium), consistent with list view labels
  tabLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.55,
  },
  tabLabelActive: {
    color: colors.cream[100],
    opacity: 1,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold[400],
  },

  // ↓ Section 6: dark band background on scroll area
  tabScroll: {
    flex: 1,
    backgroundColor: 'rgba(18,4,10,0.15)',
  },
  tabContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 56,
  },
  tabContentArticle: {
    paddingTop: spacing.sm,
  },

  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.md,
    color: colors.cream[200],
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.55,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionLabel: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold[400],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  // ↓ Section 6: darken from rgba(255,251,224,0.04) → rgba(18,4,10,0.4)
  notesInput: {
    minHeight: 200,
    backgroundColor: 'rgba(18,4,10,0.4)',
    borderWidth: 1,
    borderColor: colors.burgundy[700],
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.cream[100],
    lineHeight: 24,
  },
  autosaveLabel: {
    fontFamily: fonts.support,
    fontSize: 11,
    color: colors.cream[200],
    opacity: 0.45,
    marginTop: 2,
  },
  // ↓ Section 6: darken resource rows
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(18,4,10,0.4)',
    borderWidth: 1,
    borderColor: colors.burgundy[700],
    borderRadius: radius.md,
    padding: spacing.md,
  },
  resourceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(175,137,86,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.2)',
    flexShrink: 0,
  },
  resourceName: {
    flex: 1,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
    lineHeight: 18,
  },
  resourceUrl: {
    fontFamily: fonts.support,
    fontSize: 10,
    color: colors.ink[300],
    marginTop: 2,
  },
  pdfErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(244,67,54,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pdfErrorText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.state.error,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.burgundy[700],
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  retryText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.gold[400],
    letterSpacing: 0.5,
  },
  nextBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(18,4,10,0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(18,4,10,0.6)',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.gold[400],
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  nextLabel: {
    fontFamily: fonts.support,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.burgundy[900],
    textTransform: 'uppercase',
  },
  nextTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.burgundy[900],
    marginTop: 1,
  },
});
