import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { fetchFeatureFlags, fetchSystemSettings, setFeatureFlag, setSystemSetting } from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { Zap, SlidersHorizontal, Save, ToggleRight, FileText } from 'lucide-react-native';

const LONG_VALUE_THRESHOLD = 120;

export default function SettingsAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [flags, setFlags] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const reload = async () => {
    const [f, s] = await Promise.all([fetchFeatureFlags(), fetchSystemSettings()]);
    setFlags(f);
    setSettings(s);
    setDrafts(Object.fromEntries(s.map((row: any) => [row.key, typeof row.value === 'string' ? row.value : JSON.stringify(row.value)])));
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const onToggle = async (key: string, enabled: boolean) => {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
    await setFeatureFlag(key, enabled);
  };

  const onSaveSetting = async (key: string) => {
    setSaving(key);
    let parsed: any = drafts[key];
    try { parsed = JSON.parse(drafts[key]); } catch { /* keep as string */ }
    await setSystemSetting(key, parsed);
    setSaving(null);
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={colors.gold[500]} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Page header */}
      <View style={[styles.pageHeader, isMobile && styles.pageHeaderMobile]}>
        <Text style={styles.eyebrow}>Configuración del sistema</Text>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>Feature flags y parámetros</Text>
        <Text style={styles.subtitle}>Los cambios se reflejan en mobile sin redeploy.</Text>
      </View>

      {/* Two-column layout */}
      <View style={[styles.twoCol, isMobile && styles.twoColMobile]}>
        {/* Feature flags */}
        <View style={[styles.column, isMobile && styles.columnMobile]}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.cream[100] }]}>
              <Zap size={16} color={colors.state.info} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Feature flags</Text>
              <Text style={styles.sectionSub}>Activa o desactiva módulos de la plataforma</Text>
            </View>
          </View>
          <View style={styles.flagList}>
            {flags.length === 0 ? (
              <Text style={styles.emptyTxt}>Sin feature flags configurados.</Text>
            ) : (
              flags.map((f: any, i) => (
                <View key={f.key} style={[styles.flagRow, i === flags.length - 1 && styles.flagRowLast]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.flagKeyRow}>
                      <ToggleRight size={13} color={f.enabled ? colors.state.info : colors.ink[300]} strokeWidth={1.8} />
                      <Text style={styles.flagKey} numberOfLines={1}>{f.key}</Text>
                    </View>
                    {f.description ? <Text style={styles.flagDesc}>{f.description}</Text> : null}
                  </View>
                  <Switch
                    value={!!f.enabled}
                    onValueChange={(v) => onToggle(f.key, v)}
                    trackColor={{ true: colors.burgundy[700], false: colors.cream[300] }}
                    thumbColor={colors.cream[100]}
                  />
                </View>
              ))
            )}
          </View>
        </View>

        {/* System settings */}
        <View style={[styles.column, isMobile && styles.columnMobile]}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FDF6E8' }]}>
              <SlidersHorizontal size={16} color={colors.gold[600]} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>System settings</Text>
              <Text style={styles.sectionSub}>Comisión, ventanas, mínimos y reglas de negocio</Text>
            </View>
          </View>
          <View style={styles.settingsList}>
            {settings.length === 0 ? (
              <Text style={styles.emptyTxt}>Sin settings configurados.</Text>
            ) : (
              settings.map((s: any) => {
                const isSaved = savedKey === s.key;
                const rawVal = drafts[s.key] ?? '';
                const isLong = rawVal.length > LONG_VALUE_THRESHOLD;
                const isExpanded = expanded[s.key] ?? false;

                return (
                  <View key={s.key} style={styles.settingRow}>
                    <View style={styles.settingKeyRow}>
                      {isLong && (
                        <View style={styles.docBadge}>
                          <FileText size={10} color={colors.gold[600]} strokeWidth={1.8} />
                          <Text style={styles.docBadgeTxt}>doc</Text>
                        </View>
                      )}
                      <Text style={styles.flagKey} numberOfLines={1}>{s.key}</Text>
                    </View>
                    {s.description ? <Text style={styles.flagDesc}>{s.description}</Text> : null}

                    {isLong && !isExpanded ? (
                      <Pressable
                        onPress={() => setExpanded((e) => ({ ...e, [s.key]: true }))}
                        style={styles.expandBtn}
                      >
                        <Text style={styles.expandBtnTxt}>
                          {rawVal.slice(0, 80).trim()}… <Text style={styles.expandLink}>Expandir para editar</Text>
                        </Text>
                      </Pressable>
                    ) : (
                      <>
                        <TextInput
                          value={rawVal}
                          onChangeText={(v) => setDrafts((d) => ({ ...d, [s.key]: v }))}
                          style={[styles.settingInput, isLong && styles.settingInputLong]}
                          multiline
                          scrollEnabled
                          placeholderTextColor={colors.ink[300]}
                        />
                        {isLong && (
                          <Pressable onPress={() => setExpanded((e) => ({ ...e, [s.key]: false }))}>
                            <Text style={styles.collapseLink}>Colapsar</Text>
                          </Pressable>
                        )}
                      </>
                    )}

                    <Pressable
                      onPress={() => onSaveSetting(s.key)}
                      style={[styles.saveBtn, isSaved && styles.saveBtnDone, saving === s.key && { opacity: 0.6 }]}
                      disabled={saving === s.key}
                    >
                      <Save size={13} color={isSaved ? colors.state.success : colors.cream[100]} strokeWidth={2} />
                      <Text style={[styles.saveTxt, isSaved && styles.saveTxtDone]}>
                        {saving === s.key ? 'Guardando...' : isSaved ? 'Guardado' : 'Guardar'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: colors.cream[50], minWidth: 0 },
  container: { paddingBottom: 48, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  pageHeader: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    backgroundColor: colors.surface.raised,
  },
  pageHeaderMobile: { padding: spacing.md },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[600], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 26, marginTop: 4 },
  titleMobile: { fontSize: 20 },
  subtitle: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm, marginTop: 2 },

  twoCol: {
    flexDirection: 'row',
    gap: spacing.xl,
    padding: spacing.xl,
    flexWrap: 'wrap' as any,
    alignItems: 'flex-start',
  },
  twoColMobile: {
    flexDirection: 'column',
    padding: spacing.md,
    gap: spacing.md,
  },

  column: {
    flex: 1,
    minWidth: 280,
    backgroundColor: colors.surface.raised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.soft,
    overflow: 'hidden',
  },
  columnMobile: {
    flex: 0,
    minWidth: 0,
    width: '100%',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    backgroundColor: colors.surface.base,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.base },
  sectionSub: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.xs, marginTop: 2 },

  flagList: {},
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
  },
  flagRowLast: { borderBottomWidth: 0 },
  flagKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flagKey: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, flex: 1 },
  flagDesc: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.xs, marginTop: 3 },

  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500], padding: spacing.lg },

  settingsList: {},
  settingRow: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: 8,
  },
  settingKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.cream[200],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  docBadgeTxt: { fontFamily: fonts.support, fontSize: 9, color: colors.gold[600], letterSpacing: 1 },

  expandBtn: {
    backgroundColor: colors.cream[100],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.soft,
    padding: spacing.sm,
  },
  expandBtnTxt: { fontFamily: fonts.support, color: colors.ink[500], fontSize: fontSize.xs, lineHeight: 16 },
  expandLink: { color: colors.state.info, fontFamily: fonts.bodyMedium },
  collapseLink: { fontFamily: fonts.bodyMedium, color: colors.ink[500], fontSize: fontSize.xs, alignSelf: 'flex-end' as any },

  settingInput: {
    fontFamily: fonts.support,
    fontSize: fontSize.sm,
    color: colors.ink[800],
    backgroundColor: colors.cream[100],
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 40,
    maxHeight: 160,
    outlineStyle: 'none' as any,
  },
  settingInputLong: {
    maxHeight: 320,
    minHeight: 120,
    fontFamily: fonts.support,
    fontSize: 11,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    backgroundColor: colors.burgundy[800],
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  saveBtnDone: {
    backgroundColor: '#E6F1E8',
    borderWidth: 1,
    borderColor: '#9DC4A4',
  },
  saveTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.sm },
  saveTxtDone: { color: colors.state.success },
});
