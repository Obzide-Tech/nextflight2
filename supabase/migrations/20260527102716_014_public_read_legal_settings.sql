/*
  # Allow public (anon) read of legal content keys in system_settings

  The legal pages (terms, privacy, refund policy, etc.) are accessible before
  login. They load their content from system_settings via the Supabase anon key.
  The existing SELECT policy only covers `authenticated` role, so unauthenticated
  visitors get an empty result — causing the "El contenido de este documento sera
  proporcionado..." fallback to show.

  Changes:
  - Add SELECT policy for `anon` role restricted to the 8 legal content keys only.
    No other rows in system_settings are exposed to unauthenticated users.
*/

CREATE POLICY "Public read legal content keys"
  ON system_settings
  FOR SELECT
  TO anon
  USING (
    key IN (
      'terms_content',
      'privacy_policy_content',
      'refund_policy_content',
      'income_disclaimer_content',
      'conduct_content',
      'affiliate_agreement_content',
      'affiliate_guidelines_content',
      'enrollment_agreement_content'
    )
  );
