import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Search } from 'lucide-react-native';
import { fetchUsers, AdminUserRow } from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const AVATAR_PALETTE = [
  colors.burgundy[700],
  '#3A6B46',
  '#3A547A',
  '#7A5A2A',
  colors.burgundy[600],
  '#5A3E7A',
];

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export default function UsersAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await fetchUsers(q);
      if (active) { setRows(r); setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [q]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header band */}
      <View style={[styles.headerBand, isMobile && styles.headerBandMobile]}>
        <View>
          <Text style={styles.eyebrow}>Cuentas</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Usuarias y roles</Text>
        </View>
        <View style={[styles.countBubble, isMobile && styles.countBubbleMobile]}>
          <Text style={styles.countNum}>{loading ? '—' : rows.length}</Text>
          <Text style={styles.countLabel}>resultados</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, isMobile && styles.searchWrapMobile]}>
        <Search size={16} color={colors.ink[500]} strokeWidth={2} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar por nombre..."
          placeholderTextColor={colors.ink[300]}
          style={styles.searchInput}
        />
      </View>

      {/* Table header — hidden on mobile */}
      {!isMobile && (
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 3 }]}>Usuaria</Text>
          <Text style={[styles.th, { flex: 2.5 }]}>Roles</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' as any }]}>País</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'right' as any }]}>Alta</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator color={colors.gold[500]} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTxt}>Sin coincidencias.</Text>
        </View>
      ) : isMobile ? (
        rows.map((u, i) => (
          <View key={u.id} style={[styles.mobileRow, i % 2 === 1 && styles.rowAlt]}>
            <View style={[styles.avatar, { backgroundColor: avatarColor(u.id) }]}>
              <Text style={styles.avatarTxt}>{initials(u.full_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.full_name ?? '—'}</Text>
              <View style={styles.mobileRolesRow}>
                {u.roles.length === 0 ? (
                  <Text style={styles.noRole}>sin roles</Text>
                ) : (
                  u.roles.map((r) => (
                    <View key={r} style={[styles.roleTag, r.startsWith('admin') && styles.roleTagAdmin]}>
                      <Text style={[styles.roleTagTxt, r.startsWith('admin') && styles.roleTagTxtAdmin]}>{r}</Text>
                    </View>
                  ))
                )}
              </View>
              <Text style={styles.meta}>
                {u.country ? `${u.country} · ` : ''}
                {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
              </Text>
            </View>
          </View>
        ))
      ) : (
        rows.map((u, i) => (
          <View key={u.id} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
            <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <View style={[styles.avatar, { backgroundColor: avatarColor(u.id) }]}>
                <Text style={styles.avatarTxt}>{initials(u.full_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.full_name ?? '—'}</Text>
                <Text style={styles.meta}>{u.id.slice(0, 8)}</Text>
              </View>
            </View>
            <View style={[styles.cell, { flex: 2.5, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }]}>
              {u.roles.length === 0 ? (
                <Text style={styles.noRole}>sin roles</Text>
              ) : (
                u.roles.map((r) => (
                  <View key={r} style={[styles.roleTag, r.startsWith('admin') && styles.roleTagAdmin]}>
                    <Text style={[styles.roleTagTxt, r.startsWith('admin') && styles.roleTagTxtAdmin]}>{r}</Text>
                  </View>
                ))
              )}
            </View>
            <Text style={[styles.cellTxt, { flex: 1, textAlign: 'center' as any }]}>{u.country || '—'}</Text>
            <Text style={[styles.cellTxt, { flex: 1.2, textAlign: 'right' as any }]}>
              {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50], minWidth: 0 },
  container: { paddingBottom: 48, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  headerBand: {
    backgroundColor: '#1E0810',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBandMobile: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.support,
    color: colors.gold[400],
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase' as any,
  },
  title: {
    fontFamily: fonts.headingBold,
    color: colors.cream[100],
    fontSize: 26,
    marginTop: 4,
  },
  titleMobile: { fontSize: 20 },
  countBubble: {
    backgroundColor: 'rgba(175,137,86,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  countBubbleMobile: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  countNum: { fontFamily: fonts.headingBold, color: colors.gold[400], fontSize: 28 },
  countLabel: { fontFamily: fonts.support, color: colors.gold[500], fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as any },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: spacing.xl,
    marginBottom: 0,
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    maxWidth: 480,
  },
  searchWrapMobile: {
    margin: spacing.md,
    marginBottom: 0,
    maxWidth: undefined,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.ink[800],
    outlineStyle: 'none' as any,
  },

  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    marginTop: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.medium,
  },
  th: {
    fontFamily: fonts.support,
    color: colors.ink[500],
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as any,
  },

  loadWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    marginTop: spacing.sm,
  },
  rowAlt: { backgroundColor: '#F8F6EE' },
  cell: {},
  cellTxt: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarTxt: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: 13 },
  name: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm },
  meta: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11, marginTop: 2 },
  noRole: { fontFamily: fonts.support, color: colors.ink[300], fontSize: 11, fontStyle: 'italic' as any },

  mobileRolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },

  roleTag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.cream[200],
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  roleTagAdmin: {
    backgroundColor: colors.burgundy[900] + '12',
    borderColor: colors.burgundy[700] + '55',
  },
  roleTagTxt: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ink[500] },
  roleTagTxtAdmin: { color: colors.burgundy[700] },
});
