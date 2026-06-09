/*
  # Phase 2: Kartra, Rewardful, T&C, and Feature Flags

  1. Modified Tables
    - `user_profiles`
      - `accepted_terms_at` (timestamptz) - When user accepted T&C
      - `terms_version` (text, default 'v1') - Which T&C version was accepted
    - `affiliate_profiles`
      - `rewardful_affiliate_id` (text) - External ID from Rewardful API
      - `kartra_contact_id` (text) - External ID from Kartra CRM

  2. New System Settings
    - `terms_version_current` - Current active T&C version
    - `terms_content` - T&C text content (placeholder)
    - `privacy_policy_content` - Privacy policy text (placeholder)
    - `kartra_helpdesk_url` - Kartra helpdesk embed/redirect URL
    - `rewardful_campaign_id` - Default Rewardful campaign ID

  3. New Feature Flags
    - `kartra_helpdesk_enabled` - Toggle Kartra helpdesk integration
    - `kartra_crm_sync_enabled` - Toggle Kartra CRM contact sync
    - `rewardful_enabled` - Toggle Rewardful affiliate engine
    - `native_iap_enabled` - Toggle native IAP (vs mock mode)

  4. Important Notes
    - All new columns are nullable to avoid breaking existing data
    - Feature flags default to false (off) until API keys are configured
    - T&C placeholder text will be replaced with final legal copy
*/

-- 1. Add T&C fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'accepted_terms_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN accepted_terms_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'terms_version'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN terms_version text DEFAULT 'v1';
  END IF;
END $$;

-- 2. Add Rewardful external ID to affiliate_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_profiles' AND column_name = 'rewardful_affiliate_id'
  ) THEN
    ALTER TABLE affiliate_profiles ADD COLUMN rewardful_affiliate_id text;
  END IF;
END $$;

-- 3. Add Kartra contact ID to affiliate_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_profiles' AND column_name = 'kartra_contact_id'
  ) THEN
    ALTER TABLE affiliate_profiles ADD COLUMN kartra_contact_id text;
  END IF;
END $$;

-- 4. Add Kartra contact ID to user_profiles for CRM sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'kartra_contact_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN kartra_contact_id text;
  END IF;
END $$;

-- 5. Insert new system_settings (skip if already exists)
INSERT INTO system_settings (key, value, description)
VALUES
  ('terms_version_current', '"v1"', 'Current active Terms & Conditions version'),
  ('terms_content', '"Estos son los Terminos y Condiciones de NextFlight Academy. El contenido legal definitivo sera proporcionado por el equipo legal de NextFlight. Por favor contacta soporte para mas informacion."', 'Terms & Conditions text content'),
  ('privacy_policy_content', '"Esta es la Politica de Privacidad de NextFlight Academy. El contenido legal definitivo sera proporcionado por el equipo legal de NextFlight. Por favor contacta soporte para mas informacion."', 'Privacy Policy text content'),
  ('kartra_helpdesk_url', '""', 'Kartra helpdesk URL for support integration'),
  ('rewardful_campaign_id', '""', 'Default Rewardful campaign ID for affiliate tracking')
ON CONFLICT (key) DO NOTHING;

-- 6. Insert new feature_flags (skip if already exists)
INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('kartra_helpdesk_enabled', false, 'Enable Kartra helpdesk integration for support tickets'),
  ('kartra_crm_sync_enabled', false, 'Enable Kartra CRM contact sync on signup and purchase'),
  ('rewardful_enabled', false, 'Enable Rewardful as the affiliate engine (replaces built-in)'),
  ('native_iap_enabled', false, 'Enable native Apple/Google in-app purchases (disable for web testing)')
ON CONFLICT (key) DO NOTHING;
