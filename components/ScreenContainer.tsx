import { ReactNode, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';
import { LOGO_WORDMARK_CENTERED_CREAM } from '@/constants/logos';

const { width: SW } = Dimensions.get('window');
// logo-next-19 (wordmark centered cream): canvas cuadrado, margen simétrico en ambos lados
// Damos ancho generoso y lo dejamos alineado a la izquierda via marginLeft negativo
// para compensar el padding interno del canvas
const LOCKUP_W = Math.round(SW * 0.58);
const LOCKUP_H = Math.round(LOCKUP_W * 0.40);
// El canvas tiene padding interno → compensamos con -30% igual que el header de terminal
const LOCKUP_MARGIN_LEFT = Math.round(LOCKUP_W * -0.30);

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  hideBrandBar?: boolean;
  scrollRef?: React.RefObject<ScrollView>;
};

export function ScreenContainer({ children, title, subtitle, scroll = true, hideBrandBar = false, scrollRef }: Props) {
  const Inner = scroll ? ScrollView : View;
  return (
    <View style={styles.bg}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {!hideBrandBar && (
          <View style={styles.brandBar}>
            <Image
              source={LOGO_WORDMARK_CENTERED_CREAM}
              style={{ width: LOCKUP_W, height: LOCKUP_H, marginLeft: LOCKUP_MARGIN_LEFT }}
              resizeMode="contain"
            />
          </View>
        )}
        <Inner
          ref={scroll ? scrollRef : undefined}
          {...(scroll
            ? { contentContainerStyle: styles.scroll, showsVerticalScrollIndicator: false }
            : { style: styles.scroll })}
        >
          {(title || subtitle) && (
            <View style={styles.header}>
              {subtitle ? <Text style={styles.eyebrow}>{subtitle}</Text> : null}
              {title ? <Text style={styles.title}>{title}</Text> : null}
            </View>
          )}
          {children}
        </Inner>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.burgundy[900] },
  brandBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(175,137,86,0.12)',
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl + 40 },
  header: { marginBottom: spacing.lg },
  eyebrow: {
    fontFamily: fonts.supportMedium,
    fontSize: 10,
    color: colors.gold[400],
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    opacity: 0.9,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: fontSize.display,
    color: colors.cream[100],
    lineHeight: fontSize.display * 1.1,
  },
});

export default ScreenContainer;
