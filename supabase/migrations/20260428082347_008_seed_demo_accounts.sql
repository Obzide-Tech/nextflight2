/*
  # Seed demo accounts + widen payout_provider constraint

  - Updates affiliate_profiles.payout_provider check constraint to include 'internal'.
  - Seeds 9 demo auth users + public-schema relationships (idempotent).
  - Password for every demo account: NF_Demo2026!
*/

-- Widen payout_provider to allow 'internal' (admin-managed acreditación)
ALTER TABLE public.affiliate_profiles DROP CONSTRAINT IF EXISTS affiliate_profiles_payout_provider_check;
ALTER TABLE public.affiliate_profiles ADD CONSTRAINT affiliate_profiles_payout_provider_check
  CHECK (payout_provider = ANY (ARRAY['paypal','stripe_connect','payoneer','manual','internal']));

DO $$
DECLARE
  v_starter uuid := '36a3d500-a33f-442c-bc7f-2e60b72cbdce';
  v_premium uuid := '91ed055c-7e49-4d94-af47-ce27eb4eb12b';
  v_demo_pw text := crypt('NF_Demo2026!', gen_salt('bf'));

  v_admin uuid;
  v_maria uuid;
  v_gabriela uuid;
  v_fernanda uuid;
  v_teresa uuid;
  v_carlos uuid;
  v_ana uuid;
  v_luis uuid;
  v_sofia uuid;

  v_link uuid;
  v_lesson record;
  v_completed integer := 0;
BEGIN
  SELECT id INTO v_admin FROM auth.users WHERE email = 'admin@nextflight.demo';
  IF v_admin IS NULL THEN
    v_admin := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated', 'admin@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Capitán Admin"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin, v_admin::text, json_build_object('sub', v_admin::text, 'email', 'admin@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_maria FROM auth.users WHERE email = 'maria@nextflight.demo';
  IF v_maria IS NULL THEN
    v_maria := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_maria, 'authenticated', 'authenticated', 'maria@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"María Fernández"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_maria, v_maria::text, json_build_object('sub', v_maria::text, 'email', 'maria@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_gabriela FROM auth.users WHERE email = 'gabriela@nextflight.demo';
  IF v_gabriela IS NULL THEN
    v_gabriela := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_gabriela, 'authenticated', 'authenticated', 'gabriela@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Gabriela Ruiz"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_gabriela, v_gabriela::text, json_build_object('sub', v_gabriela::text, 'email', 'gabriela@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_fernanda FROM auth.users WHERE email = 'fernanda@nextflight.demo';
  IF v_fernanda IS NULL THEN
    v_fernanda := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_fernanda, 'authenticated', 'authenticated', 'fernanda@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fernanda López"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_fernanda, v_fernanda::text, json_build_object('sub', v_fernanda::text, 'email', 'fernanda@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_teresa FROM auth.users WHERE email = 'teresa@nextflight.demo';
  IF v_teresa IS NULL THEN
    v_teresa := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_teresa, 'authenticated', 'authenticated', 'teresa@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Teresa Mendoza"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_teresa, v_teresa::text, json_build_object('sub', v_teresa::text, 'email', 'teresa@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_carlos FROM auth.users WHERE email = 'carlos@nextflight.demo';
  IF v_carlos IS NULL THEN
    v_carlos := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_carlos, 'authenticated', 'authenticated', 'carlos@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Vega"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_carlos, v_carlos::text, json_build_object('sub', v_carlos::text, 'email', 'carlos@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_ana FROM auth.users WHERE email = 'ana@nextflight.demo';
  IF v_ana IS NULL THEN
    v_ana := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_ana, 'authenticated', 'authenticated', 'ana@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Castillo"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_ana, v_ana::text, json_build_object('sub', v_ana::text, 'email', 'ana@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_luis FROM auth.users WHERE email = 'luis@nextflight.demo';
  IF v_luis IS NULL THEN
    v_luis := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_luis, 'authenticated', 'authenticated', 'luis@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Luis Romero"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_luis, v_luis::text, json_build_object('sub', v_luis::text, 'email', 'luis@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  SELECT id INTO v_sofia FROM auth.users WHERE email = 'sofia@nextflight.demo';
  IF v_sofia IS NULL THEN
    v_sofia := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_sofia, 'authenticated', 'authenticated', 'sofia@nextflight.demo', v_demo_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sofía Herrera"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_sofia, v_sofia::text, json_build_object('sub', v_sofia::text, 'email', 'sofia@nextflight.demo'), 'email', now(), now(), now());
  END IF;

  INSERT INTO public.user_profiles (id, full_name, country, city, language) VALUES
    (v_admin,    'Capitán Admin',     'México', 'Ciudad de México', 'es'),
    (v_maria,    'María Fernández',   'México', 'Guadalajara',      'es'),
    (v_gabriela, 'Gabriela Ruiz',     'Colombia', 'Medellín',       'es'),
    (v_fernanda, 'Fernanda López',    'Argentina', 'Buenos Aires',  'es'),
    (v_teresa,   'Teresa Mendoza',    'España',  'Madrid',          'es'),
    (v_carlos,   'Carlos Vega',       'Perú',    'Lima',            'es'),
    (v_ana,      'Ana Castillo',      'Chile',   'Santiago',        'es'),
    (v_luis,     'Luis Romero',       'Ecuador', 'Quito',           'es'),
    (v_sofia,    'Sofía Herrera',     'Uruguay', 'Montevideo',      'es')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES
    (v_admin,    'admin_owner'),
    (v_admin,    'admin_finance'),
    (v_admin,    'admin_content'),
    (v_admin,    'admin_support'),
    (v_admin,    'student_free'),
    (v_maria,    'student_free'),
    (v_maria,    'student_premium'),
    (v_gabriela, 'student_free'),
    (v_gabriela, 'affiliate'),
    (v_fernanda, 'student_free'),
    (v_fernanda, 'student_premium'),
    (v_fernanda, 'affiliate'),
    (v_teresa,   'admin_content'),
    (v_teresa,   'student_free'),
    (v_carlos,   'student_free'),
    (v_carlos,   'student_premium'),
    (v_ana,      'student_free'),
    (v_ana,      'student_premium'),
    (v_luis,     'student_free'),
    (v_sofia,    'student_free')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.affiliate_profiles (id, status, accepted_terms_at, terms_version, payout_provider) VALUES
    (v_gabriela, 'active', now() - interval '60 days', '2026-01', 'internal'),
    (v_fernanda, 'active', now() - interval '15 days', '2026-01', 'internal')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.kyc_profiles (id, legal_name, document_type, document_number, country, date_of_birth, status, reviewed_at)
  VALUES (v_gabriela, 'Gabriela María Ruiz Henao', 'national_id', 'CC1023456789', 'Colombia', '1992-04-18', 'approved', now() - interval '30 days')
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO v_link FROM public.affiliate_links WHERE code = 'GAB10';
  IF v_link IS NULL THEN
    v_link := gen_random_uuid();
    INSERT INTO public.affiliate_links (id, affiliate_user_id, code, program_id, is_active)
    VALUES (v_link, v_gabriela, 'GAB10', v_premium, true);
  END IF;

  INSERT INTO public.enrollments (user_id, program_id, source) VALUES
    (v_admin,    v_starter, 'admin'),
    (v_maria,    v_starter, 'organic'),
    (v_maria,    v_premium, 'apple'),
    (v_gabriela, v_starter, 'organic'),
    (v_fernanda, v_starter, 'organic'),
    (v_fernanda, v_premium, 'google'),
    (v_teresa,   v_starter, 'admin'),
    (v_carlos,   v_starter, 'referral'),
    (v_carlos,   v_premium, 'apple'),
    (v_ana,      v_starter, 'referral'),
    (v_ana,      v_premium, 'apple'),
    (v_luis,     v_starter, 'referral'),
    (v_sofia,    v_starter, 'referral')
  ON CONFLICT (user_id, program_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, program_id, status, platform, current_period_start, current_period_end)
  VALUES
    (v_maria,    v_premium, 'active',  'apple',  now() - interval '12 days', now() + interval '18 days'),
    (v_fernanda, v_premium, 'active',  'google', now() - interval '5 days',  now() + interval '25 days'),
    (v_carlos,   v_premium, 'active',  'apple',  now() - interval '20 days', now() + interval '10 days'),
    (v_ana,      v_premium, 'active',  'apple',  now() - interval '8 days',  now() + interval '22 days'),
    (v_sofia,    v_premium, 'expired', 'apple',  now() - interval '90 days', now() - interval '60 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.referral_attributions (affiliate_user_id, referred_user_id, link_id, attribution_model, attributed_at, expires_at)
  VALUES
    (v_gabriela, v_carlos, v_link, 'last_click', now() - interval '25 days', now() + interval '5 days'),
    (v_gabriela, v_ana,    v_link, 'last_click', now() - interval '12 days', now() + interval '18 days'),
    (v_gabriela, v_luis,   v_link, 'last_click', now() - interval '7 days',  now() + interval '23 days'),
    (v_gabriela, v_sofia,  v_link, 'last_click', now() - interval '85 days', now() - interval '55 days')
  ON CONFLICT DO NOTHING;

  -- payment_transactions.status allowed: pending, confirmed, refunded, failed, chargeback, expired
  INSERT INTO public.payment_transactions (user_id, program_id, affiliate_user_id, platform, amount_usd, net_amount_usd, store_fee_usd, status, occurred_at)
  VALUES
    (v_carlos, v_premium, v_gabriela, 'apple',  29.99, 20.99, 9.00,  'confirmed', now() - interval '20 days'),
    (v_ana,    v_premium, v_gabriela, 'apple',  29.99, 20.99, 9.00,  'confirmed', now() - interval '8 days'),
    (v_luis,   v_premium, v_gabriela, 'apple',  29.99, 20.99, 9.00,  'pending',   now() - interval '2 days'),
    (v_sofia,  v_premium, v_gabriela, 'apple',  29.99, 20.99, 9.00,  'expired',   now() - interval '80 days')
  ON CONFLICT DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.payout_requests WHERE affiliate_user_id = v_gabriela) THEN
    INSERT INTO public.payout_requests (id, affiliate_user_id, amount_usd, provider, destination, status, requested_at, processed_at, external_ref)
    VALUES
      (gen_random_uuid(), v_gabriela, 50.00, 'internal', 'Acreditación interna NextFlight', 'paid', now() - interval '15 days', now() - interval '12 days', 'NF-2026-0001'),
      (gen_random_uuid(), v_gabriela, 60.00, 'internal', 'Acreditación interna NextFlight', 'requested', now() - interval '1 day', null, null);

    INSERT INTO public.commission_ledger (affiliate_user_id, payout_request_id, entry_type, amount_usd, state, notes)
    SELECT v_gabriela, id, 'withdrawal', -50.00, 'confirmed', 'Acreditación interna · ref NF-2026-0001'
    FROM public.payout_requests WHERE affiliate_user_id = v_gabriela AND status = 'paid' LIMIT 1;
  END IF;

  v_completed := 0;
  FOR v_lesson IN
    SELECT cl.id
    FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE c.program_id = v_starter
    ORDER BY cm.display_order, cl.display_order
  LOOP
    EXIT WHEN v_completed >= 11;
    INSERT INTO public.lesson_progress (user_id, lesson_id, completed, completed_at, last_watched_at)
    VALUES (v_maria, v_lesson.id, true, now() - (v_completed || ' days')::interval, now() - (v_completed || ' days')::interval)
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
    v_completed := v_completed + 1;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM public.support_tickets WHERE user_id = v_maria) THEN
    INSERT INTO public.support_tickets (user_id, subject, status, priority)
    VALUES (v_maria, 'No puedo descargar la bitácora del módulo 2', 'open', 'normal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.support_tickets WHERE user_id = v_luis) THEN
    INSERT INTO public.support_tickets (user_id, subject, status, priority)
    VALUES (v_luis, 'Mi suscripción no se activó tras pagar en Apple', 'in_progress', 'high');
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, target_table, metadata)
  VALUES (v_admin, 'demo.seed', 'auth.users', jsonb_build_object('seeded_at', now(), 'count', 9));
END $$;
