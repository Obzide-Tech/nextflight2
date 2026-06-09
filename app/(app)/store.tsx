import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator,
  FlatList, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingBag, Tag } from 'lucide-react-native';
import { fetchStoreProducts, createStoreCheckout } from '@/lib/data';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const CATEGORY_LABELS: Record<string, string> = {
  merch: 'Merch',
  service: 'Servicio',
  event: 'Evento',
  experience: 'Experiencia',
};

const CATEGORY_COLORS: Record<string, string> = {
  merch: '#5A3E7A',
  service: '#3A6B7A',
  event: '#7A5A2A',
  experience: '#3A6B46',
};

export default function StoreScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setProducts(await fetchStoreProducts());
      setLoading(false);
    })();
  }, []);

  const onBuy = async (product: any) => {
    setError(null);
    setCheckingOut(product.id);
    const r = await createStoreCheckout(product.id);
    setCheckingOut(null);
    if (r.url) {
      Linking.openURL(r.url);
    } else {
      setError(r.error === 'stripe_not_configured'
        ? 'Los pagos no están disponibles en este momento.'
        : 'No fue posible procesar el pago. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.cream[100]} strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>NEXT FLIGHT ACADEMY</Text>
            <Text style={styles.headerTitle}>Tienda</Text>
          </View>
          <ShoppingBag size={24} color={colors.gold[400]} strokeWidth={1.5} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gold[400]} style={{ flex: 1 }} />
        ) : (
          <>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            ) : null}

            {products.length === 0 ? (
              <View style={styles.emptyWrap}>
                <ShoppingBag size={48} color="rgba(175,137,86,0.3)" strokeWidth={1.2} />
                <Text style={styles.emptyTitle}>Próximamente</Text>
                <Text style={styles.emptySub}>
                  Estamos preparando algo especial para ti.{'\n'}Vuelve pronto.
                </Text>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={{ gap: spacing.sm }}
                ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.cardImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.cardImgPlaceholder}>
                        <ShoppingBag size={32} color="rgba(175,137,86,0.35)" strokeWidth={1.3} />
                      </View>
                    )}
                    <View style={styles.cardBody}>
                      <View style={[
                        styles.catBadge,
                        { backgroundColor: (CATEGORY_COLORS[item.category] ?? '#555') + '22',
                          borderColor: (CATEGORY_COLORS[item.category] ?? '#555') + '66' }
                      ]}>
                        <Text style={[styles.catTxt, { color: CATEGORY_COLORS[item.category] ?? '#888' }]}>
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </Text>
                      </View>
                      <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
                      ) : null}
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardPrice}>
                          ${Number(item.price_usd).toFixed(2)}
                          <Text style={styles.cardCurrency}> USD</Text>
                        </Text>
                        <TouchableOpacity
                          style={[styles.buyBtn, checkingOut === item.id && { opacity: 0.6 }]}
                          onPress={() => onBuy(item)}
                          disabled={checkingOut !== null}
                          activeOpacity={0.82}
                        >
                          {checkingOut === item.id ? (
                            <ActivityIndicator size="small" color={colors.burgundy[900]} />
                          ) : (
                            <Text style={styles.buyBtnTxt}>Comprar</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.burgundy[900] },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(175,137,86,0.15)',
  },
  backBtn: { padding: 4 },
  headerEyebrow: {
    fontFamily: fonts.support, fontSize: 10, letterSpacing: 3,
    color: colors.gold[400], textTransform: 'uppercase' as any,
  },
  headerTitle: {
    fontFamily: fonts.headingBold, fontSize: fontSize.xl,
    color: colors.cream[100], lineHeight: fontSize.xl * 1.15,
  },

  errorBanner: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: 'rgba(112,4,29,0.25)', borderWidth: 1,
    borderColor: 'rgba(112,4,29,0.5)', borderRadius: radius.md,
    padding: spacing.md,
  },
  errorTxt: { fontFamily: fonts.bodyMedium, color: '#E88', fontSize: fontSize.sm, textAlign: 'center' as any },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { fontFamily: fonts.headingBold, fontSize: fontSize.xl, color: colors.cream[100] },
  emptySub: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], textAlign: 'center' as any, lineHeight: 22 },

  grid: { padding: spacing.lg, paddingBottom: 100 },

  card: {
    flex: 1,
    backgroundColor: 'rgba(255,251,224,0.05)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.18)',
    overflow: 'hidden',
  },
  cardImg: { width: '100%' as any, aspectRatio: 4 / 3 },
  cardImgPlaceholder: {
    width: '100%' as any, aspectRatio: 4 / 3,
    backgroundColor: 'rgba(175,137,86,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: spacing.md, gap: 8 },
  catBadge: { alignSelf: 'flex-start' as any, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  catTxt: { fontFamily: fonts.supportMedium, fontSize: 10, letterSpacing: 0.4 },
  cardName: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.cream[100], lineHeight: 19 },
  cardDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.cream[200], lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardPrice: { fontFamily: fonts.bodySemibold, fontSize: fontSize.base, color: colors.gold[300] },
  cardCurrency: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.gold[400] },
  buyBtn: {
    backgroundColor: colors.gold[400], paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: radius.pill,
    minWidth: 72, alignItems: 'center',
  },
  buyBtnTxt: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.burgundy[900] },
});
