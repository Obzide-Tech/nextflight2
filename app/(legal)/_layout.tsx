import { Stack } from 'expo-router';

export default function LegalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="refund-policy" />
      <Stack.Screen name="income-disclaimer" />
      <Stack.Screen name="conduct" />
      <Stack.Screen name="affiliate-agreement" />
      <Stack.Screen name="affiliate-guidelines" />
      <Stack.Screen name="enrollment-agreement" />
    </Stack>
  );
}
