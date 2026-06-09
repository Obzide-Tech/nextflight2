import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ActivityIndicator, ScrollView,
  Pressable, Modal, TouchableOpacity, useWindowDimensions,
} from 'react-native';
import { Search, X, ChevronRight, Plus, Trash2, Check, User, CreditCard, Link2, MapPin, Globe, Clock } from 'lucide-react-native';
import {
  fetchUsers, AdminUserRow, updateUserProfile, grantUserRole, revokeUserRole,
} from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const PALETTE = [colors.burgundy[700], '#3A6B46', '#3A547A', '#7A5A2A', colors.burgundy[600], '#5A3E7A'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ALL_ROLES = [
  'student', 'affiliate', 'premium_student',
  'admin_super', 'admin_content', 'admin_finance', 'admin_support',
];

// ─── User detail modal ────────────────────────────────────────────────────────

type UserModalProps = {
  user: AdminUserRow;
  onClose: () => void;
  onUpdated: (u: AdminUserRow) => void;
};

function UserModal({ user, onClose, onUpdated }: UserModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState(user.full_name ?? '');
  const [country, setCountry] = useState(user.country ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [timezone, setTimezone] = useState(user.timezone ?? '');
  const [language, setLanguage] = useState(user.language ?? '');

  const [roleSaving, setRoleSaving] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>(user.roles);

  async function saveProfile() {
    setSaving(true);
    setErr(null);
    const r = await updateUserProfile(user.id, { full_name: name.trim(), country: country.trim(), city: city.trim(), timezone: timezone.trim(), language: language.trim() });
    setSaving(false);
    if (!r.ok) { setErr(r.error ?? 'error'); return; }
    setEditing(false);
    onUpdated({ ...user, full_name: name.trim() || null, country: country.trim() || null, city: city.trim() || null, timezone: timezone.trim() || null, language: language.trim() || null, roles });
  }

  async function toggleRole(role: string) {
    setRoleSaving(role);
    const has = roles.includes(role);
    const r = has ? await revokeUserRole(user.id, role) : await grantUserRole(user.id, role);
    if (r.ok) {
      const next = has ? roles.filter(x => x !== role) : [...roles, role];
      setRoles(next);
      onUpdated({ ...user, roles: next });
    }
    setRoleSaving(null);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <TouchableOpacity style={ms.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={ms.sheet}>
          {/* Sheet header */}
          <View style={ms.sheetHeader}>
            <View style={[ms.bigAvatar, { backgroundColor: avatarColor(user.id) }]}>
              <Text style={ms.bigAvatarTxt}>{initials(user.full_name)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={ms.sheetName} numberOfLines={1}>{user.full_name ?? '—'}</Text>
              <Text style={ms.sheetId} numberOfLines={1}>{user.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ms.closeBtn} hitSlop={12}>
              <X size={20} color={colors.ink[500]} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={ms.body}>
            {/* ── Profile section ── */}
            <SectionHeader icon={<User size={14} color={colors.gold[600]} strokeWidth={2} />} label="Perfil">
              {!editing ? (
                <Pressable onPress={() => setEditing(true)} style={ms.editBtn}>
                  <Text style={ms.editBtnTxt}>Editar</Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => setEditing(false)} style={ms.cancelBtn}>
                    <Text style={ms.cancelBtnTxt}>Cancelar</Text>
                  </Pressable>
                  <Pressable onPress={saveProfile} disabled={saving} style={ms.saveBtn}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={ms.saveBtnTxt}>Guardar</Text>}
                  </Pressable>
                </View>
              )}
            </SectionHeader>

            {err ? <Text style={ms.errTxt}>{err}</Text> : null}

            {editing ? (
              <View style={ms.fields}>
                <Field label="Nombre completo">
                  <TextInput value={name} onChangeText={setName} style={ms.input} placeholderTextColor={colors.ink[300]} />
                </Field>
                <Field label="País">
                  <TextInput value={country} onChangeText={setCountry} style={ms.input} placeholderTextColor={colors.ink[300]} placeholder="MX, US, CO..." />
                </Field>
                <Field label="Ciudad">
                  <TextInput value={city} onChangeText={setCity} style={ms.input} placeholderTextColor={colors.ink[300]} />
                </Field>
                <Field label="Zona horaria">
                  <TextInput value={timezone} onChangeText={setTimezone} style={ms.input} placeholderTextColor={colors.ink[300]} placeholder="America/Mexico_City" />
                </Field>
                <Field label="Idioma">
                  <TextInput value={language} onChangeText={setLanguage} style={ms.input} placeholderTextColor={colors.ink[300]} placeholder="es, en..." />
                </Field>
              </View>
            ) : (
              <View style={ms.infoGrid}>
                <InfoRow icon={<MapPin size={13} color={colors.ink[400]} />} label="Ubicación" value={[city, country].filter(Boolean).join(', ') || '—'} />
                <InfoRow icon={<Clock size={13} color={colors.ink[400]} />} label="Zona horaria" value={user.timezone ?? '—'} />
                <InfoRow icon={<Globe size={13} color={colors.ink[400]} />} label="Idioma" value={user.language ?? '—'} />
                <InfoRow icon={<User size={13} color={colors.ink[400]} />} label="Alta" value={fmtDate(user.created_at)} />
                <InfoRow icon={<Check size={13} color={colors.ink[400]} />} label="Onboarding" value={fmtDate(user.onboarded_at)} />
                <InfoRow icon={<Check size={13} color={colors.ink[400]} />} label="Términos aceptados" value={fmtDate(user.accepted_terms_at)} />
                {user.kartra_contact_id ? <InfoRow icon={<Link2 size={13} color={colors.ink[400]} />} label="Kartra ID" value={user.kartra_contact_id} /> : null}
              </View>
            )}

            {/* ── Roles section ── */}
            <SectionHeader icon={<Check size={14} color={colors.gold[600]} strokeWidth={2} />} label="Roles y permisos" />
            <View style={ms.rolesGrid}>
              {ALL_ROLES.map((role) => {
                const active = roles.includes(role);
                const loading = roleSaving === role;
                const isAdmin = role.startsWith('admin');
                return (
                  <Pressable
                    key={role}
                    onPress={() => toggleRole(role)}
                    disabled={!!roleSaving}
                    style={[ms.roleChip, active && (isAdmin ? ms.roleChipAdmin : ms.roleChipActive)]}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color={active ? '#fff' : colors.ink[500]} />
                      : active
                        ? <Check size={12} color={active ? (isAdmin ? colors.cream[100] : colors.burgundy[700]) : colors.ink[400]} strokeWidth={2.5} />
                        : <Plus size={12} color={colors.ink[400]} strokeWidth={2.5} />
                    }
                    <Text style={[ms.roleChipTxt, active && (isAdmin ? ms.roleChipTxtAdmin : ms.roleChipTxtActive)]}>{role}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Subscription section ── */}
            <SectionHeader icon={<CreditCard size={14} color={colors.gold[600]} strokeWidth={2} />} label="Suscripción" />
            {user.subscription ? (
              <View style={ms.infoGrid}>
                <InfoRow label="Estado" value={user.subscription.status} pill />
                <InfoRow label="Plataforma" value={user.subscription.platform ?? '—'} />
                <InfoRow label="Fin de periodo" value={fmtDate(user.subscription.period_end)} />
              </View>
            ) : (
              <Text style={ms.emptySection}>Sin suscripción activa.</Text>
            )}

            {/* ── Affiliate section ── */}
            <SectionHeader icon={<Link2 size={14} color={colors.gold[600]} strokeWidth={2} />} label="Perfil afiliada" />
            {user.affiliate ? (
              <View style={ms.infoGrid}>
                <InfoRow label="Estado afiliada" value={user.affiliate.status} pill />
                <InfoRow label="Proveedor pago" value={user.affiliate.payout_provider ?? '—'} />
                <InfoRow label="Email pago" value={user.affiliate.payout_email ?? '—'} />
                {user.affiliate.rewardful_id ? <InfoRow label="Rewardful ID" value={user.affiliate.rewardful_id} /> : null}
              </View>
            ) : (
              <Text style={ms.emptySection}>No registrada como afiliada.</Text>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── small helpers ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, children }: { icon?: any; label: string; children?: any }) {
  return (
    <View style={ms.sectionHeader}>
      <View style={ms.sectionLabelRow}>
        {icon}
        <Text style={ms.sectionLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <View style={ms.fieldWrap}>
      <Text style={ms.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value, pill }: { icon?: any; label: string; value: string; pill?: boolean }) {
  return (
    <View style={ms.infoRow}>
      <View style={ms.infoLeft}>
        {icon}
        <Text style={ms.infoLabel}>{label}</Text>
      </View>
      {pill ? (
        <View style={ms.infoPill}>
          <Text style={ms.infoPillTxt}>{value}</Text>
        </View>
      ) : (
        <Text style={ms.infoValue} numberOfLines={1}>{value}</Text>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function UsersAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await fetchUsers(q);
      if (active) { setRows(r); setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [q]);

  function handleUpdated(updated: AdminUserRow) {
    setRows(prev => prev.map(u => u.id === updated.id ? updated : u));
    setSelected(updated);
  }

  return (
    <View style={styles.wrap}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header band */}
        <View style={[styles.headerBand, isMobile && styles.headerBandMobile]}>
          <View>
            <Text style={styles.eyebrow}>Cuentas</Text>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>Usuarias y roles</Text>
          </View>
          <View style={[styles.countBubble, isMobile && styles.countBubbleMobile]}>
            <Text style={styles.countNum}>{loading ? '—' : rows.length}</Text>
            <Text style={styles.countLabel}>registradas</Text>
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

        {/* Table header — desktop only */}
        {!isMobile && (
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 3 }]}>Usuaria</Text>
            <Text style={[styles.th, { flex: 2 }]}>Roles</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Suscripción</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' as any }]}>País</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' as any }]}>Alta</Text>
            <View style={{ width: 32 }} />
          </View>
        )}

        {loading ? (
          <View style={styles.loadWrap}><ActivityIndicator color={colors.gold[500]} /></View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}><Text style={styles.emptyTxt}>Sin coincidencias.</Text></View>
        ) : isMobile ? (
          rows.map((u, i) => (
            <Pressable key={u.id} onPress={() => setSelected(u)} style={[styles.mobileRow, i % 2 === 1 && styles.rowAlt]}>
              <View style={[styles.avatar, { backgroundColor: avatarColor(u.id) }]}>
                <Text style={styles.avatarTxt}>{initials(u.full_name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{u.full_name ?? '—'}</Text>
                <View style={styles.mobileRolesRow}>
                  {u.roles.length === 0 ? (
                    <Text style={styles.noRole}>sin roles</Text>
                  ) : (
                    u.roles.slice(0, 3).map((r) => (
                      <View key={r} style={[styles.roleTag, r.startsWith('admin') && styles.roleTagAdmin]}>
                        <Text style={[styles.roleTagTxt, r.startsWith('admin') && styles.roleTagTxtAdmin]}>{r}</Text>
                      </View>
                    ))
                  )}
                </View>
                <Text style={styles.meta}>
                  {u.country ? `${u.country} · ` : ''}
                  {fmtDate(u.created_at)}
                  {u.subscription ? ` · ${u.subscription.status}` : ''}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.ink[300]} strokeWidth={1.5} />
            </Pressable>
          ))
        ) : (
          rows.map((u, i) => (
            <Pressable key={u.id} onPress={() => setSelected(u)} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
              <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={[styles.avatar, { backgroundColor: avatarColor(u.id) }]}>
                  <Text style={styles.avatarTxt}>{initials(u.full_name)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>{u.full_name ?? '—'}</Text>
                  <Text style={styles.meta} numberOfLines={1}>{u.id.slice(0, 8)}</Text>
                </View>
              </View>
              <View style={[styles.cell, { flex: 2, flexDirection: 'row', flexWrap: 'wrap' as any, gap: 4 }]}>
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
              <View style={[styles.cell, { flex: 1.5 }]}>
                {u.subscription ? (
                  <View style={[styles.subPill, u.subscription.status === 'active' && styles.subPillActive]}>
                    <Text style={[styles.subPillTxt, u.subscription.status === 'active' && styles.subPillTxtActive]}>
                      {u.subscription.status}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noRole}>—</Text>
                )}
              </View>
              <Text style={[styles.cellTxt, { flex: 1, textAlign: 'center' as any }]}>{u.country || '—'}</Text>
              <Text style={[styles.cellTxt, { flex: 1, textAlign: 'right' as any }]}>
                {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
              </Text>
              <ChevronRight size={16} color={colors.ink[300]} strokeWidth={1.5} style={{ width: 32 }} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, overflow: 'hidden' as any },
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
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
  headerBandMobile: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[400], fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.cream[100], fontSize: 26, marginTop: 4 },
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
  countBubbleMobile: { paddingHorizontal: spacing.md, paddingVertical: 8 },
  countNum: { fontFamily: fonts.headingBold, color: colors.gold[400], fontSize: 28 },
  countLabel: { fontFamily: fonts.support, color: colors.gold[500], fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as any },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: spacing.xl, marginBottom: 0,
    backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: colors.border.medium,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11, maxWidth: 480,
  },
  searchWrapMobile: { margin: spacing.md, marginBottom: 0, maxWidth: undefined },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.base, color: colors.ink[800], outlineStyle: 'none' as any },

  tableHead: {
    flexDirection: 'row', paddingHorizontal: spacing.xl, paddingVertical: 10,
    marginTop: spacing.md, borderBottomWidth: 2, borderBottomColor: colors.border.medium, alignItems: 'center',
  },
  th: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as any },

  loadWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500] },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.border.soft,
  },
  mobileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.soft,
  },
  rowAlt: { backgroundColor: '#F8F6EE' },
  cell: { minWidth: 0 },
  cellTxt: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm, minWidth: 0 },

  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: 13 },
  name: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, minWidth: 0 },
  meta: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11, marginTop: 2, minWidth: 0 },
  noRole: { fontFamily: fonts.support, color: colors.ink[300], fontSize: 11, fontStyle: 'italic' as any },

  mobileRolesRow: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 4, marginTop: 4, marginBottom: 4 },

  roleTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.cream[200], borderWidth: 1, borderColor: colors.border.soft },
  roleTagAdmin: { backgroundColor: colors.burgundy[900] + '12', borderColor: colors.burgundy[700] + '55' },
  roleTagTxt: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ink[500] },
  roleTagTxtAdmin: { color: colors.burgundy[700] },

  subPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.cream[200], alignSelf: 'flex-start' },
  subPillActive: { backgroundColor: '#E6F1E8' },
  subPillTxt: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ink[500] },
  subPillTxtActive: { color: '#2F5E3D' },
});

// ─── modal styles ─────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(48,5,14,0.5)' },
  backdrop: { flex: 1 },
  sheet: {
    width: 480,
    maxWidth: '100%' as any,
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    overflow: 'hidden' as any,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#1E0810',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  bigAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bigAvatarTxt: { fontFamily: fonts.headingBold, color: '#fff', fontSize: 16 },
  sheetName: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.base, minWidth: 0 },
  sheetId: { fontFamily: fonts.support, color: colors.gold[400], fontSize: 10, marginTop: 2, minWidth: 0 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  body: { padding: spacing.lg, gap: 4, paddingBottom: 32 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, marginTop: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.soft,
    marginBottom: 6,
  },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase' as any },

  editBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.gold[400] },
  editBtnTxt: { fontFamily: fonts.bodySemibold, color: colors.gold[600], fontSize: fontSize.xs },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border.medium },
  cancelBtnTxt: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.xs },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.sm, backgroundColor: colors.burgundy[700], minWidth: 70, alignItems: 'center' },
  saveBtnTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.xs },

  errTxt: { fontFamily: fonts.body, color: '#B91C1C', fontSize: fontSize.xs, marginBottom: 4 },

  fields: { gap: spacing.sm },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 10, letterSpacing: 1 },
  input: {
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink[800],
    borderWidth: 1, borderColor: colors.border.medium, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8, backgroundColor: '#fff',
    outlineStyle: 'none' as any,
  },

  infoGrid: { gap: 0, marginBottom: 4 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border.soft,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  infoLabel: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11, letterSpacing: 0.5 },
  infoValue: { fontFamily: fonts.body, color: colors.ink[800], fontSize: fontSize.sm, textAlign: 'right' as any, flex: 1, minWidth: 0 },
  infoPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.cream[200], borderWidth: 1, borderColor: colors.border.soft },
  infoPillTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[600], fontSize: 10 },

  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 8, marginBottom: spacing.sm },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border.medium,
    backgroundColor: colors.cream[100],
  },
  roleChipActive: { borderColor: colors.burgundy[600] + '66', backgroundColor: colors.burgundy[900] + '08' },
  roleChipAdmin: { borderColor: colors.burgundy[700], backgroundColor: colors.burgundy[900] },
  roleChipTxt: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: 11 },
  roleChipTxtActive: { color: colors.burgundy[700] },
  roleChipTxtAdmin: { color: colors.cream[100] },

  emptySection: { fontFamily: fonts.body, color: colors.ink[400], fontSize: fontSize.sm, paddingVertical: 8, fontStyle: 'italic' as any },
});
