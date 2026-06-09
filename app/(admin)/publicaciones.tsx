import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Image, ActivityIndicator, ScrollView,
} from 'react-native';
import {
  fetchPublicationsAdmin, upsertPublication, deletePublication, type Publication,
} from '@/lib/admin';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { Plus, FileText, Pin, PinOff, Pencil, Trash2, Eye, EyeOff, X, Newspaper } from 'lucide-react-native';

const CATEGORIES = [
  { value: 'announcement', label: 'Anuncio' },
  { value: 'resource', label: 'Recurso' },
  { value: 'event', label: 'Evento' },
  { value: 'article', label: 'Artículo' },
] as const;

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  announcement: { bg: '#FCE3E3', fg: '#70041D' },
  resource: { bg: '#E4F5EC', fg: '#3A6B46' },
  event: { bg: '#F5EFE4', fg: '#7A5A2A' },
  article: { bg: '#EDF2FA', fg: '#3A547A' },
};

const EMPTY: Partial<Publication> = {
  title: '', body: '', cover_url: '', category: 'announcement',
  cta_url: '', cta_label: '', is_pinned: false, is_published: false,
  author_label: 'El equipo NFA',
};

export default function PublicacionesAdmin() {
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Partial<Publication> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setPubs(await fetchPublicationsAdmin());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onNew = () => { setSelected({ ...EMPTY }); setFeedback(null); };
  const onEdit = (p: Publication) => { setSelected({ ...p }); setFeedback(null); };
  const onCancel = () => { setSelected(null); setFeedback(null); };

  const onSave = async () => {
    if (!selected?.title?.trim()) { setFeedback({ kind: 'error', text: 'El título es obligatorio.' }); return; }
    setSaving(true);
    setFeedback(null);
    const r = await upsertPublication({
      ...selected,
      title: selected.title!,
      cover_url: selected.cover_url?.trim() || null,
      cta_url: selected.cta_url?.trim() || null,
      cta_label: selected.cta_label?.trim() || null,
    });
    setSaving(false);
    if (r.ok) {
      setFeedback({ kind: 'ok', text: 'Publicación guardada.' });
      await load();
      setTimeout(() => { setSelected(null); setFeedback(null); }, 800);
    } else {
      setFeedback({ kind: 'error', text: r.error ?? 'Error al guardar.' });
    }
  };

  const onDelete = async (p: Publication) => {
    if (!confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(p.id);
    await deletePublication(p.id);
    setDeleting(null);
    await load();
  };

  const onTogglePublish = async (p: Publication) => {
    await upsertPublication({ ...p, is_published: !p.is_published });
    setPubs((prev) => prev.map((x) => x.id === p.id ? { ...x, is_published: !x.is_published } : x));
  };

  const onTogglePin = async (p: Publication) => {
    await upsertPublication({ ...p, is_pinned: !p.is_pinned });
    setPubs((prev) => prev.map((x) => x.id === p.id ? { ...x, is_pinned: !x.is_pinned } : x));
  };

  const published = pubs.filter((p) => p.is_published).length;
  const pinned = pubs.filter((p) => p.is_pinned).length;

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>Bitácora editorial</Text>
          <Text style={styles.title}>Publicaciones</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statChip}>
            <Eye size={13} color='#3A6B46' strokeWidth={2} />
            <Text style={styles.statChipTxt}>{published} publicadas</Text>
          </View>
          <View style={styles.statChip}>
            <Pin size={13} color={colors.gold[500]} strokeWidth={2} />
            <Text style={styles.statChipTxt}>{pinned} fijadas</Text>
          </View>
          <Pressable onPress={onNew} style={styles.newBtn}>
            <Plus size={15} color={colors.cream[100]} strokeWidth={2.2} />
            <Text style={styles.newBtnTxt}>Nueva</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {/* Publication list */}
        <ScrollView style={styles.listPane} contentContainerStyle={styles.listContent}>
          {loading ? (
            <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.xxl }} />
          ) : pubs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Newspaper size={44} color={colors.ink[100]} strokeWidth={1.3} />
              <Text style={styles.emptyTxt}>Sin publicaciones aún.</Text>
              <Text style={styles.emptySub}>Crea la primera con "Nueva".</Text>
            </View>
          ) : (
            pubs.map((p) => {
              const catMeta = CAT_COLORS[p.category] ?? { bg: colors.cream[200], fg: colors.ink[500] };
              return (
                <View key={p.id} style={[styles.pubCard, !p.is_published && styles.pubCardDraft]}>
                  {/* Category stripe */}
                  <View style={[styles.catStripe, { backgroundColor: catMeta.fg }]} />

                  <View style={styles.pubCardInner}>
                    {/* Cover */}
                    {p.cover_url ? (
                      <Image source={{ uri: p.cover_url }} style={styles.cover} resizeMode="cover" />
                    ) : (
                      <View style={[styles.cover, styles.coverPlaceholder]}>
                        <FileText size={20} color={colors.ink[100]} strokeWidth={1.3} />
                      </View>
                    )}

                    {/* Content */}
                    <View style={styles.pubMeta}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.catBadge, { backgroundColor: catMeta.bg }]}>
                          <Text style={[styles.catBadgeTxt, { color: catMeta.fg }]}>
                            {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
                          </Text>
                        </View>
                        {p.is_pinned && (
                          <View style={styles.pinnedBadge}>
                            <Pin size={9} color={colors.gold[500]} />
                            <Text style={styles.pinnedTxt}>Fijada</Text>
                          </View>
                        )}
                        {!p.is_published && (
                          <View style={styles.draftBadge}>
                            <Text style={styles.draftTxt}>Borrador</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.pubTitle} numberOfLines={2}>{p.title}</Text>
                      {p.body ? <Text style={styles.pubExcerpt} numberOfLines={2}>{p.body}</Text> : null}
                      {p.published_at ? (
                        <Text style={styles.pubDate}>
                          {new Date(p.published_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {p.author_label ? ` · ${p.author_label}` : ''}
                        </Text>
                      ) : null}
                    </View>

                    {/* Row actions */}
                    <View style={styles.rowActions}>
                      <Pressable onPress={() => onTogglePin(p)} style={styles.iconBtn}>
                        {p.is_pinned ? <Pin size={15} color={colors.gold[500]} /> : <PinOff size={15} color={colors.ink[300]} />}
                      </Pressable>
                      <Pressable onPress={() => onTogglePublish(p)} style={styles.iconBtn}>
                        {p.is_published ? <Eye size={15} color='#3A6B46' /> : <EyeOff size={15} color={colors.ink[300]} />}
                      </Pressable>
                      <Pressable onPress={() => onEdit(p)} style={styles.iconBtn}>
                        <Pencil size={15} color={colors.gold[500]} />
                      </Pressable>
                      <Pressable onPress={() => onDelete(p)} disabled={deleting === p.id} style={styles.iconBtn}>
                        {deleting === p.id
                          ? <ActivityIndicator size="small" color={colors.state.error} />
                          : <Trash2 size={15} color={colors.state.error} />}
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Editor panel */}
        {selected ? (
          <View style={styles.editorPane}>
            <View style={styles.editorHeader}>
              <Text style={styles.editorTitle}>{selected.id ? 'Editar publicación' : 'Nueva publicación'}</Text>
              <Pressable onPress={onCancel} style={styles.editorClose}>
                <X size={18} color={colors.ink[500]} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.editorContent}>
              <Text style={styles.label}>Título *</Text>
              <TextInput value={selected.title ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, title: v }))} style={styles.input} placeholder="Título..." placeholderTextColor={colors.ink[300]} />

              <Text style={styles.label}>Contenido</Text>
              <TextInput value={selected.body ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, body: v }))} style={[styles.input, { minHeight: 120 }]} multiline placeholder="Escribe el contenido..." placeholderTextColor={colors.ink[300]} />

              <Text style={styles.label}>URL de portada</Text>
              <TextInput value={selected.cover_url ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, cover_url: v }))} style={styles.input} placeholder="https://..." placeholderTextColor={colors.ink[300]} autoCapitalize="none" />
              {selected.cover_url ? <Image source={{ uri: selected.cover_url }} style={styles.previewImg} resizeMode="cover" /> : null}

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map((c) => (
                  <Pressable key={c.value} onPress={() => setSelected((s) => ({ ...s, category: c.value }))} style={[styles.chip, selected.category === c.value && styles.chipActive]}>
                    <Text style={[styles.chipTxt, selected.category === c.value && styles.chipTxtActive]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Autor / Firma</Text>
              <TextInput value={selected.author_label ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, author_label: v }))} style={styles.input} placeholder="El equipo NFA" placeholderTextColor={colors.ink[300]} />

              <Text style={styles.label}>CTA — Texto</Text>
              <TextInput value={selected.cta_label ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, cta_label: v }))} style={styles.input} placeholder="Ver más, Inscribirme..." placeholderTextColor={colors.ink[300]} />

              <Text style={styles.label}>CTA — URL</Text>
              <TextInput value={selected.cta_url ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, cta_url: v }))} style={styles.input} placeholder="https://..." placeholderTextColor={colors.ink[300]} autoCapitalize="none" />

              <View style={styles.toggleRow}>
                <Pressable onPress={() => setSelected((s) => ({ ...s, is_pinned: !s?.is_pinned }))} style={[styles.toggleBtn, selected.is_pinned && styles.toggleBtnPin]}>
                  <Pin size={13} color={selected.is_pinned ? colors.gold[500] : colors.ink[300]} />
                  <Text style={[styles.toggleTxt, selected.is_pinned && { color: colors.gold[500] }]}>
                    {selected.is_pinned ? 'Fijada' : 'Fijar arriba'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setSelected((s) => ({ ...s, is_published: !s?.is_published }))} style={[styles.toggleBtn, selected.is_published && styles.toggleBtnPub]}>
                  {selected.is_published ? <Eye size={13} color='#3A6B46' /> : <EyeOff size={13} color={colors.ink[300]} />}
                  <Text style={[styles.toggleTxt, selected.is_published && { color: '#3A6B46' }]}>
                    {selected.is_published ? 'Publicada' : 'Borrador'}
                  </Text>
                </Pressable>
              </View>

              {feedback ? (
                <View style={[styles.feedback, feedback.kind === 'ok' ? styles.feedbackOk : styles.feedbackError]}>
                  <Text style={feedback.kind === 'ok' ? styles.feedbackOkTxt : styles.feedbackErrorTxt}>{feedback.text}</Text>
                </View>
              ) : null}

              <View style={styles.editorBtns}>
                <Pressable onPress={onCancel} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnTxt}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={onSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
                  <Text style={styles.saveBtnTxt}>{saving ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.cream[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.raised,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    flexWrap: 'wrap' as any,
    gap: spacing.md,
  },
  headerLeft: {},
  eyebrow: { fontFamily: fonts.support, color: colors.gold[600], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 24, marginTop: 4 },
  headerStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.cream[100],
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  statChipTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.sm },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.burgundy[900],
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  newBtnTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },

  body: { flex: 1, flexDirection: 'row', overflow: 'hidden' },
  listPane: { flex: 1 },
  listContent: { padding: spacing.xl, paddingBottom: 60, gap: spacing.sm },

  emptyWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTxt: { fontFamily: fonts.bodySemibold, color: colors.ink[500], fontSize: fontSize.base },
  emptySub: { fontFamily: fonts.body, color: colors.ink[300], fontSize: fontSize.sm, textAlign: 'center' as any },

  pubCard: {
    backgroundColor: colors.surface.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  pubCardDraft: { borderStyle: 'dashed' as any, opacity: 0.7 },
  catStripe: { width: 4 },
  pubCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
  },

  cover: { width: 72, height: 72, borderRadius: radius.sm, flexShrink: 0, overflow: 'hidden' },
  coverPlaceholder: { backgroundColor: colors.surface.sunken, alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: '100%' as any, height: 120, borderRadius: radius.sm, marginTop: 6 },

  pubMeta: { flex: 1, gap: 5 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' as any },
  catBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  catBadgeTxt: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 0.3 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.gold[500] + '18', borderWidth: 1, borderColor: colors.gold[500] + '44' },
  pinnedTxt: { fontFamily: fonts.support, fontSize: 10, color: colors.gold[500] },
  draftBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.surface.sunken, borderWidth: 1, borderColor: colors.border.soft },
  draftTxt: { fontFamily: fonts.support, fontSize: 10, color: colors.ink[500] },

  pubTitle: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.base, lineHeight: 20 },
  pubExcerpt: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm, lineHeight: 18 },
  pubDate: { fontFamily: fonts.support, color: colors.ink[300], fontSize: 11 },

  rowActions: { flexDirection: 'column', gap: 2 },
  iconBtn: { padding: 6 },

  editorPane: {
    width: 400,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.soft,
    backgroundColor: colors.surface.raised,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  editorTitle: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.base },
  editorClose: { padding: 6 },
  editorContent: { padding: spacing.lg, gap: 6, paddingBottom: 60 },

  label: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as any, marginTop: spacing.sm },
  input: {
    fontFamily: fonts.body, fontSize: fontSize.base, color: colors.ink[800],
    backgroundColor: colors.cream[100], borderWidth: 1, borderColor: colors.border.soft,
    borderRadius: radius.md, padding: spacing.md, marginTop: 4, outlineStyle: 'none' as any,
  },
  catRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' as any, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border.soft, backgroundColor: colors.surface.raised },
  chipActive: { backgroundColor: colors.burgundy[900], borderColor: colors.burgundy[900] },
  chipTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.sm },
  chipTxtActive: { color: colors.cream[100] },

  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.soft, backgroundColor: colors.surface.raised },
  toggleBtnPin: { borderColor: colors.gold[500] + '88', backgroundColor: colors.gold[500] + '10' },
  toggleBtnPub: { borderColor: '#3A6B4688', backgroundColor: '#3A6B4610' },
  toggleTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.sm },

  feedback: { padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm, borderWidth: 1 },
  feedbackOk: { backgroundColor: '#E6F1E8', borderColor: '#9DC4A4' },
  feedbackError: { backgroundColor: '#FCE3E3', borderColor: '#D89A9A' },
  feedbackOkTxt: { fontFamily: fonts.bodyMedium, color: '#2F5E3D', fontSize: fontSize.sm },
  feedbackErrorTxt: { fontFamily: fonts.bodyMedium, color: '#7A1A2C', fontSize: fontSize.sm },

  editorBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.soft, alignItems: 'center' },
  cancelBtnTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.sm },
  saveBtn: { flex: 2, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.burgundy[800], alignItems: 'center' },
  saveBtnTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
});
