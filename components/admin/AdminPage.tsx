import { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPage({ title, eyebrow, description, actions, children }: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: spacing.xxxl, maxWidth: 1280, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.xl },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[600], fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: fontSize.xxl, lineHeight: fontSize.xxl * 1.15, marginTop: 6 },
  description: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.base, marginTop: 6, maxWidth: 720 },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  body: { gap: spacing.md },
});
