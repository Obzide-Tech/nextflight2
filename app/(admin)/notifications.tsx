import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { sendBroadcastNotification } from '@/lib/admin';
import { colors, fonts, fontSize, spacing, radius } from '@/theme/tokens';
import { Send, Users, Smartphone, Eye, EyeOff } from 'lucide-react-native';

const AUDIENCES = [
  { value: 'all', label: 'Toda la comunidad', desc: 'Todas las usuarias registradas' },
  { value: 'students', label: 'Estudiantes', desc: 'Con matrícula activa' },
  { value: 'premium', label: 'Premium', desc: 'Suscripción premium' },
  { value: 'affiliates', label: 'Afiliadas', desc: 'Red de referidos' },
] as const;

export default function NotificationsAdmin() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [audience, setAudience] = useState<typeof AUDIENCES[number]['value']>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const onSend = async () => {
    if (!title.trim() || !body.trim()) {
      setFeedback({ kind: 'error', text: 'Título y mensaje son obligatorios.' });
      return;
    }
    setSending(true);
    setFeedback(null);
    const r = await sendBroadcastNotification({ audience, title, body, link: link || undefined });
    setSending(false);
    if (r.ok) {
      setFeedback({ kind: 'ok', text: `Enviado a ${r.count ?? '—'} destinatarias.` });
      setTitle('');
      setBody('');
      setLink('');
    } else {
      setFeedback({ kind: 'error', text: r.error ?? 'Error al enviar.' });
    }
  };

  const selectedAud = AUDIENCES.find((a) => a.value === audience);

  const previewPane = (
    <View style={styles.previewPane}>
      <View style={styles.previewHeader}>
        <Smartphone size={16} color={colors.ink[500]} strokeWidth={1.8} />
        <Text style={styles.previewHeaderTxt}>Vista previa del dispositivo</Text>
      </View>

      <View style={styles.phoneMock}>
        <View style={styles.phoneMockBar}>
          <View style={styles.phoneMockNotch} />
        </View>
        <View style={styles.phoneMockScreen}>
          <View style={styles.pushBubble}>
            <View style={styles.pushAppIcon}>
              <Text style={styles.pushAppIconTxt}>NF</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pushTitle} numberOfLines={1}>
                {title || 'Título del mensaje'}
              </Text>
              <Text style={styles.pushBody} numberOfLines={2}>
                {body || 'El mensaje aparecerá aquí tal como lo verán las alumnas.'}
              </Text>
            </View>
          </View>

          <View style={styles.audInfoBubble}>
            <Text style={styles.audInfoLabel}>Para:</Text>
            <Text style={styles.audInfoValue}>{selectedAud?.label}</Text>
            <Text style={styles.audInfoDesc}>{selectedAud?.desc}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Page header */}
      <View style={[styles.pageHeader, isMobile && styles.pageHeaderMobile]}>
        <View style={styles.iconWrap}>
          <Send size={20} color={colors.gold[400]} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Comunicaciones</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Compositor de notificaciones</Text>
          <Text style={styles.subtitle}>Push + in-app · Edge Function send-notification</Text>
        </View>
      </View>

      <View style={[styles.layout, isMobile && styles.layoutMobile]}>
        {/* Composer */}
        <View style={[styles.composerPane, isMobile && styles.composerPaneMobile]}>
          {/* Audience selector */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Users size={14} color={colors.ink[500]} strokeWidth={1.8} />
              <Text style={styles.sectionLabel}>Audiencia</Text>
            </View>
            <View style={styles.audGrid}>
              {AUDIENCES.map((a) => (
                <Pressable
                  key={a.value}
                  onPress={() => setAudience(a.value)}
                  style={[styles.audCard, audience === a.value && styles.audCardActive]}
                >
                  <Text style={[styles.audLabel, audience === a.value && styles.audLabelActive]}>{a.label}</Text>
                  <Text style={[styles.audDesc, audience === a.value && styles.audDescActive]}>{a.desc}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fields */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Título</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="Tu próximo despegue empieza hoy..."
              placeholderTextColor={colors.ink[300]}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Mensaje</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              style={[styles.input, styles.textarea]}
              multiline
              placeholder="Texto editorial que verán las alumnas..."
              placeholderTextColor={colors.ink[300]}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Link de destino (opcional)</Text>
            <TextInput
              value={link}
              onChangeText={setLink}
              style={styles.input}
              placeholder="/(app)/(tabs)/aduana"
              placeholderTextColor={colors.ink[300]}
            />
          </View>

          {feedback ? (
            <View style={[styles.feedback, feedback.kind === 'ok' ? styles.feedbackOk : styles.feedbackError]}>
              <Text style={feedback.kind === 'ok' ? styles.feedbackOkTxt : styles.feedbackErrorTxt}>
                {feedback.text}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={onSend} disabled={sending} style={[styles.sendBtn, sending && { opacity: 0.6 }]}>
              <Send size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.sendTxt}>{sending ? 'Enviando...' : 'Enviar notificación'}</Text>
            </Pressable>

            {isMobile && (
              <Pressable onPress={() => setShowPreview((v) => !v)} style={styles.previewToggleBtn}>
                {showPreview ? (
                  <EyeOff size={16} color={colors.burgundy[800]} strokeWidth={2} />
                ) : (
                  <Eye size={16} color={colors.burgundy[800]} strokeWidth={2} />
                )}
                <Text style={styles.previewToggleTxt}>{showPreview ? 'Ocultar' : 'Vista previa'}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Preview */}
        {(!isMobile || showPreview) && previewPane}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
  container: { paddingBottom: 48, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    backgroundColor: colors.surface.raised,
  },
  pageHeaderMobile: { padding: spacing.md, gap: spacing.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.burgundy[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontFamily: fonts.support, color: colors.gold[600], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' as any },
  title: { fontFamily: fonts.headingBold, color: colors.burgundy[900], fontSize: 24, marginTop: 2 },
  titleMobile: { fontSize: 18 },
  subtitle: { fontFamily: fonts.body, color: colors.ink[500], fontSize: fontSize.sm, marginTop: 2 },

  layout: {
    flexDirection: 'row',
    gap: spacing.xl,
    padding: spacing.xl,
    flexWrap: 'wrap' as any,
    alignItems: 'flex-start',
  },
  layoutMobile: {
    flexDirection: 'column',
    padding: spacing.md,
    gap: spacing.lg,
  },

  composerPane: {
    flex: 2,
    minWidth: 320,
    gap: spacing.md,
  },
  composerPaneMobile: {
    flex: 0,
    minWidth: 0,
    width: '100%',
  },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as any },

  audGrid: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: spacing.sm },
  audCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  audCardActive: {
    backgroundColor: colors.burgundy[900],
    borderColor: colors.burgundy[800],
  },
  audLabel: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm },
  audLabelActive: { color: colors.cream[100] },
  audDesc: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11 },
  audDescActive: { color: 'rgba(241,238,219,0.6)' },

  fieldLabel: {
    fontFamily: fonts.support,
    color: colors.ink[500],
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as any,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.ink[800],
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.md,
    padding: spacing.md,
    outlineStyle: 'none' as any,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' as any },

  feedback: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  feedbackOk: { backgroundColor: '#E6F1E8', borderColor: '#9DC4A4' },
  feedbackError: { backgroundColor: '#FCE3E3', borderColor: '#D89A9A' },
  feedbackOkTxt: { fontFamily: fonts.bodyMedium, color: '#2F5E3D', fontSize: fontSize.sm },
  feedbackErrorTxt: { fontFamily: fonts.bodyMedium, color: '#7A1A2C', fontSize: fontSize.sm },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap' as any,
    marginTop: 4,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.burgundy[900],
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  sendTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: fontSize.base },
  previewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.raised,
  },
  previewToggleTxt: { fontFamily: fonts.bodyMedium, color: colors.burgundy[800], fontSize: fontSize.sm },

  previewPane: {
    flex: 1,
    minWidth: 260,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.soft,
    marginBottom: spacing.md,
  },
  previewHeaderTxt: { fontFamily: fonts.support, color: colors.ink[500], fontSize: 11, letterSpacing: 1 },

  phoneMock: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#333',
    maxWidth: 320,
  },
  phoneMockBar: { height: 28, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  phoneMockNotch: { width: 80, height: 14, borderRadius: 7, backgroundColor: '#000' },
  phoneMockScreen: { padding: 16, gap: 12, minHeight: 280, backgroundColor: '#F2F2F2' },

  pushBubble: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pushAppIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.burgundy[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushAppIconTxt: { fontFamily: fonts.bodySemibold, color: colors.cream[100], fontSize: 12 },
  pushTitle: { fontFamily: fonts.bodySemibold, color: '#111', fontSize: 13, lineHeight: 17 },
  pushBody: { fontFamily: fonts.body, color: '#555', fontSize: 12, lineHeight: 16, marginTop: 2 },

  audInfoBubble: {
    backgroundColor: 'rgba(48,5,14,0.08)',
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  audInfoLabel: { fontFamily: fonts.support, color: '#666', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as any },
  audInfoValue: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: 14 },
  audInfoDesc: { fontFamily: fonts.body, color: '#666', fontSize: 11 },
});
