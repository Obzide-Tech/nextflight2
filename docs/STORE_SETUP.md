# Store setup checklist

NextFlight uses **Apple StoreKit 2** and **Google Play Billing** as the only
inbound payment rails. Until real credentials arrive, the app runs in mock mode
(feature flag `iap_mock_mode = true`) and the `useStorePurchase` hook synthesizes
sandbox transactions that flow through the same validation edge functions.

## What we need from you

### Apple

- App Store Connect access for `com.nextflight.academy` (or final bundle id).
- StoreKit 2 product configured:
  - `nf.premium.monthly` — auto-renewing monthly subscription.
- App Store Connect API key (`.p8`) for App Store Server API + SSN V2:
  - **Issuer ID**, **Key ID**, **bundle id**.
- Sandbox tester accounts (at least 2 distinct Apple IDs).
- Webhook URL for App Store Server Notifications V2:
  `https://<project>.functions.supabase.co/apple-server-notifications-v2`.

### Google

- Google Play Console access for `com.nextflight.academy`.
- Subscription product configured:
  - `nf.premium.monthly` — auto-renewing monthly subscription.
- Google service account JSON with `androidpublisher.subscription.read` scope.
- Pub/Sub topic + subscription for RTDN, with push endpoint:
  `https://<project>.functions.supabase.co/google-rtdn`.
- License tester emails.

## What we already have

- `validate-apple-receipt` + `validate-google-receipt` edge functions, both wired
  through `useStorePurchase` mock mode.
- `apple-server-notifications-v2` + `google-rtdn` webhook handlers (decode, reconcile
  `subscriptions`, audit log).
- Subscription→role sync trigger (`nf_subscriptions_sync_role`).
- Restore + manage-subscription deep links in Aduana.

## Switching to production

1. Set `feature_flags.iap_mock_mode = false`.
2. Replace mock receipt construction in `hooks/useStorePurchase.ts` with real
   StoreKit 2 / Google Billing flows (recommend `expo-iap` once available, otherwise
   `react-native-iap`). Keep the call to `validate-*-receipt` afterwards.
3. Deploy webhook URLs in App Store Connect and Google Pub/Sub.
4. Update `ARCHITECTURE.md` if the flow changes.
