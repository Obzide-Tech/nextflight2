import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { fetchFeatureFlags, fetchSystemSettings, setFeatureFlag, setSystemSetting } from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { Zap, SlidersHorizontal, Save, ToggleRight } from 'lucide-react-native';

export default function SettingsAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [flags, setFlags] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
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
            <View style={[styles.sectionIcon, { backgroundColor: '#F0F4FF' }]}>
              <Zap size={16} color='#3A547A' strokeWidth={1.8} />
            </View>
            <View>
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
                  <View style={{ flex: 1 }}>
                    <View style={styles.flagKeyRow}>
                      <ToggleRight size={13} color={f.enabled ? '#3A547A' : colors.ink[300]} strokeWidth={1.8} />
                      <Text style={styles.flagKey}>{f.key}</Text>
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
            <View>
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
                return (
                  <View key={s.key} style={styles.settingRow}>
                    <Text style={styles.flagKey}>{s.key}</Text>
                    {s.description ? <Text style={styles.flagDesc}>{s.description}</Text> : null}
                    <TextInput
                      value={drafts[s.key] ?? ''}
                      onChangeText={(v) => setDrafts((d) => ({ ...d, [s.key]: v }))}
                      style={styles.settingInput}
                      multiline
                      placeholderTextColor={colors.ink[300]}
                    />
                    <Pressable
                      onPress={() => onSaveSetting(s.key)}
                      style={[styles.saveBtn, isSaved && styles.saveBtnDone, saving === s.key && { opacity: 0.6 }]}
                      disabled={saving === s.key}
                    >
                      <Save size={13} color={isSaved ? '#2C5E3C' : colors.cream[100]} strokeWidth={2} />
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
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
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
    backgroundColor: '#FAFAF5',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  flagKey: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm },
  flagDesc: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.xs, marginTop: 3 },

  emptyTxt: { fontFamily: fonts.body, color: colors.ink[500], padding: spacing.lg },

  settingsList: {},
  settingRow: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    gap: 8,
  },

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
    outlineStyle: 'none' as any,
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
  saveTxtDone: { color: '#2C5E3C' },
});
