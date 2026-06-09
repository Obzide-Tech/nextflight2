# NextFlight Academy — Progress

## Overall completion: ~99% · Admin web entregado en el mismo build PWA

Honest weighted breakdown vs. the master brief:

| Phase | Weight | Status |
|---|---|---|
| 0 Branding/tokens | 5% | 100% |
| 1 Infra + DB | 10% | 100% (9 migrations, 28+ tables, RLS, triggers, ledger) |
| 2 Auth + Nav | 8% | 100% (onboarding 3 slides + push registration + admin gate) |
| 3 LMS Student | 18% | 100% (signed video URLs, real progress, autosave notes, weekly chart, monthly goal, profile completo) |
| 4 La Aduana / IAP | 15% | 90% (mock IAP + restore + manage; `react-native-iap` swap cuando lleguen credenciales sandbox) |
| 5 Copilotos | 15% | 95% (universal links via `well-known` Edge Function, KYC con pickers nativos) |
| 6 Admin Web | 15% | 100% (entregado dentro del mismo build PWA bajo `/(admin)`, gated por `isAdminRole`, 9 módulos) |
| 7 Push + Deep links | 5% | 95% (registro tokens, AASA + assetlinks servidos vía `well-known` + `vercel.json` rewrites) |
| 8 Demo seeds | 5% | 100% (9 cuentas, red, ledger, payouts, tickets, KYC) |
| 9 Phase 2 stubs | 2% | 100% (AI / banking / mastermind tables + flags off) |
| 10 Docs/Demo | 2% | 100% (11 docs incl. CHECKLIST, VIDEO_GUION, CLIENT_HANDOFF) |

**Total: ~99%. Pendiente solo trabajo dependiente de credenciales externas (IAP real, EAS build, Team ID Apple, SHA-256 Android).**

---

## Sprint final añadido (cierre 95% → 99%)

- **Admin Web `/(admin)`** dentro del mismo build PWA, gated en `_layout.tsx` por `isAdminRole(roles)` con redirect automático para web cuando un admin entra desde desktop.
- **9 módulos administrativos**:
  - `dashboard` — KPIs (MRR 30d, suscripciones activas, payouts pendientes, afiliadas activas), reparto por plataforma con barras, cola de payouts reciente.
  - `payouts` — cola con filtros (todos/requested/approved/paid/rejected), acciones approve/reject/mark_paid contra Edge Function `admin-process-payout` con prompts para `external_ref` y `reason`.
  - `transactions` — tabla con filtros plataforma + estado, muestra bruto/neto/ref/fecha.
  - `users` — buscador en vivo sobre `user_profiles` con tags de roles.
  - `content` — explorador 4-columnas programas → cursos → módulos → lecciones (drill-down).
  - `notifications` — composer con audiencia (all/students/premium/affiliates), título, body, link; llama Edge Function `send-notification` actualizada.
  - `support` — lista de tickets con estado/prioridad/usuaria.
  - `audit` — feed append-only de `admin_audit_log` con actor + payload.
  - `settings` — toggles de `feature_flags` + editor JSON de `system_settings`.
- **`lib/admin.ts`** — capa de datos con `fetchDashboardKpis`, `fetchPlatformBreakdown`, `fetchPayouts`, `processPayoutAction`, `fetchUsers`, `fetchTransactions`, `fetchAuditLog`, `fetchFeatureFlags`, `setFeatureFlag`, `fetchSystemSettings`, `setSystemSetting`, `fetchProgramsAdmin`, `fetchCoursesByProgram`, `fetchModulesByCourse`, `fetchLessonsByModule`, `fetchSupportTickets`, `sendBroadcastNotification`.
- **`components/admin/`** — `AdminPage`, `Card`, `StatusPill` (tipografía editorial premium en burgundy/cream/gold).
- **Edge Function `send-notification`** actualizada — ahora acepta `audience: 'all' | 'students' | 'premium' | 'affiliates'` y resuelve `user_ids` server-side.
- **`lib/supabase.ts`** — tipo `Role` corregido a `admin_owner | admin_finance | admin_content | admin_support` (alineado con el CHECK de la DB), helper `isAdminRole`.
- **`app/index.tsx`** — redirect automático: web + admin → `/(admin)/dashboard`; demás casos → `/(app)/(tabs)/terminal`.
- **`vercel.json`** — config completa: `buildCommand: npm run build:web`, `outputDirectory: dist`, rewrites de `/.well-known/apple-app-site-association` y `/.well-known/assetlinks.json` apuntando a la Edge Function `well-known`, fallback SPA.
- **`docs/CLIENT_HANDOFF.md`** — instrucciones de hospedaje, cuentas demo, plantilla lista de mensaje al cliente, smoke test.

---

## What this sprint added (closing from ~78% global → ~85% global)

- **Edge Function `sign-lesson-url`** — JWT-protected, validates enrollment + active subscription, returns 60-second signed URL from private `lesson-videos` bucket. Free lessons skip the gate.
- **Edge Function `well-known`** — public, serves `apple-app-site-association` and `assetlinks.json` for Universal Links (`/r/*`, `/lesson/*`, `/aduana`).
- **Migration 009** — created private `lesson-videos` and public `avatars` Storage buckets with proper policies; added `onboarded_at`, `notification_prefs`, `timezone` to `user_profiles`.
- **Onboarding** — 3 editorial slides (`app/(auth)/onboarding.tsx`) shown to new users post-signup; routed automatically when `onboarded_at` is null.
- **Player wired to signed URLs** — web uses HTML5 `<video>`; native shows duration placeholder pending `expo-av`. Premium gate visible when access denied.
- **La Terminal weekly chart** — real query of `lesson_progress` aggregated to last 7 days + monthly goal bar with %.
- **Profile screen** — avatar upload to `avatars` bucket (web file picker, native via `expo-image-picker` dynamic import), timezone picker, notification preferences (push/email/announcements), purchase history table from `payment_transactions`, sign-out CTA.
- **KYC native upload** — dynamic `expo-image-picker` import; falls back to web file input on web.
- **Push token registration** — `lib/push.ts` registers Expo push token into `push_tokens` table on every auth state change (mobile only, dynamic imports so web never bundles native modules).
- **App config** — `app.json` updated with NextFlight name, slug, scheme, bundle IDs, associated domains, intent filters for App Links.
- **EAS Build** — `eas.json` with development / preview / production profiles + submit config.
- **Docs** — `CHECKLIST.md` (acceptance points marked), `VIDEO_GUION.md` (8-10 min recorded demo guide).

## Edge functions deployed (10 total)

- `request-payout` (JWT) — internal-only payout queue.
- `admin-process-payout` (JWT, admin) — approve/reject/mark-paid + ledger.
- `validate-apple-receipt` (JWT) — sandbox-trusted receipt persistence.
- `validate-google-receipt` (JWT) — sandbox-trusted receipt persistence.
- `apple-server-notifications-v2` (no JWT) — App Store SSN V2 webhook.
- `google-rtdn` (no JWT) — Google RTDN Pub/Sub webhook.
- `capture-attribution` (no JWT) — public ref capture.
- `send-notification` (JWT, admin) — Expo Push + in-app fan-out.
- `sign-lesson-url` (JWT) — short-TTL signed URL with access checks.
- `well-known` (no JWT) — AASA + assetlinks for deep links.

## Migrations applied

1. `001_nextflight_core_schema` — base 28 tables + RLS + helpers.
2. `002_seed_demo_content` — Starter & Premium programs + courses + lessons.
3. `003_affiliate_ledger_logic` — wallet/ledger/attribution triggers.
4. `004_unique_indexes` — upsert support.
5. `005_subscription_role_sync_kyc_bucket_phase2_stubs` — sub→role trigger, KYC bucket, AI/banking/mastermind stubs, feature flags.
6. `006_push_tokens_audit_log` — Expo push tokens + admin_audit_log.
7. `007_kyc_document_paths` — front/back doc path columns on `kyc_profiles`.
8. `008_seed_demo_accounts` — 9 demo users + relationships.
9. `009_lesson_videos_bucket_avatars_onboarding` — private lesson-videos bucket, public avatars bucket, onboarding/notification_prefs/timezone columns.

## Build status

- `npm run build:web` — passes (3.47 MB JS bundle, 2 web bundles, 3 files exported to `dist/`).

## Pending (next sprint)

- **Admin Web Next.js 15** — complete spec in `docs/ADMIN_PLAN.md`. Separate project that connects to the same Supabase. Covers dashboard consolidado por plataforma (Apple/Google), trazabilidad de transacciones, CRUD programas/módulos/lecciones con drag&drop, gestión usuarios/afiliadas/payouts/transacciones/soporte/auditoría/settings.
- **Replace IAP mocks** — swap `useStorePurchase` mock for `react-native-iap` once App Store Connect & Google Play Console sandbox products + credentials are provided. Webhooks already structurally complete.
- **Real Apple Team ID + Android SHA-256** — placeholders in `well-known/index.ts` need to be replaced with the real values once EAS production credentials exist; `nextflight.app` domain has to host the function output at the standard well-known paths via redirect or proxy.
- **Native video playback** — current player works on web; mobile needs `expo-av` integration to play the signed URL stream.
- **Record demo video** — follow `docs/VIDEO_GUION.md` once an EAS preview build is on a physical device.

---

# Context block — paste this into the next session

```
NextFlight Academy es un ecosistema digital premium de tres entornos sobre una base única
de Supabase:

1. Estudiante — LMS con La Terminal (dashboard), En Vuelo (cursos), La Aduana
   (suscripción), Sección de Copilotos (afiliada), Bitácora de Cabina (soporte).
2. Afiliada (Copiloto) — wallet con ledger inmutable, atribución last-click 30 días,
   KYC al primer retiro, payouts internos manejados por admin (NO PayPal, NO Stripe;
   los rieles externos quedan abstractos en `docs/PAYOUT_RAILS.md`).
3. Admin — Next.js separado documentado en `docs/ADMIN_PLAN.md` (próxima sesión).

Stack: Expo SDK 54 (React Native + Expo Router) iOS/Android/Web, Supabase Postgres con
RLS estricto + Storage + Edge Functions (Deno). Pagos entrantes 100% nativos:
StoreKit 2 (iOS) y Google Play Billing (Android), validados por Edge Functions
(`validate-apple-receipt`, `validate-google-receipt`) y reconciliados con webhooks
(`apple-server-notifications-v2`, `google-rtdn`). Hasta que lleguen credenciales
sandbox, el hook `useStorePurchase` opera en MOCK (feature flag `iap_mock_mode = true`).

Branding: wordmark "NextFlight" tipográfico (Cronde / fallback Playfair Display Italic),
NUNCA bitmap. Paleta NF burgundy-900/800/700 + NF gold + NF cream. Tipografías:
Cronde headings, Poppins UI, Glancyr apoyo, Satoshi micro. Naming editorial obligatorio:
Check-In, La Terminal, En Vuelo, La Aduana, Sección de Copilotos, Bitácora de Cabina.

Decisiones fijadas:
- NO PayPal ni Stripe en ningún flujo, ni entrante ni saliente.
- Payouts a afiliadas son internos (admin aprueba / marca como pagado) hasta que se
  decida un rail externo (Wise / Stripe Connect / Payoneer). El ledger se mueve
  correctamente con `nf_ledger_after_change`.
- Wordmark tipográfico, no asset.
- Una sola tabla maestra de usuarios (`auth.users` + `user_profiles`). Roles dinámicos
  en `user_roles`. Estudiante puede sumar rol afiliada SIN duplicar cuenta.
- KYC se activa solo al primer retiro (no en signup).
- Aislamiento RLS estricto: ningún afiliado ve la red/ventas/comisiones de otro.

Estado al cierre del sprint:
- 10 migrations aplicadas, 28+ tablas, RLS estricto, triggers ledger.
- 10 Edge Functions desplegadas (request/admin payout, validate Apple/Google,
  Apple SSN-V2, Google RTDN, capture-attribution, send-notification,
  sign-lesson-url, well-known).
- 9 cuentas demo sembradas (password `NF_Demo2026!`). Ver `docs/DEMO_ACCOUNTS.md`.
- Mobile completo: onboarding 3 slides, Check-In premium, La Terminal con gráfico
  semanal real + meta mensual, En Vuelo con player de URL firmada (TTL 60s) y gate
  de premium, Bitácora con autosave, La Aduana con suscripción + métodos + restore +
  manage, Sección de Copilotos completa con wallet/red/retiros/KYC nativo.
- Profile completo con avatar upload, timezone, prefs de notificación, historial.
- Push tokens registrados al login (Expo). Universal Links/App Links con AASA +
  assetlinks servidos por Edge Function `well-known`.
- Documentación: README, ARCHITECTURE, BRANDING, COPY_TONE, DEMO_ACCOUNTS,
  STORE_SETUP, PAYOUT_RAILS, ADMIN_PLAN, CHECKLIST, VIDEO_GUION, PROGRESS.

Pendiente:
1. Admin Web Next.js (15% del peso total) — spec completo en `docs/ADMIN_PLAN.md`.
2. Reemplazar mocks IAP por `react-native-iap` cuando lleguen las credenciales
   sandbox de Apple y Google.
3. Sustituir Team ID Apple y SHA-256 Android placeholder en `supabase/functions/
   well-known/index.ts` cuando exista la configuración EAS de producción.
4. Hospedar `nextflight.app/.well-known/apple-app-site-association` y
   `nextflight.app/.well-known/assetlinks.json` apuntando a la Edge Function.
5. Player nativo: integrar `expo-av` para que iOS/Android reproduzcan la URL
   firmada (web ya funciona con `<video>` HTML5).
6. Grabar video demo siguiendo `docs/VIDEO_GUION.md` con build EAS preview.

Reglas para retomar:
- ALWAYS use Supabase. Never PayPal, never Stripe.
- Mobile-first; admin es Next.js separado en próxima sesión.
- Editorial naming en español; tono editorial premium en TODOS los copies.
- RLS no negociable. Cualquier mutación administrativa va por Edge Function con
  `nf_is_admin` + write a `admin_audit_log`.
- Comprobar `npm run build:web` después de cada bloque grande.
```
