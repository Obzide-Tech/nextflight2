import { Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  paid: { bg: '#E6F1E8', fg: '#2F5E3D' },
  approved: { bg: '#FFF4D6', fg: '#7A5A14' },
  requested: { bg: '#FFF1E0', fg: '#8A4D14' },
  rejected: { bg: '#FCE3E3', fg: '#7A1A2C' },
  failed: { bg: '#FCE3E3', fg: '#7A1A2C' },
  confirmed: { bg: '#E6F1E8', fg: '#2F5E3D' },
  pending: { bg: '#FFF1E0', fg: '#8A4D14' },
  refunded: { bg: '#FCE3E3', fg: '#7A1A2C' },
  active: { bg: '#E6F1E8', fg: '#2F5E3D' },
  inactive: { bg: '#EFE7DA', fg: '#5A4631' },
  expired: { bg: '#EFE7DA', fg: '#5A4631' },
  cancelled: { bg: '#EFE7DA', fg: '#5A4631' },
  grace_period: { bg: '#FFF4D6', fg: '#7A5A14' },
  on_hold: { bg: '#FFF4D6', fg: '#7A5A14' },
  open: { bg: '#FFF1E0', fg: '#8A4D14' },
  closed: { bg: '#EFE7DA', fg: '#5A4631' },
  in_progress: { bg: '#FFF4D6', fg: '#7A5A14' },
  resolved: { bg: '#E6F1E8', fg: '#2F5E3D' },
  waiting: { bg: '#FFF4D6', fg: '#7A5A14' },
  apple: { bg: '#1B1B1B', fg: '#FFFFFF' },
  google: { bg: '#1A73E8', fg: '#FFFFFF' },
  manual: { bg: '#5A4631', fg: '#FFFFFF' },
};

export function StatusPill({ value }: { value: string }) {
  const v = (value ?? '').toLowerCase();
  const col = COLOR_MAP[v] ?? { bg: '#EFE7DA', fg: '#5A4631' };
  return (
    <View style={[styles.pill, { backgroundColor: col.bg }]}>
      <Text style={[styles.text, { color: col.fg }]}>{v.replaceAll('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 0.5, textTransform: 'lowercase' as any },
});

export default StatusPill;
