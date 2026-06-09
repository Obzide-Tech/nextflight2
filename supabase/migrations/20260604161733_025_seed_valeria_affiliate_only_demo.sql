/*
  # Seed Valeria Soto — affiliate-only demo account

  ## Summary
  Adds a single demo account with ONLY the `affiliate` role (no `student_free`,
  no `student_premium`). This account is specifically for testing the
  affiliate-only experience: the Lecciones tab is hidden, the Terminal shows
  the copilota dashboard, and Cursos shows the access-gate screen.

  ## New demo account
  - Email:     valeria@nextflight.demo
  - Password:  NF_Demo2026!
  - Name:      Valeria Soto
  - Country:   Venezuela / Caracas
  - Roles:     affiliate  (NO student roles)
  - Affiliate: active, KYC approved, code VAL10
  - Referrals: 3 attributed referrals (carlos, ana, luis — reuses existing users)
  - Payout:    $75 USD pending withdrawal request

  ## Notes
  - Idempotent: uses IF NOT EXISTS / ON CONFLICT DO NOTHING guards.
  - Does NOT create enrollments or lesson_progress (intentional).
  - Program ID resolved dynamically by slug to avoid hardcoded UUID issues.
*/

DO $$
DECLARE
  v_demo_pw  text := crypt('NF_Demo2026!', gen_salt('bf'));

  v_valeria  uuid;
  v_carlos   uuid;
  v_ana      uuid;
  v_luis     uuid;
  v_link     uuid;
  v_premium  uuid;
BEGIN
  -- Resolve premium program dynamically
  SELECT id INTO v_premium FROM public.products_programs
  WHERE tier = 'premium' LIMIT 1;

  -- Resolve existing referred users
  SELECT id INTO v_carlos FROM auth.users WHERE email = 'carlos@nextflight.demo';
  SELECT id INTO v_ana    FROM auth.users WHERE email = 'ana@nextflight.demo';
  SELECT id INTO v_luis   FROM auth.users WHERE email = 'luis@nextflight.demo';

  -- Create Valeria if she does not already exist
  SELECT id INTO v_valeria FROM auth.users WHERE email = 'valeria@nextflight.demo';
  IF v_valeria IS NULL THEN
    v_valeria := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_valeria, 'authenticated', 'authenticated',
      'valeria@nextflight.demo', v_demo_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Valeria Soto"}',
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_valeria, v_valeria::text,
      json_build_object('sub', v_valeria::text, 'email', 'valeria@nextflight.demo'),
      'email', now(), now(), now()
    );
  END IF;

  -- Profile
  INSERT INTO public.user_profiles (id, full_name, country, city, language)
  VALUES (v_valeria, 'Valeria Soto', 'Venezuela', 'Caracas', 'es')
  ON CONFLICT (id) DO NOTHING;

  -- Role: ONLY affiliate — no student roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_valeria, 'affiliate')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Affiliate profile: active, KYC approved
  INSERT INTO public.affiliate_profiles (id, status, accepted_terms_at, terms_version, payout_provider)
  VALUES (v_valeria, 'active', now() - interval '45 days', '2026-01', 'internal')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.kyc_profiles (
    id, legal_name, document_type, document_number,
    country, date_of_birth, status, reviewed_at
  ) VALUES (
    v_valeria, 'Valeria Beatriz Soto Morales', 'national_id', 'V-24567890',
    'Venezuela', '1994-09-12', 'approved', now() - interval '20 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Affiliate link with code VAL10
  SELECT id INTO v_link FROM public.affiliate_links WHERE code = 'VAL10';
  IF v_link IS NULL AND v_premium IS NOT NULL THEN
    v_link := gen_random_uuid();
    INSERT INTO public.affiliate_links (id, affiliate_user_id, code, program_id, is_active)
    VALUES (v_link, v_valeria, 'VAL10', v_premium, true);
  END IF;

  -- Referral attributions (reuses carlos, ana, luis)
  IF v_link IS NOT NULL THEN
    INSERT INTO public.referral_attributions (
      affiliate_user_id, referred_user_id, link_id,
      attribution_model, attributed_at, expires_at
    )
    SELECT v_valeria, ref_id, v_link, 'last_click',
           now() - ival, now() + interval '30 days'
    FROM (VALUES
      (v_carlos, interval '30 days'),
      (v_ana,    interval '18 days'),
      (v_luis,   interval  '5 days')
    ) AS t(ref_id, ival)
    WHERE ref_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;

  -- Payment transactions attributed to Valeria
  IF v_carlos IS NOT NULL AND v_premium IS NOT NULL THEN
    INSERT INTO public.payment_transactions (
      user_id, program_id, affiliate_user_id,
      platform, amount_usd, net_amount_usd, store_fee_usd,
      status, occurred_at
    ) VALUES
      (v_carlos, v_premium, v_valeria, 'apple', 29.99, 20.99, 9.00, 'confirmed', now() - interval '28 days'),
      (v_ana,    v_premium, v_valeria, 'apple', 29.99, 20.99, 9.00, 'confirmed', now() - interval '15 days'),
      (v_luis,   v_premium, v_valeria, 'apple', 29.99, 20.99, 9.00, 'pending',   now() - interval '3 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Payout request: $75 pending withdrawal
  IF NOT EXISTS (SELECT 1 FROM public.payout_requests WHERE affiliate_user_id = v_valeria) THEN
    INSERT INTO public.payout_requests (
      id, affiliate_user_id, amount_usd, provider,
      destination, status, requested_at
    ) VALUES (
      gen_random_uuid(), v_valeria, 75.00, 'internal',
      'Acreditación interna NextFlight', 'requested', now() - interval '2 days'
    );
  END IF;

  -- Audit log
  INSERT INTO public.admin_audit_log (actor_id, action, target_table, metadata)
  VALUES (v_valeria, 'demo.seed', 'auth.users',
    jsonb_build_object('seeded_at', now(), 'persona', 'valeria_affiliate_only'));

END $$;
