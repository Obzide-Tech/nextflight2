import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Esta página no existe.</Text>
        <Text style={styles.sub}>Puede que el enlace haya cambiado o ya no esté disponible.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.burgundy[900],
  },
  code: {
    fontFamily: fonts.headingBold,
    fontSize: 72,
    color: colors.gold[400],
    opacity: 0.4,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.xl,
    color: colors.cream[100],
    marginBottom: spacing.sm,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  link: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.gold[400],
    borderRadius: 999,
  },
  linkText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.burgundy[900],
    letterSpacing: 0.5,
  },
});
