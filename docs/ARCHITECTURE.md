# Architecture

## High-level

```
                    ┌──────────────────────────┐
                    │  Mobile app (Expo)       │
                    │  StoreKit 2 / Google     │
                    │  Billing in production   │
                    └──────────┬───────────────┘
                               │ Supabase JS
                               ▼
┌────────────┐    ┌──────────────────────────────────────┐    ┌──────────────────┐
│ Admin web  │◄──►│  Supabase                            │◄───│  Apple SSN V2    │
│ (Next.js)  │    │  Auth · Postgres · Storage · Edge fn │    │  Google RTDN     │
└────────────┘    └──────────────────────────────────────┘    └──────────────────┘
```

## Postgres schema (28+ tables, all RLS-protected)

Core domains:

- **Identity & access** — `auth.users`, `public.user_profiles`, `public.user_roles`.
  Roles: `student_free`, `student_premium`, `affiliate`, `admin_owner`,
  `admin_finance`, `admin_content`, `admin_support`. Helper RPC `nf_is_admin(uid)`.
- **Learning content** — `products_programs` → `courses` → `course_modules` →
  `course_lessons` → `lesson_assets`. `lesson_progress` and `lesson_notes` per user.
- **Subscriptions & purchases** — `store_purchases` (raw IAP receipts),
  `subscriptions` (canonical state per user × program × platform).
- **Affiliate ledger** — `affiliate_profiles`, `affiliate_links`, `kyc_profiles`,
  `referral_attributions` (last-click, 30-day window), `payment_transactions`,
  `commission_ledger` (source of truth), `wallet_balances` (cached view via trigger),
  `payout_requests`.
- **Comms & ops** — `announcements`, `faq_items`, `support_tickets`,
  `app_notifications`, `push_tokens`, `admin_audit_log`, `feature_flags`.
- **Phase 2 stubs (RLS on, flags off)** — `ai_copilot_threads`, `banking_cards`,
  `mastermind_locations`.

## Triggers (do the heavy lifting)

- `nf_capture_attribution` — assigns `referral_attributions` on signup using `?ref=` cookie.
- `nf_accrue_commission` — on confirmed `payment_transactions`, inserts ledger entries.
- `nf_ledger_after_change` → `nf_recompute_wallet` — keeps `wallet_balances` in sync.
- `nf_subscriptions_sync_role` — grants/revokes `student_premium` based on subscription
  status.

## Edge Functions

| Function                        | JWT  | Purpose                                                     |
| ------------------------------- | ---- | ----------------------------------------------------------- |
| `validate-apple-receipt`        | yes  | Persists Apple sandbox/prod transactions, upserts sub/role. |
| `validate-google-receipt`       | yes  | Same for Google Play.                                       |
| `request-payout`                | yes  | Internal-only payout request with KYC gate.                 |
| `admin-process-payout`          | yes  | Admin approves/rejects/mark-paid; writes ledger withdrawal. |
| `capture-attribution`           | no   | Public endpoint to capture `?ref=CODE` (deferred or live).  |
| `apple-server-notifications-v2` | no   | Apple SSN V2 webhook (decode JWS, reconcile sub state).     |
| `google-rtdn`                   | no   | Google RTDN Pub/Sub webhook (decode envelope, reconcile).   |
| `send-notification`             | yes  | Admin-only fan-out to in-app + Expo Push.                   |

## Storage

- `kyc-documents` — private bucket, owner-only RLS. KYC document images/PDFs.
- (More buckets to add: `course-assets`, `avatars`.)

## Frontend layers

- `lib/supabase.ts` — singleton Supabase client.
- `lib/data.ts` — typed read functions (single source of truth for screens).
- `contexts/AuthContext.tsx` — session, profile, roles, auto-enrollment.
- `hooks/useStorePurchase.ts` — platform-aware mock IAP (calls validate-* fns).
- `theme/tokens.ts` — design tokens consumed by every screen.

## Money flow (inbound + outbound)

```
Apple/Google IAP ──► validate-*-receipt ──► store_purchases + subscriptions + role
                                          └► payment_transactions (when applicable)
                                             └► commission_ledger (accrual trigger)
                                                └► wallet_balances (recompute trigger)

Affiliate request ──► request-payout ──► payout_requests(requested)
Admin approves    ──► admin-process-payout ──► payout_requests(approved → paid)
                                              └► commission_ledger (withdrawal entry)
```

Outbound payment rail is intentionally NOT automated — pending product decision
documented in `PAYOUT_RAILS.md`.
