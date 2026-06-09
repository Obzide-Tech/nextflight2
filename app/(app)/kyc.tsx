import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Upload, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';

const DOC_TYPES = [
  { id: 'passport', label: 'Pasaporte' },
  { id: 'national_id', label: 'Cédula / DNI' },
  { id: 'driver_license', label: 'Licencia' },
];

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Sin iniciar',
  pending: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

type Side = 'front' | 'back';

export default function Kyc() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [legalName, setLegalName] = useState('');
  const [documentType, setDocumentType] = useState('passport');
  const [documentNumber, setDocumentNumber] = useState('');
  const [country, setCountry] = useState('');
  const [dob, setDob] = useState('');
  const [status, setStatus] = useState('not_started');
  const [frontPath, setFrontPath] = useState('');
  const [backPath, setBackPath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSide, setUploadingSide] = useState<Side | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('kyc_profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setLegalName(data.legal_name ?? '');
        setDocumentType(data.document_type || 'passport');
        setDocumentNumber(data.document_number ?? '');
        setCountry(data.country ?? '');
        setDob(data.date_of_birth ?? '');
        setStatus(data.status ?? 'not_started');
        setFrontPath(data.front_document_path ?? '');
        setBackPath(data.back_document_path ?? '');
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const onPickFile = async (side: Side) => {
    if (Platform.OS === 'web') {
      const input = side === 'front' ? frontInputRef.current : backInputRef.current;
      input?.click();
      return;
    }

    if (!user) return;
    setError(null);
    try {
      const ImagePicker = await import('expo-image-picker').catch(() => null);
      if (!ImagePicker) {
        setError('Instala expo-image-picker en el dev build para subir documentos desde el móvil.');
        return;
      }
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('Necesitamos permiso para acceder a tus fotos.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        base64: false,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      setUploadingSide(side);
      const ext = asset.uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
      const path = `${user.id}/${side}-${Date.now()}.${ext}`;
      const file = await fetch(asset.uri).then((r) => r.blob());
      const { error: upErr } = await supabase.storage
        .from('kyc-documents')
        .upload(path, file, { upsert: true, contentType: asset.mimeType ?? `image/${ext}` });
      if (upErr) {
        setError(upErr.message);
        setUploadingSide(null);
        return;
      }
      if (side === 'front') setFrontPath(path);
      else setBackPath(path);
      await supabase.from('kyc_profiles').upsert({
        id: user.id,
        [side === 'front' ? 'front_document_path' : 'back_document_path']: path,
        updated_at: new Date().toISOString(),
      });
      setUploadingSide(null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo subir el archivo.');
      setUploadingSide(null);
    }
  };

  const onFileChange = async (side: Side, e: any) => {
    if (!user) return;
    const file: File | undefined = e?.target?.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingSide(side);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${side}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setError(upErr.message);
      setUploadingSide(null);
      return;
    }

    if (side === 'front') setFrontPath(path);
    else setBackPath(path);

    await supabase.from('kyc_profiles').upsert({
      id: user.id,
      [side === 'front' ? 'front_document_path' : 'back_document_path']: path,
      updated_at: new Date().toISOString(),
    });

    setUploadingSide(null);
    e.target.value = '';
  };

  const onSubmit = async () => {
    if (!user) return;
    setError(null);
    if (!legalName || !documentNumber || !country || !dob) {
      setError('Completa todos los campos para enviar tu KYC.');
      return;
    }
    if (!frontPath) {
      setError('Sube la foto frontal de tu documento.');
      return;
    }
    setSubmitting(true);
    const { error: upErr } = await supabase.from('kyc_profiles').upsert({
      id: user.id,
      legal_name: legalName,
      document_type: documentType,
      document_number: documentNumber,
      country,
      date_of_birth: dob,
      front_document_path: frontPath,
      back_document_path: backPath,
      status: 'pending',
      updated_at: new Date().toISOString(),
    });
    if (upErr) {
      setError(upErr.message);
      setSubmitting(false);
      return;
    }
    setStatus('pending');
    setSavedAt(new Date().toLocaleTimeString());
    setSubmitting(false);
  };

  const renderUploadButton = (side: Side, currentPath: string) => {
    const isUploading = uploadingSide === side;
    const hasFile = !!currentPath;
    return (
      <TouchableOpacity style={[styles.uploadBtn, hasFile && styles.uploadBtnDone]} onPress={() => onPickFile(side)} disabled={isUploading}>
        {isUploading ? (
          <ActivityIndicator color={colors.gold[400]} />
        ) : hasFile ? (
          <>
            <Check size={16} color={colors.state.success} strokeWidth={2} />
            <Text style={styles.uploadDoneText}>{side === 'front' ? 'Frente cargado' : 'Reverso cargado'}</Text>
            <Text style={styles.uploadReplace}>Reemplazar</Text>
          </>
        ) : (
          <>
            <Upload size={16} color={colors.gold[400]} strokeWidth={1.6} />
            <Text style={styles.uploadText}>Subir {side === 'front' ? 'frente del documento' : 'reverso del documento'}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={[colors.burgundy[900], colors.burgundy[800]]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.cream[100]} />
          </TouchableOpacity>
          <Text style={styles.crumb}>Verificación KYC</Text>
        </View>

        {Platform.OS === 'web' ? (
          <>
            {/* @ts-ignore web-only file input */}
            <input ref={frontInputRef as any} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => onFileChange('front', e)} />
            {/* @ts-ignore web-only file input */}
            <input ref={backInputRef as any} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => onFileChange('back', e)} />
          </>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.gold[400]} style={{ marginTop: spacing.xxl }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={28} color={colors.gold[400]} strokeWidth={1.4} />
            </View>
            <Text style={styles.title}>Identidad confirmada, vuelo seguro</Text>
            <Text style={styles.body}>
              Necesitamos verificar tu identidad antes de procesar tu primer retiro. La revisión toma entre
              24 y 72 horas.
            </Text>

            <View style={[styles.statusPill, statusBg(status)]}>
              <Text style={styles.statusText}>{STATUS_LABEL[status] ?? status}</Text>
            </View>

            <Text style={styles.label}>Nombre legal completo</Text>
            <View style={styles.field}>
              <TextInput style={styles.input} value={legalName} onChangeText={setLegalName} placeholder="Tal como aparece en tu documento" placeholderTextColor={colors.cream[200]} editable={!submitting} />
            </View>

            <Text style={styles.label}>Tipo de documento</Text>
            <View style={styles.docTabs}>
              {DOC_TYPES.map((d) => {
                const active = documentType === d.id;
                return (
                  <TouchableOpacity key={d.id} onPress={() => setDocumentType(d.id)} style={[styles.docTab, active && styles.docTabActive]}>
                    <Text style={[styles.docTabText, active && styles.docTabTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Número de documento</Text>
            <View style={styles.field}>
              <TextInput style={styles.input} value={documentNumber} onChangeText={setDocumentNumber} placeholder="Ej. AB123456" placeholderTextColor={colors.cream[200]} editable={!submitting} />
            </View>

            <Text style={styles.label}>País de emisión</Text>
            <View style={styles.field}>
              <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Ej. México" placeholderTextColor={colors.cream[200]} editable={!submitting} />
            </View>

            <Text style={styles.label}>Fecha de nacimiento (YYYY-MM-DD)</Text>
            <View style={styles.field}>
              <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="1995-08-21" placeholderTextColor={colors.cream[200]} editable={!submitting} />
            </View>

            <Text style={styles.label}>Documento de identidad</Text>
            {renderUploadButton('front', frontPath)}
            {documentType !== 'passport' ? (
              <View style={{ marginTop: spacing.sm }}>{renderUploadButton('back', backPath)}</View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {savedAt ? <Text style={styles.success}>Enviado a las {savedAt}. Te avisaremos cuando termine la revisión.</Text> : null}

            <TouchableOpacity style={styles.cta} onPress={onSubmit} disabled={submitting || status === 'approved'}>
              {submitting ? <ActivityIndicator color={colors.burgundy[900]} /> : (
                <Text style={styles.ctaText}>{status === 'approved' ? 'KYC aprobado' : 'Enviar verificación'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function statusBg(status: string) {
  switch (status) {
    case 'approved':
      return { backgroundColor: 'rgba(63,122,79,0.2)', borderColor: colors.state.success };
    case 'rejected':
      return { backgroundColor: 'rgba(156,34,56,0.25)', borderColor: colors.state.error };
    case 'pending':
      return { backgroundColor: 'rgba(184,134,47,0.2)', borderColor: colors.state.warning };
    default:
      return { backgroundColor: 'rgba(255,251,224,0.08)', borderColor: colors.gold[600] };
  }
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,251,224,0.06)' },
  crumb: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 3, color: colors.gold[400], textTransform: 'uppercase' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  iconCircle: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,131,82,0.16)', borderColor: colors.gold[600], borderWidth: 1, marginVertical: spacing.md },
  title: { fontFamily: fonts.headingItalic, fontSize: fontSize.xl, color: colors.cream[100], textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.cream[200], lineHeight: 22, textAlign: 'center', marginTop: spacing.sm },
  statusPill: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, marginTop: spacing.md, marginBottom: spacing.md },
  statusText: { fontFamily: fonts.supportMedium, fontSize: 11, letterSpacing: 2, color: colors.cream[100], textTransform: 'uppercase' },
  label: { fontFamily: fonts.supportMedium, fontSize: 11, color: colors.gold[400], letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginTop: spacing.md },
  field: { backgroundColor: 'rgba(255,251,224,0.06)', borderColor: colors.burgundy[700], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md },
  input: { fontFamily: fonts.body, color: colors.cream[100], fontSize: fontSize.base, paddingVertical: 14 },
  docTabs: { flexDirection: 'row', gap: spacing.sm },
  docTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill, borderColor: colors.burgundy[700], borderWidth: 1 },
  docTabActive: { backgroundColor: colors.gold[400], borderColor: colors.gold[400] },
  docTabText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.cream[200] },
  docTabTextActive: { color: colors.burgundy[900] },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.gold[600], borderStyle: 'dashed', backgroundColor: 'rgba(255,251,224,0.04)' },
  uploadBtnDone: { borderStyle: 'solid', borderColor: colors.state.success, backgroundColor: 'rgba(63,122,79,0.08)' },
  uploadText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.cream[100] },
  uploadDoneText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.cream[100] },
  uploadReplace: { fontFamily: fonts.supportMedium, fontSize: 10, letterSpacing: 1, color: colors.gold[400], textTransform: 'uppercase' },
  error: { fontFamily: fonts.body, color: colors.state.error, fontSize: fontSize.sm, marginTop: spacing.sm },
  success: { fontFamily: fonts.body, color: colors.state.success, fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  cta: { backgroundColor: colors.gold[400], borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg },
  ctaText: { fontFamily: fonts.bodySemibold, color: colors.burgundy[900], fontSize: fontSize.sm, letterSpacing: 0.5 },
});
