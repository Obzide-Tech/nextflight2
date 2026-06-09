import { StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { BrandMark } from '@/components/BrandMark';
import { colors } from '@/theme/tokens';
import { isAdminRole } from '@/lib/supabase';

export default function Index() {
  const { session, profile, roles, loading } = useAuth();

  if (loading) {
    return (
      <LinearGradient colors={[colors.burgundy[900], colors.burgundy[700]]} style={styles.container}>
        <BrandMark variant="wordmark" theme="light" size={36} />
        <ActivityIndicator color={colors.gold[400]} style={{ marginTop: 32 }} />
      </LinearGradient>
    );
  }

  if (!session) return <Redirect href="/(auth)/check-in" />;
  if (profile && !profile.onboarded_at) return <Redirect href="/(auth)/onboarding" />;
  if (isAdminRole(roles as string[])) return <Redirect href="/(admin)/dashboard" />;
  return <Redirect href="/(app)/(tabs)/terminal" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
