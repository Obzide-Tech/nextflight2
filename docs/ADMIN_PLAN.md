# Admin web — implementation plan (deferred)

The admin app is intentionally **not** scaffolded inside this Expo project. It will
live in its own Next.js 15 repo, sharing the same Supabase project.

## Why a separate repo

- Different toolchain (Next.js + Tailwind/Radix vs Expo + StyleSheet).
- Independent deploy cadence (Vercel) and route prefixes (`admin.nextflight.app`).
- Avoids package.json conflicts (Webpack vs Metro vs Vite).
- Clearer access control: admin auth, distinct RLS policy review, audit boundary.

## Tech choices

- Next.js 15 App Router, TypeScript strict.
- Supabase JS server-side via `@supabase/ssr` for cookie-based auth.
- shadcn/ui or Radix primitives + Tailwind for the data-dense surfaces.
- TanStack Table for finance tables, TanStack Query for cache, Zod for forms.
- Drag-and-drop course/module editor: dnd-kit.

## Modules

1. **Login + admin gate** — uses Supabase Auth, blocks non-admins via `nf_is_admin`.
2. **Financial dashboard** — revenue by program, platform (Apple/Google), country;
   MRR, churn, refunds. Charts powered by `payment_transactions` + `subscriptions`.
3. **Content CRUD** — programs, courses, modules, lessons, assets. Drag-and-drop
   ordering, video URL or storage path, preview.
4. **Users & roles** — search, role assignment, suspend, see enrollments + activity.
5. **Affiliate ops** — view affiliates, networks, attributions, transactions, ledger.
6. **Payouts** — queue, approve/reject/mark paid via `admin-process-payout`.
7. **Support** — ticket list, replies, internal notes.
8. **Audit log** — append-only feed from `admin_audit_log`.
9. **Settings** — feature flags (`feature_flags` table), commission tiers, copy.
10. **Notifications composer** — calls `send-notification` edge function.

## RLS contract

The admin app calls Supabase with a normal authenticated user that holds an
`admin_*` role. RLS policies on every table should permit admins to read; mutating
operations route through edge functions to keep auditability (`admin_audit_log`).

## Open questions

- Hosting: Vercel vs Cloudflare Pages.
- Admin SSO (Google Workspace) once team grows.
- Whether financial reports need a snapshot table (precomputed) for performance.
