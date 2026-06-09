/*
  # Fix program price to $697 and commission rate to 90%

  ## Summary
  Updates the live data for NextFlight Academy's program pricing and affiliate
  commission rate to match the official launch values.

  ## Changes

  ### 1. Program price
  - Sets `price_usd = 697.00` on the premium/paid program row(s) in
    `products_programs`. This is a single payment (not monthly), branded
    "Vuelo Comercial NextFlight — Precio de Lanzamiento: $697".

  ### 2. Commission rate
  - Sets `default_commission_rate = 0.90` (90%) on all program rows.
    The previous seed value of 0.30 (30%) has been superseded by the client.

  ### Notes
  - The seed migrations (002, 003) that originally wrote 0.30 are historical
    records and are not touched. This migration corrects the live DB state.
  - The `products_programs` table `price_usd` column is used directly by
    aduana.tsx to display the upgrade price to users — no app code change
    needed for the price itself; only the label suffix ("/mes") is updated
    separately in the UI.
*/

-- Update commission rate to 90% for all programs
UPDATE products_programs
SET default_commission_rate = 0.90,
    updated_at = now()
WHERE default_commission_rate IS NOT NULL;

-- Update the paid program price to $697 (single payment, launch price)
-- Targets any premium-tier or paid program (price > 0)
UPDATE products_programs
SET price_usd = 697.00,
    updated_at = now()
WHERE tier IN ('premium', 'starter') AND price_usd > 0;

-- Also catch any program that was seeded with the old $29.99 monthly price
UPDATE products_programs
SET price_usd = 697.00,
    updated_at = now()
WHERE price_usd = 29.99;
