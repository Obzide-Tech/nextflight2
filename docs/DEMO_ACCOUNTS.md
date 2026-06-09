# Demo accounts

All demo users share the password **`NF_Demo2026!`** and live in the
`@nextflight.demo` email domain. Migration `008_seed_demo_accounts` creates them
idempotently; running it again is a no-op. Migration `025_seed_valeria_affiliate_only_demo`
adds the affiliate-only account.

| Email                          | Persona                   | Roles                                          | What you can demo                              |
| ------------------------------ | ------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `admin@nextflight.demo`        | Capitán Admin             | admin_owner, admin_finance, admin_content, admin_support, student_free | Full admin access — open `[app-url]/admin/dashboard` in a **desktop browser**. |
| `maria@nextflight.demo`        | María Fernández (premium) | student_premium                                | Active Apple subscription, ~67% Starter progress, open ticket. |
| `gabriela@nextflight.demo`     | Gabriela Ruiz (top affiliate) | affiliate, student_free                    | KYC approved, link `GAB10`, 4 referrals, ledger with paid + pending payouts. |
| `fernanda@nextflight.demo`     | Fernanda López (hybrid)   | student_premium, affiliate                     | Active Google subscription + affiliate profile. |
| `teresa@nextflight.demo`       | Teresa Mendoza (tutor)    | admin_content, student_free                    | Content editor / tutor persona.                |
| `carlos@nextflight.demo`       | Carlos Vega (referred)    | student_premium                                | Referred by Gabriela, confirmed sale.          |
| `ana@nextflight.demo`          | Ana Castillo (referred)   | student_premium                                | Referred by Gabriela, confirmed sale.          |
| `luis@nextflight.demo`         | Luis Romero (referred)    | student_free                                   | Referred by Gabriela, pending sale, support ticket. |
| `sofia@nextflight.demo`        | Sofía Herrera (churned)   | student_free                                   | Referred by Gabriela, expired subscription.    |
| `valeria@nextflight.demo`      | Valeria Soto (affiliate-only) | **affiliate only** (no student roles)      | Tests affiliate-only UI: no Lecciones tab, Terminal shows copilota dashboard, Cursos shows access gate. KYC approved, code `VAL10`, 3 referrals, $75 pending payout. |

## Admin panel access

The admin panel is **web-only**. To use it:

1. Open the app URL in a **desktop browser** (not mobile)
2. Navigate to `/admin/dashboard`
3. Log in with `admin@nextflight.demo` / `NF_Demo2026!`
4. You'll see the full sidebar with Dashboard, Payouts, Transacciones, Usuarios, Contenido, Tienda, Publicaciones, Notificaciones, Soporte, Auditoría, Ajustes

On mobile, admin users will see a "Panel de administración" button in the Mi cuenta tab (Aduana) that opens the web admin in the browser.

## Affiliate network for Gabriela

- Referral attributions: 4 (Carlos, Ana, Luis, Sofía).
- Confirmed sales: 2 ($29.99 each, $20.99 net).
- Pending sale: 1 (Luis).
- Expired/churned: 1 (Sofía).
- Payouts: 1 paid ($50, ref `NF-2026-0001`), 1 requested ($60).
- Wallet balance auto-recomputes via `nf_recompute_wallet` trigger.

## Affiliate network for Valeria (affiliate-only demo)

- Referral attributions: 3 (Carlos, Ana, Luis).
- Confirmed sales: 2.
- Pending sale: 1 (Luis).
- Payout request: $75 USD pending.
- **No enrollments or lesson_progress** — used to verify the student content gate.

## Role-based UI behavior

| Role combination | Lecciones tab | Terminal view | Aduana |
| --- | --- | --- | --- |
| student_free only | Visible | Student dashboard | Normal |
| student_premium only | Visible | Student dashboard | Normal |
| affiliate + student_* | Visible | Student dashboard | Normal |
| **affiliate only** | **Hidden** | **Copilota dashboard** | Normal |
| admin_* + student_* | Visible | Student dashboard | + Admin button |

## Resetting

Demo data is cumulative. To wipe and re-seed:

```sql
DELETE FROM auth.users WHERE email LIKE '%@nextflight.demo';
-- public-schema rows cascade via FKs.
```

Then re-run migrations 008 and 025 (or call `apply_migration` again with the same content).
