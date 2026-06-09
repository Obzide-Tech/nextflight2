import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { Linking } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

export default function WebViewScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const router = useRouter();

  const decodedUrl = url ? decodeURIComponent(url) : '';
  const decodedTitle = title ? decodeURIComponent(title) : 'Recurso';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <ChevronLeft size={20} color={colors.cream[100]} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{decodedTitle}</Text>
            <TouchableOpacity
              onPress={() => decodedUrl && Linking.openURL(decodedUrl)}
              style={styles.externalBtn}
              hitSlop={8}
            >
              <ExternalLink size={18} color={colors.gold[400]} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.webFallback}>
          <ExternalLink size={40} color={colors.gold[400]} strokeWidth={1.5} />
          <Text style={styles.webFallbackTitle}>{decodedTitle}</Text>
          <Text style={styles.webFallbackSub}>
            Toca el botón para abrir este recurso en una nueva pestaña.
          </Text>
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => decodedUrl && Linking.openURL(decodedUrl)}
            activeOpacity={0.85}
          >
            <ExternalLink size={16} color={colors.burgundy[900]} strokeWidth={2} />
            <Text style={styles.openBtnText}>Abrir recurso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={20} color={colors.cream[100]} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{decodedTitle}</Text>
          <TouchableOpacity
            onPress={() => decodedUrl && Linking.openURL(decodedUrl)}
            style={styles.externalBtn}
            hitSlop={8}
          >
            <ExternalLink size={18} color={colors.gold[400]} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      {decodedUrl ? (
        <WebView
          source={{ uri: decodedUrl }}
          style={{ flex: 1 }}
          allowsBackForwardNavigationGestures
          startInLoadingState
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.burgundy[900],
  },
  headerSafe: {
    backgroundColor: colors.burgundy[900],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.burgundy[700],
    minHeight: 52,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,251,224,0.07)',
    borderWidth: 1,
    borderColor: colors.burgundy[700],
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.cream[100],
  },
  externalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(175,137,86,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(175,137,86,0.3)',
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  webFallbackTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.md,
    color: colors.cream[100],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  webFallbackSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.cream[200],
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold[400],
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    marginTop: spacing.sm,
  },
  openBtnText: {
    fontFamily: fonts.bodySemibold,
    fontSize: fontSize.sm,
    color: colors.burgundy[900],
  },
});
