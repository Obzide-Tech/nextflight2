import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView,
  ActivityIndicator, Platform, useWindowDimensions, Modal, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchStoreProductsAdmin, upsertStoreProduct, toggleStoreProduct,
  generateAdminCheckoutLink, type StoreProduct,
} from '@/lib/admin';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { Plus, ShoppingBag, Link2, ToggleLeft, ToggleRight, Pencil, Tag, X } from 'lucide-react-native';

const CATEGORIES = [
  { value: 'merch', label: 'Merch' },
  { value: 'service', label: 'Servicio' },
  { value: 'event', label: 'Evento' },
  { value: 'experience', label: 'Experiencia' },
] as const;

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  merch: { bg: '#EDE8F5', fg: '#5A3E7A' },
  service: { bg: '#E4EFF5', fg: '#3A6B7A' },
  event: { bg: '#F5EFE4', fg: '#7A5A2A' },
  experience: { bg: '#E4F5EC', fg: '#3A6B46' },
};

const EMPTY: Partial<StoreProduct> = {
  name: '', description: '', price_usd: 0, image_url: '',
  category: 'merch', is_active: true, display_order: 0,
  kartra_tag: '', stock_limit: undefined,
};

export default function StoreAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Partial<StoreProduct> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [linkLoading, setLinkLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cardWidth = isMobile
    ? Math.floor((width - spacing.xl * 2 - spacing.md) / 2)
    : 220;

  const load = async () => {
    setLoading(true);
    setProducts(await fetchStoreProductsAdmin());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onNew = () => setSelected({ ...EMPTY });
  const onEdit = (p: StoreProduct) => setSelected({ ...p });
  const onCancel = () => { setSelected(null); setFeedback(null); };

  const onSave = async () => {
    if (!selected?.name?.trim()) { setFeedback({ kind: 'error', text: 'El nombre es obligatorio.' }); return; }
    if (!selected.price_usd || Number(selected.price_usd) <= 0) { setFeedback({ kind: 'error', text: 'El precio debe ser mayor a 0.' }); return; }
    setSaving(true);
    setFeedback(null);
    const r = await upsertStoreProduct({
      ...selected,
      price_usd: Number(selected.price_usd),
      name: selected.name!,
      kartra_tag: selected.kartra_tag?.trim() || null,
      image_url: selected.image_url?.trim() || null,
      stock_limit: selected.stock_limit ? Number(selected.stock_limit) : null,
    });
    setSaving(false);
    if (r.ok) {
      setFeedback({ kind: 'ok', text: 'Producto guardado.' });
      await load();
      setTimeout(() => { setSelected(null); setFeedback(null); }, 800);
    } else {
      setFeedback({ kind: 'error', text: r.error ?? 'Error al guardar.' });
    }
  };

  const onToggle = async (p: StoreProduct) => {
    await toggleStoreProduct(p.id, !p.is_active);
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const onCopyLink = async (p: StoreProduct) => {
    setLinkLoading(p.id);
    const r = await generateAdminCheckoutLink(p.id);
    setLinkLoading(null);
    if (r.url) {
      if (Platform.OS === 'web') {
        try {
          await (navigator as any).clipboard?.writeText(r.url);
          setCopiedId(p.id);
          setTimeout(() => setCopiedId(null), 2500);
        } catch {
          window.prompt('Copia este enlace:', r.url);
        }
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Enlace de pago', r.url, [{ text: 'OK' }]);
        setCopiedId(p.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } else if (r.error) {
      setFeedback({ kind: 'error', text: r.error === 'stripe_not_configured' ? 'Stripe no está configurado.' : r.error });
    }
  };

  const editorContent = selected ? (
    <View style={styles.editorInner}>
      <View style={styles.editorHeader}>
        <Text style={styles.editorTitle}>{selected.id ? 'Editar producto' : 'Nuevo producto'}</Text>
        <Pressable onPress={onCancel} style={styles.editorClose}>
          <X size={18} color={colors.ink[500]} />
        </Pressable>
      </View>
      <ScrollView style={styles.editorScroll} contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput value={selected.name ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, name: v }))} style={styles.input} placeholder="Camiseta NextFlight..." placeholderTextColor={colors.ink[300]} />

        <Text style={styles.label}>Descripción</Text>
        <TextInput value={selected.description ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, description: v }))} style={[styles.input, { minHeight: 72 }]} multiline placeholder="Describe el producto..." placeholderTextColor={colors.ink[300]} />

        <Text style={styles.label}>Precio (USD) *</Text>
        <TextInput value={selected.price_usd != null ? String(selected.price_usd) : ''} onChangeText={(v) => setSelected((s) => ({ ...s, price_usd: v as any }))} style={styles.input} keyboardType="decimal-pad" placeholder="49.00" placeholderTextColor={colors.ink[300]} />

        <Text style={styles.label}>URL de imagen</Text>
        <TextInput value={selected.image_url ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, image_url: v }))} style={styles.input} placeholder="https://res.cloudinary.com/..." placeholderTextColor={colors.ink[300]} autoCapitalize="none" />
        {selected.image_url ? <Image source={{ uri: selected.image_url }} style={styles.previewImg} resizeMode="cover" /> : null}

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.value} onPress={() => setSelected((s) => ({ ...s, category: c.value }))} style={[styles.chip, selected.category === c.value && styles.chipActive]}>
              <Text style={[styles.chipTxt, selected.category === c.value && styles.chipTxtActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Tag Kartra (opcional)</Text>
        <TextInput value={selected.kartra_tag ?? ''} onChangeText={(v) => setSelected((s) => ({ ...s, kartra_tag: v }))} style={styles.input} placeholder="compra_merch_nfa" placeholderTextColor={colors.ink[300]} autoCapitalize="none" />

        <Text style={styles.label}>Stock límite (opcional)</Text>
        <TextInput value={selected.stock_limit != null ? String(selected.stock_limit) : ''} onChangeText={(v) => setSelected((s) => ({ ...s, stock_limit: v ? (v as any) : undefined }))} style={styles.input} keyboardType="number-pad" placeholder="Vacío = ilimitado" placeholderTextColor={colors.ink[300]} />

        <Text style={styles.label}>Orden de visualización</Text>
        <TextInput value={String(selected.display_order ?? 0)} onChangeText={(v) => setSelected((s) => ({ ...s, display_order: parseInt(v) || 0 }))} style={styles.input} keyboardType="number-pad" placeholderTextColor={colors.ink[300]} />

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
  ) : null;

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>Vitrina</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Gestión de productos</Text>
        </View>
        <Pressable onPress={onNew} style={styles.newBtn}>
          <Plus size={16} color={colors.cream[100]} strokeWidth={2.2} />
          {!isMobile && <Text style={styles.newBtnTxt}>Nuevo producto</Text>}
        </Pressable>
      </View>

      <View style={[styles.body, isMobile && styles.bodyMobile]}>
        {/* Product list */}
        <ScrollView
          style={styles.listPane}
          contentContainerStyle={[styles.listContent, isMobile && styles.listContentMobile]}
        >
          {loading ? (
            <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.xxl }} />
          ) : products.length === 0 ? (
            <View style={styles.emptyWrap}>
              <ShoppingBag size={44} color={colors.ink[100]} strokeWidth={1.3} />
              <Text style={styles.emptyTxt}>Sin productos en la vitrina.</Text>
              <Text style={styles.emptySub}>Crea el primero con "Nuevo producto".</Text>
            </View>
          ) : (
            <View style={[styles.productGrid, isMobile && styles.productGridMobile]}>
              {products.map((p) => {
                const catMeta = CATEGORY_COLORS[p.category] ?? { bg: colors.cream[200], fg: colors.ink[500] };
                return (
                  <View
                    key={p.id}
                    style={[styles.productCard, { width: cardWidth }, !p.is_active && styles.productCardInactive]}
                  >
                    {/* Thumbnail */}
                    <View style={styles.thumbWrap}>
                      {p.image_url ? (
                        <Image source={{ uri: p.image_url }} style={styles.thumb} resizeMode="cover" />
                      ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                          <ShoppingBag size={24} color={colors.ink[100]} strokeWidth={1.3} />
                        </View>
                      )}
                      <View style={[styles.catPill, { backgroundColor: catMeta.bg }]}>
                        <Text style={[styles.catPillTxt, { color: catMeta.fg }]}>
                          {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
                        </Text>
                      </View>
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.productPrice}>${Number(p.price_usd).toFixed(2)} USD</Text>
                      {p.kartra_tag ? (
                        <View style={styles.tagRow}>
                          <Tag size={10} color={colors.gold[500]} />
                          <Text style={styles.tagTxt}>{p.kartra_tag}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Actions */}
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => onToggle(p)} style={styles.iconBtn}>
                        {p.is_active
                          ? <ToggleRight size={20} color='#3A6B46' />
                          : <ToggleLeft size={20} color={colors.ink[300]} />}
                      </Pressable>
                      <Pressable onPress={() => onEdit(p)} style={styles.iconBtn}>
                        <Pencil size={16} color={colors.gold[500]} />
                      </Pressable>
                      <Pressable
                        onPress={() => onCopyLink(p)}
                        disabled={linkLoading === p.id}
                        style={[styles.linkBtn, copiedId === p.id && styles.linkBtnCopied]}
                      >
                        {linkLoading === p.id
                          ? <ActivityIndicator size="small" color={colors.cream[100]} />
                          : <Link2 size={13} color={colors.cream[100]} />}
                        <Text style={styles.linkBtnTxt}>{copiedId === p.id ? 'Copiado' : 'Link'}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Desktop: side editor pane */}
        {!isMobile && selected ? (
          <View style={styles.editorPane}>
            {editorContent}
          </View>
        ) : null}
      </View>

      {/* Mobile: Modal editor */}
      {isMobile && (
        <Modal visible={!!selected} animationType="slide" transparent onRequestClose={onCancel}>
          <View style={styles.mobileModalOverlay}>
            <TouchableOpacity style={styles.mobileModalBackdrop} onPress={onCancel} activeOpacity={1} />
            <View style={[styles.mobileModalSheet, { paddingBottom: insets.bottom }]}>
              {editorContent}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.cream[50], minWidth: 0, overflow: 'hidden' as any },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.raised,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: spacing.md,
  },
  headerMobile: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[600], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 24, marginTop: 4 },
  titleMobile: { fontSize: 18 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.burgundy[900],
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  newBtnTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },

  body: { flex: 1, flexDirection: 'row', overflow: 'hidden' },
  bodyMobile: { flexDirection: 'column' },
  listPane: { flex: 1 },
  listContent: { padding: spacing.xl, paddingBottom: 60 },
  listContentMobile: { padding: spacing.md, paddingBottom: 40 },

  emptyWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTxt: { fontFamily: fonts.bodySemibold, color: colors.ink[500], fontSize: fontSize.base },
  emptySub: { fontFamily: fonts.body, color: colors.ink[300], fontSize: fontSize.sm, textAlign: 'center' as any },

  productGrid: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: spacing.md },
  productGridMobile: { gap: spacing.sm },
  productCard: {
    backgroundColor: colors.surface.raised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.soft,
    overflow: 'hidden',
  },
  productCardInactive: { opacity: 0.5 },

  thumbWrap: { position: 'relative' },
  thumb: { width: '100%' as any, height: 120 },
  thumbPlaceholder: { backgroundColor: colors.surface.sunken, alignItems: 'center', justifyContent: 'center' },
  catPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  catPillTxt: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 0.5 },

  cardInfo: { padding: spacing.md, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.border.soft },
  productName: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm },
  productPrice: { fontFamily: fonts.bodySemibold, color: colors.gold[600], fontSize: fontSize.xs },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagTxt: { fontFamily: fonts.support, fontSize: 10, color: colors.gold[600] },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  iconBtn: { padding: 6 },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.burgundy[800],
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  linkBtnCopied: { backgroundColor: colors.state.success },
  linkBtnTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: 11 },

  // Desktop side pane
  editorPane: {
    width: 380,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.soft,
    backgroundColor: colors.surface.raised,
  },

  // Mobile modal editor
  mobileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(48,5,14,0.5)',
  },
  mobileModalBackdrop: { flex: 1 },
  mobileModalSheet: {
    maxHeight: '90%' as any,
    backgroundColor: colors.surface.raised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },

  editorInner: { flex: 1 },
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
  editorScroll: { flex: 1 },

  label: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as any, marginTop: spacing.sm },
  input: {
    fontFamily: fonts.body, fontSize: fontSize.base, color: colors.ink[800],
    backgroundColor: colors.cream[100], borderWidth: 1, borderColor: colors.border.soft,
    borderRadius: radius.md, padding: spacing.md, marginTop: 4, outlineStyle: 'none' as any,
  },
  previewImg: { width: '100%' as any, height: 120, borderRadius: radius.sm, marginTop: spacing.sm },
  catRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' as any, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border.soft, backgroundColor: colors.surface.raised },
  chipActive: { backgroundColor: colors.burgundy[900], borderColor: colors.burgundy[900] },
  chipTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.sm },
  chipTxtActive: { color: colors.cream[100] },

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
