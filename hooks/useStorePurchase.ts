import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export type StorePlatform = 'apple' | 'google' | 'web';

type PurchaseResult = { ok: true; mode: 'mock' | 'native' } | { ok: false; error: string };

// PRODUCTION: When native_iap_enabled flag is true and running on device,
// import and use expo-in-app-purchases or react-native-iap here.
// The mock mode below synthesizes sandbox purchases for testing.
// Apple/Google Play are the ONLY legal checkout methods for in-app content.

const APPLE_SUB_MANAGE_URL = 'https://apps.apple.com/account/purchases';
const GOOGLE_SUB_MANAGE_URL = 'https://play.google.com/store/account/orderhistory';

export function useStorePurchase() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [nativeIapEnabled, setNativeIapEnabled] = useState(false);

  const platform: StorePlatform = Platform.OS === 'ios' ? 'apple' : Platform.OS === 'android' ? 'google' : 'web';

  useEffect(() => {
    supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'native_iap_enabled')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.enabled) setNativeIapEnabled(true);
      });
  }, []);

  const purchase = useCallback(async (productId: string): Promise<PurchaseResult> => {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      if (platform === 'web') {
        const msg = 'Las compras solo están disponibles en iOS o Android. Abre la app en tu dispositivo.';
        setInfo(msg);
        return { ok: false, error: msg };
      }

      // PRODUCTION (native_iap_enabled=true): import expo-in-app-purchases or
      // react-native-iap, request product from store, present native payment sheet,
      // then validate receipt server-side. Apple/Google are the ONLY legal checkout.
      // MOCK MODE (current): synthesize a sandbox purchase for testing.
      const now = Date.now();
      const expires = now + 30 * 24 * 60 * 60 * 1000;

      if (platform === 'apple') {
        const txId = `mock-tx-${now}`;
        const { data, error: fnErr } = await supabase.functions.invoke('validate-apple-receipt', {
          body: {
            transaction_id: txId,
            original_transaction_id: txId,
            product_id: productId,
            purchase_date: new Date(now).toISOString(),
            expires_date: new Date(expires).toISOString(),
            signed_transaction_info: null,
          },
        });
        if (fnErr || (data as any)?.error) {
          const msg = fnErr?.message ?? (data as any)?.error ?? 'No se pudo validar la compra';
          setError(msg);
          return { ok: false, error: msg };
        }
        setInfo('Compra registrada en modo sandbox.');
        return { ok: true, mode: 'mock' };
      }

      const purchaseToken = `mock-token-${now}`;
      const { data, error: fnErr } = await supabase.functions.invoke('validate-google-receipt', {
        body: {
          purchase_token: purchaseToken,
          product_id: productId,
          order_id: `mock-order-${now}`,
          purchase_date: new Date(now).toISOString(),
          expires_date: new Date(expires).toISOString(),
        },
      });
      if (fnErr || (data as any)?.error) {
        const msg = fnErr?.message ?? (data as any)?.error ?? 'No se pudo validar la compra';
        setError(msg);
        return { ok: false, error: msg };
      }
      setInfo('Compra registrada en modo sandbox.');
      return { ok: true, mode: 'mock' };
    } finally {
      setBusy(false);
    }
  }, [platform]);

  const restore = useCallback(async () => {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      if (platform === 'web') {
        const msg = 'Restaurar compras solo está disponible en iOS o Android.';
        setInfo(msg);
        return;
      }

      // PRODUCTION: query StoreKit 2 / Google Billing for entitlements and re-validate
      // each receipt through the validate-* edge functions. Sandbox-friendly stub.
      setInfo(
        platform === 'apple'
          ? 'Restauración solicitada a Apple. Si realizaste tu compra anteriormente, reaparecerá en breve.'
          : 'Restauración solicitada a Google Play. Si realizaste tu compra anteriormente, reaparecerá en breve.'
      );
    } finally {
      setBusy(false);
    }
  }, [platform]);

  const openManageSubscription = useCallback(async () => {
    const url = platform === 'google' ? GOOGLE_SUB_MANAGE_URL : APPLE_SUB_MANAGE_URL;
    try {
      await Linking.openURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [platform]);

  return { platform, busy, error, info, purchase, restore, openManageSubscription };
}
