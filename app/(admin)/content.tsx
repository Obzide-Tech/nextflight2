import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, ScrollView, useWindowDimensions, Modal, Switch, TextInput, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusPill } from '@/components/admin/StatusPill';
import {
  fetchProgramsAdmin,
  fetchCoursesByProgram,
  fetchModulesByCourse,
  fetchLessonsByModule,
  getUploadSignature,
  updateLessonVideoUrl,
  updateLesson,
} from '@/lib/admin';
import { isCloudinaryUrl } from '@/lib/cloudinary';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { ChevronRight, ChevronLeft, Upload, CircleCheck as Check, Film, BookOpen, Layers, CirclePlay as PlayCircle, GraduationCap, Pencil, X, Save } from 'lucide-react-native';

const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

type ColumnConfig = { title: string; icon: any; count: number };
type MobileStep = 'programs' | 'courses' | 'modules' | 'lessons';

type LessonDraft = {
  title: string;
  description: string;
  duration_minutes: string;
  is_free: boolean;
  is_published: boolean;
};

function LessonEditor({
  lesson,
  onSave,
  onClose,
  saving,
}: {
  lesson: any;
  onSave: (draft: LessonDraft) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<LessonDraft>({
    title: lesson.title ?? '',
    description: lesson.description ?? '',
    duration_minutes: String(Math.round((lesson.duration_seconds ?? 0) / 60)),
    is_free: !!lesson.is_free,
    is_published: !!lesson.is_published,
  });

  return (
    <View style={editorStyles.wrap}>
      <View style={editorStyles.header}>
        <Text style={editorStyles.heading}>Editar lección</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={18} color={colors.ink[700]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={editorStyles.body} keyboardShouldPersistTaps="handled">
        <Text style={editorStyles.label}>Título</Text>
        <TextInput
          value={draft.title}
          onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
          style={editorStyles.input}
          placeholderTextColor={colors.ink[300]}
          placeholder="Título de la lección"
        />

        <Text style={editorStyles.label}>Descripción</Text>
        <TextInput
          value={draft.description}
          onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))}
          style={[editorStyles.input, editorStyles.inputMulti]}
          multiline
          scrollEnabled
          placeholderTextColor={colors.ink[300]}
          placeholder="Descripción (opcional)"
        />

        <Text style={editorStyles.label}>Duración (minutos)</Text>
        <TextInput
          value={draft.duration_minutes}
          onChangeText={(v) => setDraft((d) => ({ ...d, duration_minutes: v.replace(/[^0-9]/g, '') }))}
          style={editorStyles.input}
          keyboardType="numeric"
          placeholderTextColor={colors.ink[300]}
          placeholder="0"
        />

        <View style={editorStyles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={editorStyles.label}>Gratis</Text>
            <Text style={editorStyles.toggleSub}>Visible sin suscripción</Text>
          </View>
          <Switch
            value={draft.is_free}
            onValueChange={(v) => setDraft((d) => ({ ...d, is_free: v }))}
            trackColor={{ true: colors.burgundy[700], false: colors.cream[300] }}
            thumbColor={colors.cream[100]}
          />
        </View>

        <View style={editorStyles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={editorStyles.label}>Publicada</Text>
            <Text style={editorStyles.toggleSub}>Visible para alumnas</Text>
          </View>
          <Switch
            value={draft.is_published}
            onValueChange={(v) => setDraft((d) => ({ ...d, is_published: v }))}
            trackColor={{ true: colors.burgundy[700], false: colors.cream[300] }}
            thumbColor={colors.cream[100]}
          />
        </View>
      </ScrollView>

      <View style={editorStyles.footer}>
        <Pressable onPress={onClose} style={editorStyles.cancelBtn}>
          <Text style={editorStyles.cancelTxt}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={() => onSave(draft)}
          style={[editorStyles.saveBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
        >
          <Save size={14} color={colors.cream[100]} strokeWidth={2} />
          <Text style={editorStyles.saveTxt}>{saving ? 'Guardando...' : 'Guardar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ContentAdmin() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;

  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [mobileStep, setMobileStep] = useState<MobileStep>('programs');

  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await fetchProgramsAdmin();
      setPrograms(p);
      if (p[0]) setSelectedProgram(p[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedProgram) return;
    (async () => {
      const c = await fetchCoursesByProgram(selectedProgram);
      setCourses(c);
      setSelectedCourse(c[0]?.id ?? null);
    })();
  }, [selectedProgram]);

  useEffect(() => {
    if (!selectedCourse) { setModules([]); setSelectedModule(null); return; }
    (async () => {
      const m = await fetchModulesByCourse(selectedCourse);
      setModules(m);
      setSelectedModule(m[0]?.id ?? null);
    })();
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedModule) { setLessons([]); return; }
    (async () => {
      const l = await fetchLessonsByModule(selectedModule);
      setLessons(l);
    })();
  }, [selectedModule]);

  const triggerUpload = (lessonId: string) => {
    if (Platform.OS !== 'web') return;
    setUploadingLessonId(lessonId);
    setUploadError(null);
    setUploadProgress(0);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: any) => {
    const file = e.target?.files?.[0];
    if (!file || !uploadingLessonId) return;

    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('Archivo excede 2 GB (límite de Cloudinary)');
      setUploadingLessonId(null);
      return;
    }

    try {
      const sig = await getUploadSignature({ folder: 'NextFLGHTs', resource_type: 'video' });
      if (!sig.ok) {
        setUploadError(sig.error ?? 'Error getting signature');
        setUploadingLessonId(null);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);
      if (sig.eager) formData.append('eager', sig.eager);
      if (sig.eager_async) formData.append('eager_async', sig.eager_async);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', sig.upload_url);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          const cloudinaryUrl = result.secure_url || result.url;
          if (!cloudinaryUrl) {
            setUploadError('Cloudinary no retornó una URL válida');
            setUploadingLessonId(null);
            return;
          }
          await updateLessonVideoUrl(uploadingLessonId, cloudinaryUrl);
          setLessons((prev) => prev.map((l) => l.id === uploadingLessonId ? { ...l, video_external_url: cloudinaryUrl } : l));
          setUploadProgress(100);
          setTimeout(() => { setUploadingLessonId(null); setUploadProgress(0); }, 1500);
        } else {
          setUploadError(`Upload failed: ${xhr.status}`);
          setUploadingLessonId(null);
        }
      };
      xhr.onerror = () => { setUploadError('Network error during upload'); setUploadingLessonId(null); };
      xhr.send(formData);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload error');
      setUploadingLessonId(null);
    }
    e.target.value = '';
  };

  const handleSaveEdit = async (draft: LessonDraft) => {
    if (!editingLesson) return;
    setSavingEdit(true);
    const fields = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      duration_seconds: (parseInt(draft.duration_minutes, 10) || 0) * 60,
      is_free: draft.is_free,
      is_published: draft.is_published,
    };
    await updateLesson(editingLesson.id, fields as any);
    setLessons((prev) => prev.map((l) => l.id === editingLesson.id ? { ...l, ...fields } : l));
    setSavingEdit(false);
    setEditingLesson(null);
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={colors.gold[500]} size="large" />
      </View>
    );
  }

  const COLS: ColumnConfig[] = [
    { title: 'Programas', icon: GraduationCap, count: programs.length },
    { title: 'Cursos', icon: BookOpen, count: courses.length },
    { title: 'Módulos', icon: Layers, count: modules.length },
    { title: 'Lecciones', icon: PlayCircle, count: lessons.length },
  ];

  const stepIndex: Record<MobileStep, number> = { programs: 0, courses: 1, modules: 2, lessons: 3 };
  const currentCol = COLS[stepIndex[mobileStep]];

  const selectedProgramTitle = programs.find((p) => p.id === selectedProgram)?.title ?? '';
  const selectedCourseTitle = courses.find((c) => c.id === selectedCourse)?.title ?? '';
  const selectedModuleTitle = modules.find((m) => m.id === selectedModule)?.title ?? '';

  const mobileStepBack: Record<MobileStep, MobileStep | null> = {
    programs: null,
    courses: 'programs',
    modules: 'courses',
    lessons: 'modules',
  };

  const mobileBackLabel: Record<MobileStep, string> = {
    programs: '',
    courses: selectedProgramTitle || 'Programas',
    modules: selectedCourseTitle || 'Cursos',
    lessons: selectedModuleTitle || 'Módulos',
  };

  const renderLessonRow = (l: any) => {
    const hasVideo = !!l.video_external_url;
    const isUploading = uploadingLessonId === l.id;
    const hasCloudinary = hasVideo && isCloudinaryUrl(l.video_external_url);

    return (
      <View key={l.id} style={styles.lessonItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lessonTitle} numberOfLines={2}>{l.title}</Text>
          <View style={styles.lessonMeta}>
            <Text style={styles.colItemMeta}>{Math.round((l.duration_seconds ?? 0) / 60)} min · {l.is_free ? 'gratis' : 'premium'}</Text>
            {hasCloudinary && (
              <View style={styles.cdnBadge}>
                <Film size={9} color={colors.gold[500]} />
                <Text style={styles.cdnTxt}>CDN</Text>
              </View>
            )}
          </View>
          {isUploading ? (
            <>
              <View style={styles.progressWrap}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` as any }]} />
              </View>
              <Text style={styles.progressPct}>{uploadProgress}%</Text>
            </>
          ) : null}
        </View>
        <View style={styles.lessonRight}>
          <StatusPill value={l.is_published ? 'active' : 'inactive'} />
          <View style={styles.lessonActions}>
            <Pressable
              onPress={() => setEditingLesson(l)}
              style={styles.actionBtn}
            >
              <Pencil size={12} color={colors.burgundy[700]} strokeWidth={2} />
            </Pressable>
            {Platform.OS === 'web' ? (
              <Pressable
                onPress={() => triggerUpload(l.id)}
                style={[styles.uploadBtn, !!uploadingLessonId && { opacity: 0.4 }]}
                disabled={!!uploadingLessonId}
              >
                {isUploading && uploadProgress === 100 ? (
                  <Check size={13} color={colors.state.success} />
                ) : (
                  <Upload size={13} color={colors.burgundy[700]} strokeWidth={2} />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="video/*"
          style={{ display: 'none' } as any}
          onChange={handleFileSelected}
        />
      )}

      {/* Lesson edit modal (mobile) */}
      {isMobile && (
        <Modal visible={!!editingLesson} transparent animationType="slide" onRequestClose={() => setEditingLesson(null)}>
          <View style={styles.mobileModalOverlay}>
            <Pressable style={styles.mobileModalBackdrop} onPress={() => setEditingLesson(null)} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
              <View style={[styles.mobileModalSheet, { paddingBottom: insets.bottom + 16 }]}>
                {editingLesson && (
                  <LessonEditor
                    lesson={editingLesson}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingLesson(null)}
                    saving={savingEdit}
                  />
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}

      {/* Page header */}
      <View style={[styles.pageHeader, isMobile && styles.pageHeaderMobile]}>
        <Text style={styles.eyebrow}>Catálogo de contenido</Text>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>Programas · Módulos · Lecciones</Text>
        {uploadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{uploadError}</Text>
          </View>
        ) : null}
      </View>

      {isMobile ? (
        /* Mobile: step-by-step navigator */
        <View style={styles.mobileExplorer}>
          <View style={styles.mobileNavBar}>
            {mobileStepBack[mobileStep] !== null ? (
              <Pressable
                onPress={() => setMobileStep(mobileStepBack[mobileStep]!)}
                style={styles.mobileBackBtn}
              >
                <ChevronLeft size={16} color={colors.cream[200]} strokeWidth={2} />
                <Text style={styles.mobileBackTxt} numberOfLines={1}>{mobileBackLabel[mobileStep]}</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View style={styles.mobileNavRight}>
              {(() => {
                const Icon = currentCol.icon;
                return <Icon size={13} color={colors.gold[400]} strokeWidth={1.8} />;
              })()}
              <Text style={styles.mobileNavTitle}>{currentCol.title}</Text>
              <View style={styles.colBadge}>
                <Text style={styles.colBadgeTxt}>{currentCol.count}</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.mobileColScroll} contentContainerStyle={styles.colContent}>
            {mobileStep === 'programs' && programs.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setSelectedProgram(p.id);
                  setMobileStep('courses');
                }}
                style={[styles.colItem, selectedProgram === p.id && styles.colItemActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.colItemTitle, selectedProgram === p.id && styles.colItemTitleActive]} numberOfLines={2}>
                    {p.title}
                  </Text>
                  <Text style={styles.colItemMeta}>${Number(p.price_usd).toFixed(2)} · {p.tier}</Text>
                </View>
                <View style={styles.colItemRight}>
                  <StatusPill value={p.is_published ? 'active' : 'inactive'} />
                  <ChevronRight size={13} color={colors.ink[300]} />
                </View>
              </Pressable>
            ))}

            {mobileStep === 'courses' && (
              courses.length === 0 ? (
                <Text style={styles.colEmpty}>Sin cursos en este programa</Text>
              ) : courses.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setSelectedCourse(c.id);
                    setMobileStep('modules');
                  }}
                  style={[styles.colItem, selectedCourse === c.id && styles.colItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.colItemTitle, selectedCourse === c.id && styles.colItemTitleActive]} numberOfLines={2}>
                      {c.title}
                    </Text>
                    <Text style={styles.colItemMeta}>orden #{c.display_order}</Text>
                  </View>
                  <ChevronRight size={13} color={colors.ink[300]} />
                </Pressable>
              ))
            )}

            {mobileStep === 'modules' && (
              modules.length === 0 ? (
                <Text style={styles.colEmpty}>Sin módulos en este curso</Text>
              ) : modules.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    setSelectedModule(m.id);
                    setMobileStep('lessons');
                  }}
                  style={[styles.colItem, selectedModule === m.id && styles.colItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.colItemTitle, selectedModule === m.id && styles.colItemTitleActive]} numberOfLines={2}>
                      {m.title}
                    </Text>
                    <Text style={styles.colItemMeta}>orden #{m.display_order}</Text>
                  </View>
                  <ChevronRight size={13} color={colors.ink[300]} />
                </Pressable>
              ))
            )}

            {mobileStep === 'lessons' && (
              lessons.length === 0 ? (
                <Text style={styles.colEmpty}>Sin lecciones en este módulo</Text>
              ) : lessons.map((l) => renderLessonRow(l))
            )}
          </ScrollView>
        </View>
      ) : (
        /* Desktop: 4-column finder + optional edit pane */
        <View style={styles.desktopBody}>
          <View style={styles.colHeadersBar}>
            {COLS.map((col, i) => {
              const Icon = col.icon;
              return (
                <View key={col.title} style={[styles.colHeader, i < COLS.length - 1 && styles.colHeaderBorder]}>
                  <Icon size={14} color={colors.gold[400]} strokeWidth={1.8} />
                  <Text style={styles.colHeaderTxt}>{col.title}</Text>
                  <View style={styles.colBadge}>
                    <Text style={styles.colBadgeTxt}>{col.count}</Text>
                  </View>
                </View>
              );
            })}
            {editingLesson && <View style={[styles.colHeader, { flex: 1.4 }]} />}
          </View>

          <View style={styles.explorer}>
            {/* Programs */}
            <ScrollView style={styles.col} contentContainerStyle={styles.colContent}>
              {programs.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedProgram(p.id)}
                  style={[styles.colItem, selectedProgram === p.id && styles.colItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.colItemTitle, selectedProgram === p.id && styles.colItemTitleActive]} numberOfLines={2}>
                      {p.title}
                    </Text>
                    <Text style={styles.colItemMeta}>${Number(p.price_usd).toFixed(2)} · {p.tier}</Text>
                  </View>
                  <View style={styles.colItemRight}>
                    <StatusPill value={p.is_published ? 'active' : 'inactive'} />
                    <ChevronRight size={13} color={selectedProgram === p.id ? colors.gold[400] : colors.ink[300]} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.colDivider} />

            {/* Courses */}
            <ScrollView style={styles.col} contentContainerStyle={styles.colContent}>
              {courses.length === 0 ? (
                <Text style={styles.colEmpty}>Selecciona un programa</Text>
              ) : courses.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCourse(c.id)}
                  style={[styles.colItem, selectedCourse === c.id && styles.colItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.colItemTitle, selectedCourse === c.id && styles.colItemTitleActive]} numberOfLines={2}>
                      {c.title}
                    </Text>
                    <Text style={styles.colItemMeta}>orden #{c.display_order}</Text>
                  </View>
                  <ChevronRight size={13} color={selectedCourse === c.id ? colors.gold[400] : colors.ink[300]} />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.colDivider} />

            {/* Modules */}
            <ScrollView style={styles.col} contentContainerStyle={styles.colContent}>
              {modules.length === 0 ? (
                <Text style={styles.colEmpty}>Selecciona un curso</Text>
              ) : modules.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setSelectedModule(m.id)}
                  style={[styles.colItem, selectedModule === m.id && styles.colItemActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.colItemTitle, selectedModule === m.id && styles.colItemTitleActive]} numberOfLines={2}>
                      {m.title}
                    </Text>
                    <Text style={styles.colItemMeta}>orden #{m.display_order}</Text>
                  </View>
                  <ChevronRight size={13} color={selectedModule === m.id ? colors.gold[400] : colors.ink[300]} />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.colDivider} />

            {/* Lessons */}
            <ScrollView style={[styles.col, { flex: 1.5 }]} contentContainerStyle={styles.colContent}>
              {lessons.length === 0 ? (
                <Text style={styles.colEmpty}>Selecciona un módulo</Text>
              ) : lessons.map((l) => renderLessonRow(l))}
            </ScrollView>

            {/* Desktop edit pane */}
            {editingLesson && (
              <>
                <View style={styles.colDivider} />
                <View style={[styles.col, styles.editPane]}>
                  <LessonEditor
                    lesson={editingLesson}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingLesson(null)}
                    saving={savingEdit}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const editorStyles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface.raised, flexDirection: 'column' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  heading: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.base },
  body: { padding: spacing.lg, gap: 4, paddingBottom: 24 },
  label: { fontFamily: fonts.bodyMedium, color: colors.ink[700], fontSize: fontSize.sm, marginBottom: 4, marginTop: 8 },
  toggleSub: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.xs, marginTop: 2 },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.ink[800],
    backgroundColor: colors.cream[100],
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    outlineStyle: 'none' as any,
  },
  inputMulti: {
    minHeight: 72,
    maxHeight: 120,
    textAlignVertical: 'top' as any,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border.soft,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border.soft,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.soft,
    alignItems: 'center',
  },
  cancelTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[700], fontSize: fontSize.sm },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.burgundy[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
});

const styles = StyleSheet.create({
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wrap: { flex: 1, backgroundColor: colors.cream[50], display: 'flex' as any, flexDirection: 'column', minWidth: 0, overflow: 'hidden' as any },

  pageHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface.raised,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  pageHeaderMobile: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[600], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 24, marginTop: 4 },
  titleMobile: { fontSize: 20 },

  errorBanner: {
    marginTop: spacing.sm,
    backgroundColor: '#FCE3E3',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#D89A9A',
  },
  errorText: { fontFamily: fonts.bodyMedium, color: '#7A1A2C', fontSize: fontSize.sm },

  /* Mobile */
  mobileExplorer: { flex: 1, flexDirection: 'column' },
  mobileNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.burgundy[900],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(175,137,86,0.25)',
  },
  mobileBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  mobileBackTxt: {
    fontFamily: fonts.bodyMedium,
    color: colors.cream[200],
    fontSize: fontSize.sm,
    flex: 1,
  },
  mobileNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileNavTitle: {
    fontFamily: fonts.bodySemibold,
    color: colors.cream[100],
    fontSize: fontSize.sm,
  },
  mobileColScroll: { flex: 1, backgroundColor: colors.surface.raised },

  mobileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mobileModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(48,5,14,0.4)',
  },
  mobileModalSheet: {
    backgroundColor: colors.surface.raised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
  },

  /* Desktop */
  desktopBody: { flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  colHeadersBar: {
    flexDirection: 'row',
    backgroundColor: colors.burgundy[900],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(175,137,86,0.25)',
  },
  colHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  colHeaderBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' },
  colHeaderTxt: {
    fontFamily: fonts.bodySemibold,
    color: colors.cream[200],
    fontSize: fontSize.sm,
    flex: 1,
  },
  colBadge: {
    backgroundColor: 'rgba(175,137,86,0.25)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  colBadgeTxt: { fontFamily: fonts.bodySemibold, color: colors.gold[400], fontSize: 11 },

  explorer: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 0,
  },
  col: {
    flex: 1,
    backgroundColor: colors.surface.raised,
  },
  editPane: {
    flex: 1.4,
  },
  colContent: { paddingVertical: 4 },
  colDivider: { width: 1, backgroundColor: colors.border.soft },

  colItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  colItemActive: { backgroundColor: colors.burgundy[900] + '0D', borderLeftWidth: 3, borderLeftColor: colors.gold[500], paddingLeft: spacing.md - 3 },
  colItemTitle: { fontFamily: fonts.bodyMedium, color: colors.burgundy[900], fontSize: fontSize.sm, lineHeight: 18 },
  colItemTitleActive: { color: colors.burgundy[900], fontFamily: fonts.bodySemibold },
  colItemMeta: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11, marginTop: 2 },
  colItemRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  colEmpty: { fontFamily: fonts.body, color: colors.ink[300], fontSize: fontSize.sm, padding: spacing.md, fontStyle: 'italic' as any },

  lessonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  lessonTitle: { fontFamily: fonts.bodyMedium, color: colors.burgundy[900], fontSize: fontSize.sm, lineHeight: 18 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' as any },
  lessonRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  lessonActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  cdnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.cream[200],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cdnTxt: { fontFamily: fonts.support, fontSize: 9, color: colors.gold[600], letterSpacing: 1 },

  progressWrap: {
    height: 5,
    backgroundColor: colors.cream[200],
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBar: { height: '100%' as any, backgroundColor: colors.gold[500], borderRadius: 3 },
  progressPct: { fontFamily: fonts.support, fontSize: 9, color: colors.ink[500], marginTop: 3 },

  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.soft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[100],
  },
  uploadBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.soft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[100],
  },
});
