# Outbound payout rails — open decision

## Constraint

Apple and Google handle inbound subscription payments natively. Neither offers a
payout/disbursement API for affiliate commissions. The user has explicitly **ruled
out PayPal**. This means outbound money movement must use a separate rail.

## Current behavior

Implemented as **internal admin-managed credit**:

- Affiliate submits `payout_requests` with status `requested` (UI in
  `app/(app)/payout-request.tsx`, edge function `request-payout`).
- KYC must be `approved` before submission.
- Admin reviews via admin web (next sprint) and calls `admin-process-payout`:
  - `approve` — moves to `approved`.
  - `mark_paid` — moves to `paid`, writes a `withdrawal` ledger entry that
    reduces `wallet_balances`, optionally with an `external_ref` (bank transfer
    confirmation, etc).
  - `reject` — moves to `rejected` with a reason.
- Affiliate receives an `app_notifications` row + (when push tokens exist) Expo
  Push notification.

This works today and is auditable, but the actual money movement happens **off
platform**, manually.

## Options to evaluate

| Rail              | Coverage                      | Notes                                                          |
| ----------------- | ----------------------------- | -------------------------------------------------------------- |
| Wise Business API | Strong LATAM + EU             | Per-transfer fees, KYC manageable, decent docs.                |
| Stripe Connect    | Mostly US/EU, limited LATAM   | Excellent UX, weak in many of our affiliate countries.         |
| Payoneer          | Strong LATAM, freelancer base | Rougher API, but payees already have accounts.                 |
| Manual bank wires | Universal                     | Cheap but operationally painful at scale.                      |

## Recommendation

For launch keep the internal credit flow. Add Wise Business as the first automated
rail in a follow-up sprint once volume justifies integration cost. Stripe Connect
remains an option for US/EU affiliates if the network shifts.

## Decision needed from product

- Pick the first automated rail (or stay manual).
- Confirm the minimum payout threshold ($50 USD currently in code).
- Confirm currency handling (USD only vs local currency).
