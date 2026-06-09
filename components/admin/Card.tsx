import { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ title, subtitle, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    padding: spacing.lg,
  },
  head: { marginBottom: spacing.md },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: fontSize.lg },
  subtitle: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm, marginTop: 4 },
});
