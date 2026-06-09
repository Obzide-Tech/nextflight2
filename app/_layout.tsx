import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Inject Rewardful tracking snippet on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const existing = document.querySelector('script[data-rewardful]');
  if (!existing) {
    (window as any).rewardful = (window as any).rewardful || function(...args: unknown[]) {
      ((window as any).rewardful.q = (window as any).rewardful.q || []).push(args);
    };
    (window as any)._rwq = (window as any).rewardful;
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-rewardful', 'bbe067');
    script.src = 'https://r.wdfl.co/rw.js';
    document.head.appendChild(script);
  }
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="r" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
