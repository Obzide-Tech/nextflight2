import { Platform } from 'react-native';
import { supabase } from './supabase';

let registered = false;

export async function registerPushTokenIfPossible(userId: string) {
  if (registered) return;
  if (Platform.OS === 'web') return;

  try {
    const Notifications = await import('expo-notifications').catch(() => null);
    const Device = await import('expo-device').catch(() => null);
    if (!Notifications || !Device) return;

    if (!Device.isDevice) return;

    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    if (!token) return;

    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        expo_token: token,
        platform: Platform.OS,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'expo_token' }
    );
    registered = true;
  } catch {
    // notifications module not present in this build (e.g. dev client without plugin) — silently skip.
  }
}
