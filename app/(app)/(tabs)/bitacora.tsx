import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Linking, Image, FlatList, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import {
  Megaphone, Circle as HelpCircle, MessagesSquare, LogOut,
  ChevronRight, User, Send, Pin, ShoppingBag, ExternalLink,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPublications, fetchFaqs, fetchStoreProducts, createStoreCheckout } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { openKartraHelpdesk } from '@/lib/kartra';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const CATEGORY_LABELS: Record<string, string> = {
  announcement: 'Anuncio',
  resource: 'Recurso',
  event: 'Evento',
  article: 'Artículo',
};

const CATEGORY_COLORS: Record<string, string> = {
  announcement: '#8A1A2C',
  resource: '#3A6B46',
  event: '#7A5A2A',
  article: '#3A547A',
};

const PUB_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'announcement', label: 'Anuncios' },
  { id: 'resource', label: 'Recursos' },
  { id: 'event', label: 'Eventos' },
  { id: 'article', label: 'Artículos' },
] as const;

const TABS = [
  { id: 'publicaciones', label: 'Publicaciones', icon: Megaphone },
  { id: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'soporte', label: 'Soporte', icon: MessagesSquare },
] as const;

export default function Bitacora() {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<typeof TABS[number]['id']>('publicaciones');
  const [publications, setPublications] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [pubFilter, setPubFilter] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(false);
  const [kartraHelpdeskEnabled, setKartraHelpdeskEnabled] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [pubs, fq, kartraFlag, telegramSetting, storeFlag] = await Promise.all([
        fetchPublications(30),
        fetchFaqs(),
        supabase.from('feature_flags').select('enabled').eq('key', 'kartra_helpdesk_enabled').maybeSingle(),
        supabase.from('system_settings').select('value').eq('key', 'telegram_booking_url').maybeSingle(),
        supabase.from('feature_flags').select('enabled').eq('key', 'store_enabled').maybeSingle(),
      ]);
      setPublications(pubs);
      setFaqs(fq);
      setKartraHelpdeskEnabled(kartraFlag.data?.enabled === true);
      const tgUrl = telegramSetting.data?.value;
      setTelegramUrl(typeof tgUrl === 'string' && tgUrl.length > 0 ? tgUrl : null);
      setStoreEnabled(storeFlag.data?.enabled === true);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (tab === 'tienda' && storeProducts.length === 0) {
      setStoreLoading(true);
      fetchStoreProducts().then((p) => { setStoreProducts(p); setStoreLoading(false); });
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const onBuy = async (product: any) => {
    setCheckoutError(null);
    setCheckingOut(product.id);
    const r = await createStoreCheckout(product.id);
    setCheckingOut(null);
    if (r.url) {
      Linking.openURL(r.url);
    } else {
      setCheckoutError('No fue posible procesar el pago. Inténtalo de nuevo.');
    }
  };

  const filteredPubs = pubFilter === 'all'
    ? publications
    : publications.filter((p) => p.category === pubFilter);

  return (
    <ScreenContainer subtitle="Bitácora de Cabina" title="Tu diario de vuelo" scrollRef={scrollRef}>
      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          if (t.id === 'tienda' && !storeEnabled) return null;
          return (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, active && styles.tabActive]}>
              <Icon size={14} color={active ? colors.burgundy[900] : colors.cream[200]} strokeWidth={1.6} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {/* ── PUBLICACIONES ── */}
          {tab === 'publicaciones' && (
            <View style={{ gap: spacing.md }}>
              {/* Category filter pills */}
              <View style={styles.filterRow}>
                {PUB_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setPubFilter(f.id)}
                    style={[styles.filterPill, pubFilter === f.id && styles.filterPillActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterPillTxt, pubFilter === f.id && styles.filterPillTxtActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredPubs.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTxt}>Sin publicaciones en esta categoría.</Text>
                </View>
              ) : (
                filteredPubs.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.pubCard}
                    onPress={() => router.push(`/(app)/publication/${p.id}` as any)}
                    activeOpacity={0.88}
                  >
                    {p.cover_url ? (
                      <Image source={{ uri: p.cover_url }} style={styles.pubCover} resizeMode="cover" />
                    ) : null}
                    <View style={styles.pubCardBody}>
                      <View style={styles.pubMeta}>
                        <View style={[
                          styles.catBadge,
                          { backgroundColor: (CATEGORY_COLORS[p.category] ?? '#555') + '22',
                            borderColor: (CATEGORY_COLORS[p.category] ?? '#555') + '55' }
                        ]}>
                          <Text style={[styles.catTxt, { color: CATEGORY_COLORS[p.category] ?? '#aaa' }]}>
                            {CATEGORY_LABELS[p.category] ?? p.category}
                          </Text>
                        </View>
                        {p.is_pinned ? (
                          <View style={styles.pinBadge}>
                            <Pin size={10} color={colors.gold[400]} />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.pubTitle}>{p.title}</Text>
                      {p.body ? (
                        <Text style={styles.pubExcerpt} numberOfLines={2}>{p.body}</Text>
                      ) : null}
                      <View style={styles.pubFooter}>
                        {p.author_label ? (
                          <Text style={styles.pubAuthor}>{p.author_label}</Text>
                        ) : null}
                        {p.cta_label ? (
                          <View style={styles.ctaBadge}>
                            <ExternalLink size={11} color={colors.gold[400]} />
                            <Text style={styles.ctaBadgeTxt}>{p.cta_label}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* ── TIENDA ── */}
          {tab === 'tienda' && storeEnabled && (
            <View style={{ gap: spacing.md }}>
              {checkoutError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorTxt}>{checkoutError}</Text>
                  <TouchableOpacity style={styles.errorRetry} onPress={() => setCheckoutError(null)}>
                    <Text style={styles.errorRetryTxt}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {storeLoading ? (
                <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.lg }} />
              ) : storeProducts.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <ShoppingBag size={36} color="rgba(175,137,86,0.3)" strokeWidth={1.2} />
                  <Text style={styles.emptyTxt}>Próximamente tendremos algo especial para ti.</Text>
                </View>
              ) : (
                <View style={styles.storeGrid}>
                  {storeProducts.map((item) => (
                    <View key={item.id} style={styles.storeCard}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.storeCardImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.storeCardImgPlaceholder}>
                          <ShoppingBag size={28} color="rgba(175,137,86,0.3)" strokeWidth={1.3} />
                        </View>
                      )}
                      <View style={styles.storeCardBody}>
                        <Text style={styles.storeCardName} numberOfLines={2}>{item.name}</Text>
                        {item.description ? (
                          <Text style={styles.storeCardDesc} numberOfLines={2}>{item.description}</Text>
                        ) : null}
                        <View style={styles.storeCardFooter}>
                          <Text style={styles.storeCardPrice}>
                            ${Number(item.price_usd).toFixed(2)}
                            <Text style={{ fontSize: fontSize.xs, color: colors.gold[400] }}> USD</Text>
                          </Text>
                          <TouchableOpacity
                            style={[styles.storeBuyBtn, checkingOut === item.id && { opacity: 0.6 }]}
                            onPress={() => onBuy(item)}
                            disabled={checkingOut !== null}
                            activeOpacity={0.82}
                          >
                            {checkingOut === item.id ? (
                              <ActivityIndicator size="small" color={colors.burgundy[900]} />
                            ) : (
                              <Text style={styles.storeBuyBtnTxt}>Comprar</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── FAQs ── */}
          {tab === 'faqs' && (
            <View style={{ gap: spacing.sm }}>
              {faqs.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <HelpCircle size={36} color="rgba(175,137,86,0.3)" strokeWidth={1.2} />
                  <Text style={styles.emptyTxt}>Aún no hay preguntas frecuentes disponibles. Vuelve pronto.</Text>
                </View>
              ) : (
                faqs.map((q) => {
                  const open = openFaq === q.id;
                  return (
                    <TouchableOpacity key={q.id} onPress={() => setOpenFaq(open ? null : q.id)} style={styles.faq} activeOpacity={0.85}>
                      <View style={styles.faqHeader}>
                        <Text style={styles.faqQ}>{q.question}</Text>
                        <ChevronRight size={16} color={colors.gold[400]} style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
                      </View>
                      {open ? <Text style={styles.faqA}>{q.answer}</Text> : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* ── SOPORTE ── */}
          {tab === 'soporte' && (
            <View style={{ gap: spacing.md }}>
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Contacta a tu tripulación</Text>
                <Text style={styles.cardTitle}>Estamos para apoyarte</Text>
                <Text style={styles.cardBody}>
                  Nuestro equipo de soporte te atenderá a través de nuestro centro de ayuda.
                </Text>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.85}
                  onPress={async () => {
                    const url = await openKartraHelpdesk();
                    if (url) {
                      Linking.openURL(url);
                    } else {
                      Linking.openURL('mailto:soporte@nextflightacademy.com');
                    }
                  }}
                >
                  <Text style={styles.primaryBtnText}>
                    Abrir centro de ayuda
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Agenda tu sesión</Text>
                <Text style={styles.cardTitle}>Reserva por Telegram</Text>
                <Text style={styles.cardBody}>
                  {telegramUrl
                    ? 'Habla directamente con tu equipo para agendar tu sesión de mentoría o consultoría.'
                    : 'Las reservas por Telegram estarán disponibles muy pronto.'}
                </Text>
                <TouchableOpacity
                  style={[styles.telegramBtn, !telegramUrl && styles.telegramBtnDisabled]}
                  activeOpacity={telegramUrl ? 0.85 : 1}
                  onPress={() => { if (telegramUrl) Linking.openURL(telegramUrl); }}
                >
                  <Send size={15} color={telegramUrl ? '#fff' : colors.cream[200]} strokeWidth={1.8} />
                  <Text style={[styles.telegramBtnText, !telegramUrl && styles.telegramBtnTextDisabled]}>
                    {telegramUrl ? 'Agendar por Telegram' : 'Disponible pronto'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      {/* Profile footer */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={styles.profileRow} activeOpacity={0.85}>
          <View style={styles.avatar}><User size={18} color={colors.gold[400]} strokeWidth={1.6} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.full_name ?? ''}</Text>
            <Text style={styles.profileSub}>Ver perfil</Text>
          </View>
          <ChevronRight size={16} color={colors.cream[200]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} style={styles.signOut}>
          <LogOut size={14} color={colors.gold[400]} strokeWidth={1.6} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg, flexWrap: 'wrap' as any },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: radius.pill, borderColor: colors.burgundy[700], borderWidth: 1,
  },
  tabActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  tabText: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.cream[200] },
  tabTextActive: { color: colors.burgundy[900] },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' as any },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.25)',
    backgroundColor: 'rgba(255,251,224,0.04)',
  },
  filterPillActive: { backgroundColor: 'rgba(175,137,86,0.18)', borderColor: 'rgba(175,137,86,0.5)' },
  filterPillTxt: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.cream[200] },
  filterPillTxtActive: { color: colors.gold[300] },

  emptyWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTxt: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.sm, textAlign: 'center' as any },

  pubCard: {
    backgroundColor: 'rgba(255,251,224,0.05)',
    borderColor: 'rgba(175,137,86,0.15)',
    borderWidth: 1, borderRadius: radius.md,
    overflow: 'hidden',
  },
  pubCover: { width: '100%' as any, height: 160 },
  pubCardBody: { padding: spacing.md, gap: 6 },
  pubMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  catTxt: { fontFamily: fonts.supportMedium, fontSize: 10, letterSpacing: 0.5 },
  pinBadge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(175,137,86,0.18)',
    borderWidth: 1, borderColor: 'rgba(175,137,86,0.35)',
  },
  pubTitle: { fontFamily: fonts.bodySemibold, fontSize: fontSize.md, color: colors.cream[100], lineHeight: fontSize.md * 1.2 },
  pubExcerpt: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], lineHeight: 20 },
  pubFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  pubAuthor: { fontFamily: fonts.support, fontSize: 11, color: colors.gold[400], letterSpacing: 0.3 },
  ctaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaBadgeTxt: { fontFamily: fonts.supportMedium, fontSize: 11, color: colors.gold[400] },

  errorBanner: {
    backgroundColor: 'rgba(112,4,29,0.2)', borderWidth: 1,
    borderColor: 'rgba(112,4,29,0.4)', borderRadius: radius.md, padding: spacing.md,
  },
  errorTxt: { fontFamily: fonts.bodyMedium, color: '#E88', fontSize: fontSize.sm, textAlign: 'center' as any },

  storeGrid: { gap: spacing.md },
  storeCard: {
    backgroundColor: 'rgba(255,251,224,0.05)',
    borderColor: 'rgba(175,137,86,0.15)',
    borderWidth: 1, borderRadius: radius.md, overflow: 'hidden',
  },
  storeCardImg: { width: '100%' as any, height: 180 },
  storeCardImgPlaceholder: {
    width: '100%' as any, height: 130,
    backgroundColor: 'rgba(175,137,86,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  storeCardBody: { padding: spacing.md, gap: 6 },
  storeCardName: { fontFamily: fonts.bodySemibold, fontSize: fontSize.md, color: colors.cream[100] },
  storeCardDesc: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], lineHeight: 20 },
  storeCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  storeCardPrice: { fontFamily: fonts.bodySemibold, fontSize: fontSize.md, color: colors.gold[300] },
  storeBuyBtn: {
    backgroundColor: colors.gold[400], paddingHorizontal: spacing.lg,
    paddingVertical: 10, borderRadius: radius.pill,
    minWidth: 90, alignItems: 'center',
  },
  storeBuyBtnTxt: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.burgundy[900] },

  card: { backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  cardEyebrow: { fontFamily: fonts.supportMedium, fontSize: 10, letterSpacing: 2, color: colors.gold[400], textTransform: 'uppercase' as any, marginBottom: 6 },
  cardTitle: { fontFamily: fonts.bodySemibold, fontSize: fontSize.md, color: colors.cream[100], marginBottom: 4 },
  cardBody: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], lineHeight: 22 },
  faq: { backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  faqQ: { flex: 1, fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.sm },
  faqA: { fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 22 },
  primaryBtn: { backgroundColor: colors.gold[400], paddingVertical: 14, borderRadius: radius.pill, alignItems: 'center', marginTop: spacing.md },
  primaryBtnDisabled: { backgroundColor: 'rgba(175,137,86,0.15)', borderWidth: 1, borderColor: 'rgba(175,137,86,0.3)' },
  primaryBtnText: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, letterSpacing: 0.5 },
  primaryBtnTextDisabled: { color: colors.cream[200] },
  telegramBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#229ED9', paddingVertical: 14, borderRadius: radius.pill, marginTop: spacing.md },
  telegramBtnDisabled: { backgroundColor: 'rgba(255,251,224,0.06)', borderWidth: 1, borderColor: colors.burgundy[700] },
  telegramBtnText: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: fontSize.sm, letterSpacing: 0.5 },
  telegramBtnTextDisabled: { color: colors.cream[200] },
  errorBanner: {
    backgroundColor: 'rgba(112,4,29,0.2)', borderWidth: 1,
    borderColor: 'rgba(112,4,29,0.4)', borderRadius: radius.md, padding: spacing.md,
    gap: spacing.sm,
  },
  errorTxt: { fontFamily: fonts.bodyMedium, color: '#E88', fontSize: fontSize.sm, textAlign: 'center' as any },
  errorRetry: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(220,100,100,0.4)' },
  errorRetryTxt: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#E88', letterSpacing: 0.5 },

  profileSection: { marginTop: spacing.xxl, paddingTop: spacing.lg, borderTopColor: colors.burgundy[700], borderTopWidth: 1, gap: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,131,82,0.18)' },
  profileName: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.base },
  profileSub: { fontFamily: fonts.support, color: colors.cream[200], fontSize: 11, marginTop: 2, opacity: 0.8 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  signOutText: { fontFamily: fonts.bodyMedium, color: colors.gold[400], fontSize: fontSize.sm, letterSpacing: 1, textTransform: 'uppercase' as any },
});
