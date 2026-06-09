/*
  # Migration 024 — Store Products, Publications Expansion & Kartra Live

  ## Summary
  This migration activates Kartra CRM sync, adds a full store products catalog for
  custom Stripe checkouts (merch, services, events), expands the announcements table
  into a rich publications board, and registers all required feature flags and settings.

  ## New Tables
  - `store_products` — catalog of purchasable items (merch, services, events) sold
    via custom Stripe Checkout Sessions (outside of native IAP)

  ## Modified Tables
  - `announcements` — new columns: category, cta_url, cta_label, is_pinned,
    author_label to support a full publications board
  - `payment_transactions` — new column: store_product_id for tracking which store
    product generated each Stripe transaction

  ## New Feature Flags
  - `store_enabled` — shows/hides the Tienda vitrina in the user app
  - `store_kartra_tags` — applies Kartra tags on store purchase completion

  ## New System Settings
  - `stripe_success_url` — redirect URL after successful Stripe checkout
  - `stripe_cancel_url` — redirect URL on cancelled checkout

  ## Kartra Activation
  - Sets `kartra_crm_sync_enabled = true`
  - Sets `kartra_helpdesk_enabled = true`

  ## Security
  - RLS enabled on store_products with public read for active products
  - Admin write access only via service role (edge functions)
*/

-- ─────────────────────────────────────────────
-- 1. STORE PRODUCTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL DEFAULT '',
  description     text NOT NULL DEFAULT '',
  price_usd       numeric(10,2) NOT NULL DEFAULT 0,
  image_url       text,
  category        text NOT NULL DEFAULT 'merch'
                  CHECK (category IN ('merch', 'service', 'event', 'experience')),
  is_active       boolean NOT NULL DEFAULT true,
  display_order   integer NOT NULL DEFAULT 0,
  stock_limit     integer,
  kartra_tag      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active products
CREATE POLICY "Authenticated users can read active store products"
  ON store_products FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ─────────────────────────────────────────────
-- 2. EXPAND ANNOUNCEMENTS TABLE (publications board)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'category'
  ) THEN
    ALTER TABLE announcements ADD COLUMN category text NOT NULL DEFAULT 'announcement'
      CHECK (category IN ('announcement', 'resource', 'event', 'article'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'cta_url'
  ) THEN
    ALTER TABLE announcements ADD COLUMN cta_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'cta_label'
  ) THEN
    ALTER TABLE announcements ADD COLUMN cta_label text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE announcements ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'author_label'
  ) THEN
    ALTER TABLE announcements ADD COLUMN author_label text NOT NULL DEFAULT 'El equipo NFA';
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 3. ADD store_product_id TO payment_transactions
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'store_product_id'
  ) THEN
    ALTER TABLE payment_transactions ADD COLUMN store_product_id uuid
      REFERENCES store_products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Allow 'stripe_checkout' as a platform value for store purchases
DO $$
BEGIN
  ALTER TABLE payment_transactions
    DROP CONSTRAINT IF EXISTS payment_transactions_platform_check;
  ALTER TABLE payment_transactions
    ADD CONSTRAINT payment_transactions_platform_check
    CHECK (platform IN ('apple', 'google', 'paypal', 'stripe', 'stripe_checkout', 'manual'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- ─────────────────────────────────────────────
-- 4. FEATURE FLAGS — new flags
-- ─────────────────────────────────────────────
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('store_enabled',       false, 'Muestra la vitrina Tienda en la app')
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (key, enabled, description) VALUES
  ('store_kartra_tags',   false, 'Aplica tags de Kartra al completar una compra en la tienda')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- 5. ACTIVATE KARTRA FLAGS
-- ─────────────────────────────────────────────
UPDATE feature_flags SET enabled = true, updated_at = now()
  WHERE key IN ('kartra_crm_sync_enabled', 'kartra_helpdesk_enabled');

-- ─────────────────────────────────────────────
-- 6. SYSTEM SETTINGS — Stripe redirect URLs
-- ─────────────────────────────────────────────
INSERT INTO system_settings (key, value, description) VALUES
  ('stripe_success_url', '"https://nextflightacademy.com/compra-exitosa"',
   'URL de redireccion tras pago exitoso en Stripe Checkout')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('stripe_cancel_url', '"https://nextflightacademy.com/tienda"',
   'URL de redireccion si el usuario cancela el pago en Stripe')
ON CONFLICT (key) DO NOTHING;
