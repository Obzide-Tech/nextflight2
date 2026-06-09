import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/check-in" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="lesson/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="profile" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="affiliate-activate" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="payout-request" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="kyc" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="network" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="webview" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
