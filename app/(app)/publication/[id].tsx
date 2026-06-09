import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Pin, ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const CATEGORY_LABELS: Record<string, string> = {
  announcement: 'Anuncio',
  resource: 'Recurso',
  event: 'Evento',
  article: 'Artículo',
};

const CATEGORY_COLORS: Record<string, string> = {
  announcement: '#70041D',
  resource: '#3A6B46',
  event: '#7A5A2A',
  article: '#3A547A',
};

export default function PublicationDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pub, setPub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle();
      setPub(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.bg}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <ActivityIndicator color={colors.gold[400]} style={{ flex: 1 }} />
        </SafeAreaView>
      </View>
    );
  }

  if (!pub) {
    return (
      <View style={styles.bg}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
            <ArrowLeft size={22} color={colors.cream[100]} strokeWidth={1.8} />
            <Text style={styles.backTxt}>Volver</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.body, color: colors.cream[200], fontSize: fontSize.base }}>
              Publicación no encontrada.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[pub.category] ?? '#888';

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.cream[100]} strokeWidth={1.8} />
          <Text style={styles.backTxt}>Bitácora</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {pub.cover_url ? (
            <Image source={{ uri: pub.cover_url }} style={styles.cover} resizeMode="cover" />
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '66' }]}>
              <Text style={[styles.catTxt, { color: catColor }]}>
                {CATEGORY_LABELS[pub.category] ?? pub.category}
              </Text>
            </View>
            {pub.is_pinned ? (
              <View style={styles.pinBadge}>
                <Pin size={11} color={colors.gold[400]} />
                <Text style={styles.pinTxt}>Fijada</Text>
              </View>
            ) : null}
            {pub.published_at ? (
              <Text style={styles.date}>
                {new Date(pub.published_at).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </Text>
            ) : null}
          </View>

          <Text style={styles.title}>{pub.title}</Text>

          {pub.author_label ? (
            <Text style={styles.author}>{pub.author_label}</Text>
          ) : null}

          {pub.body ? (
            <Text style={styles.body}>{pub.body}</Text>
          ) : null}

          {pub.cta_url && pub.cta_label ? (
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => Linking.openURL(pub.cta_url)}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnTxt}>{pub.cta_label}</Text>
              <ExternalLink size={15} color={colors.burgundy[900]} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.burgundy[900] },

  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backTxt: { fontFamily: fonts.bodyMedium, color: colors.cream[100], fontSize: fontSize.base },

  content: { paddingBottom: 80 },

  cover: { width: '100%' as any, height: 220, marginBottom: spacing.lg },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any,
    paddingHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  catTxt: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 0.5 },
  pinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(175,137,86,0.15)', borderWidth: 1, borderColor: 'rgba(175,137,86,0.35)' },
  pinTxt: { fontFamily: fonts.support, fontSize: 11, color: colors.gold[400] },
  date: { fontFamily: fonts.support, fontSize: 11, color: colors.cream[200], opacity: 0.7 },

  title: {
    fontFamily: fonts.headingBold, fontSize: fontSize.xl,
    color: colors.cream[100], lineHeight: fontSize.xl * 1.2,
    paddingHorizontal: spacing.lg, marginBottom: 6,
  },
  author: {
    fontFamily: fonts.support, fontSize: 12, color: colors.gold[400],
    letterSpacing: 0.5, paddingHorizontal: spacing.lg, marginBottom: spacing.lg,
    textTransform: 'uppercase' as any,
  },
  body: {
    fontFamily: fonts.body, fontSize: fontSize.base, color: colors.cream[200],
    lineHeight: fontSize.base * 1.65, paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold[400], marginHorizontal: spacing.lg,
    paddingVertical: 16, borderRadius: radius.pill,
  },
  ctaBtnTxt: { fontFamily: fonts.bodySemibold, fontSize: fontSize.base, color: colors.burgundy[900] },
});
