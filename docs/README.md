# NextFlight Academy

A premium digital ecosystem for an aviation-themed learning + affiliate experience.
Single Supabase backend powering three connected surfaces:

1. **Mobile app (this repo)** — Expo + React Native + expo-router. Student LMS, affiliate
   wallet, IAP-driven subscriptions, KYC, network view, payout requests.
2. **Admin web (separate repo, planned)** — Next.js 15 (App Router) on the same Supabase.
   Admin-only dashboard for finance, content CRUD, affiliate ops, support, settings.
3. **Public web** — marketing landing + universal/app links for referral capture.

## Why this stack

- **Expo from day one** — single codebase for iOS, Android, and web preview. Native
  StoreKit 2 (Apple) and Google Play Billing are mandated for inbound subscriptions
  (Apple's digital-content rule). Web preview runs in mock mode.
- **Supabase** — Postgres, Auth, Storage, Edge Functions. Triggers do the heavy
  lifting (commission accrual, wallet recompute, role sync).
- **No Stripe / no PayPal** — Apple Pay and Google Pay are the only inbound rails.
  Outbound payouts are admin-managed (internal credit) until a final rail is chosen
  (Wise, Stripe Connect, Payoneer, manual bank transfer).

## Top-level directories

```
app/              expo-router routes (auth + tabs + modals)
components/       reusable UI components
contexts/         React contexts (Auth)
hooks/            shared hooks (useFrameworkReady, useStorePurchase)
lib/              data + supabase client
theme/            design tokens
supabase/
  migrations/     numbered SQL migrations (apply with apply_migration)
  functions/      edge functions (deploy with deploy_edge_function)
docs/             this folder — operational + architectural docs
```

## Read next

- `ARCHITECTURE.md` — system shape, tables, edge functions, triggers.
- `BRANDING.md` — visual language, fonts, colors, voice.
- `COPY_TONE.md` — copywriting rules and aviation metaphors.
- `DEMO_ACCOUNTS.md` — credentials for the 9 seeded demo users.
- `STORE_SETUP.md` — Apple/Google sandbox checklist when credentials arrive.
- `PAYOUT_RAILS.md` — open question on outbound rails + decision matrix.
- `ADMIN_PLAN.md` — Next.js admin scaffold spec (deferred to next sprint).

## Local development

This is a Bolt-managed Expo project; the dev server is started for you. To verify a
production build run:

```
npm run build:web
```

All Supabase secrets are pre-provisioned. `.env` lists local development variables;
deployed Edge Function secrets come from Supabase project settings.
