/*
  # NextFlight Academy — Core Schema (Fase 1)

  Esquema base completo del ecosistema NextFlight: usuarios y roles, catálogo de
  programas/cursos/módulos/lecciones, recursos, progreso, notas, suscripciones,
  pagos store (Apple/Google), afiliados con wallet ledger, payouts, KYC, soporte,
  anuncios, FAQs, auditoría, notificaciones, feature flags y settings.

  ## Tablas creadas
  - user_profiles, user_roles
  - products_programs, courses, course_modules, course_lessons, lesson_assets
  - enrollments, lesson_progress, lesson_notes
  - subscriptions, store_purchases, payment_methods, payment_transactions
  - affiliate_profiles, affiliate_links, referral_attributions
  - commission_ledger, wallet_balances, payout_requests
  - kyc_profiles, kyc_documents
  - announcements, faq_items, support_tickets, support_messages
  - audit_logs, app_notifications, feature_flags, system_settings

  ## Seguridad
  - RLS habilitado en TODAS las tablas
  - Función helper nf_is_admin para chequear roles administrativos
  - Aislamiento total entre afiliados
  - Privacidad de notas (solo dueño)
  - Acceso público a contenido publicado (programas, cursos, anuncios, FAQs)

  ## Notas
  1. Tabla maestra de usuarios = auth.users (Supabase Auth)
  2. Una cuenta soporta múltiples roles simultáneamente
  3. Saldo afiliado se calcula desde commission_ledger (fuente de verdad)
  4. wallet_balances funciona como cache para queries rápidas
*/

-- ============================================================================
-- USER ROLES (creada primero porque la usa el helper nf_is_admin)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'student_free','student_premium','affiliate',
    'admin_owner','admin_finance','admin_content','admin_support'
  )),
  granted_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION nf_is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = uid
      AND role IN ('admin_owner', 'admin_finance', 'admin_content', 'admin_support')
  );
$$;

CREATE OR REPLACE FUNCTION nf_has_role(uid uuid, target_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = uid AND role = target_role
  );
$$;

CREATE POLICY "Users read own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update roles"
  ON user_roles FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete roles"
  ON user_roles FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

-- ============================================================================
-- USER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  country text DEFAULT '',
  city text DEFAULT '',
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'es',
  notification_prefs jsonb DEFAULT '{"push": true, "email": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR nf_is_admin(auth.uid()));

CREATE POLICY "Users insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR nf_is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete profiles"
  ON user_profiles FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

-- ============================================================================
-- CATALOG: PROGRAMS, COURSES, MODULES, LESSONS, ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS products_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  description text DEFAULT '',
  cover_url text DEFAULT '',
  tier text NOT NULL DEFAULT 'premium' CHECK (tier IN ('free','premium')),
  affiliate_enabled boolean DEFAULT true,
  default_commission_rate numeric(5,4) DEFAULT 0.30,
  apple_product_id text DEFAULT '',
  google_product_id text DEFAULT '',
  price_usd numeric(10,2) DEFAULT 0,
  is_published boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read published programs"
  ON products_programs FOR SELECT TO authenticated
  USING (is_published = true OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert programs"
  ON products_programs FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update programs"
  ON products_programs FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete programs"
  ON products_programs FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES products_programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read courses"
  ON courses FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM products_programs p WHERE p.id = program_id AND (p.is_published OR nf_is_admin(auth.uid())))
  );

CREATE POLICY "Admins insert courses"
  ON courses FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update courses"
  ON courses FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete courses"
  ON courses FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read modules"
  ON course_modules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN products_programs p ON p.id = c.program_id
      WHERE c.id = course_id AND (p.is_published OR nf_is_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins insert modules"
  ON course_modules FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update modules"
  ON course_modules FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete modules"
  ON course_modules FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  video_storage_path text DEFAULT '',
  video_external_url text DEFAULT '',
  duration_seconds integer DEFAULT 0,
  is_free boolean DEFAULT false,
  tutor_name text DEFAULT '',
  tutor_title text DEFAULT '',
  tutor_avatar_url text DEFAULT '',
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read lessons"
  ON course_lessons FOR SELECT TO authenticated
  USING (is_published = true OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert lessons"
  ON course_lessons FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update lessons"
  ON course_lessons FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete lessons"
  ON course_lessons FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS lesson_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('pdf','template','resource','link')),
  storage_path text DEFAULT '',
  external_url text DEFAULT '',
  size_bytes bigint DEFAULT 0,
  is_premium_only boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read assets"
  ON lesson_assets FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins insert assets"
  ON lesson_assets FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update assets"
  ON lesson_assets FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete assets"
  ON lesson_assets FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

-- ============================================================================
-- ENROLLMENTS, PROGRESS, NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES products_programs(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  source text DEFAULT 'direct',
  UNIQUE (user_id, program_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own enrollments"
  ON enrollments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Users insert own enrollment"
  ON enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins update enrollments"
  ON enrollments FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete enrollments"
  ON enrollments FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  position_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  last_watched_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress"
  ON lesson_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Users insert own progress"
  ON lesson_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON lesson_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own progress"
  ON lesson_progress FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  content text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notes"
  ON lesson_notes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notes"
  ON lesson_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own notes"
  ON lesson_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notes"
  ON lesson_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- SUBSCRIPTIONS, STORE PURCHASES, PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid REFERENCES products_programs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','grace_period','on_hold','cancelled','expired')),
  platform text DEFAULT '' CHECK (platform IN ('','apple','google','manual','paypal','stripe')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert subscriptions"
  ON subscriptions FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update subscriptions"
  ON subscriptions FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete subscriptions"
  ON subscriptions FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS store_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('apple','google')),
  product_id text NOT NULL,
  transaction_id text NOT NULL,
  original_transaction_id text,
  purchase_date timestamptz NOT NULL,
  expires_date timestamptz,
  is_renewing boolean DEFAULT true,
  raw_receipt jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (platform, transaction_id)
);

ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own store purchases"
  ON store_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert store purchases"
  ON store_purchases FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update store purchases"
  ON store_purchases FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete store purchases"
  ON store_purchases FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('card','paypal','apple_pay','google_pay','klarna','afterpay')),
  brand text DEFAULT '',
  last4 text DEFAULT '',
  email_masked text DEFAULT '',
  exp_month integer,
  exp_year integer,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payment methods"
  ON payment_methods FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Users insert own payment methods"
  ON payment_methods FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own payment methods"
  ON payment_methods FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own payment methods"
  ON payment_methods FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid REFERENCES products_programs(id) ON DELETE SET NULL,
  affiliate_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  platform text NOT NULL CHECK (platform IN ('apple','google','paypal','stripe','manual')),
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  net_amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  store_fee_usd numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','refunded','failed','chargeback','expired')),
  external_ref text DEFAULT '',
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own transactions"
  ON payment_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert transactions"
  ON payment_transactions FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update transactions"
  ON payment_transactions FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete transactions"
  ON payment_transactions FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

-- ============================================================================
-- AFFILIATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_terms_at timestamptz,
  terms_version text DEFAULT 'v1',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','revoked')),
  payout_provider text DEFAULT 'paypal' CHECK (payout_provider IN ('paypal','stripe_connect','payoneer','manual')),
  payout_email text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate reads own profile"
  ON affiliate_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR nf_is_admin(auth.uid()));

CREATE POLICY "Affiliate inserts own profile"
  ON affiliate_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Affiliate updates own profile"
  ON affiliate_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR nf_is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete affiliate profiles"
  ON affiliate_profiles FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  program_id uuid REFERENCES products_programs(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate reads own links"
  ON affiliate_links FOR SELECT TO authenticated
  USING (auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Affiliate inserts own links"
  ON affiliate_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = affiliate_user_id);

CREATE POLICY "Affiliate updates own links"
  ON affiliate_links FOR UPDATE TO authenticated
  USING (auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()))
  WITH CHECK (auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete links"
  ON affiliate_links FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS referral_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  link_id uuid REFERENCES affiliate_links(id) ON DELETE SET NULL,
  attribution_model text DEFAULT 'last_click',
  attributed_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate reads own attributions"
  ON referral_attributions FOR SELECT TO authenticated
  USING (auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert attributions"
  ON referral_attributions FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update attributions"
  ON referral_attributions FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete attributions"
  ON referral_attributions FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
  payout_request_id uuid,
  entry_type text NOT NULL CHECK (entry_type IN ('accrual','retention','release','withdrawal','reversal','adjustment')),
  amount_usd numeric(10,2) NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','confirmed','retained','available','withdrawal_requested','processing','paid','failed','reversed')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate reads own ledger"
  ON commission_ledger FOR SELECT TO authenticated
  USING (auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert ledger"
  ON commission_ledger FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update ledger"
  ON commission_ledger FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete ledger"
  ON commission_ledger FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS wallet_balances (
  affiliate_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pending_usd numeric(10,2) DEFAULT 0,
  available_usd numeric(10,2) DEFAULT 0,
  retained_usd numeric(10,2) DEFAULT 0,
  paid_usd numeric(10,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate reads own wallet"
  ON wallet_balances FOR SELECT TO authenticated
  USING (auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert wallet"
  ON wallet_balances FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update wallet"
  ON wallet_balances FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete wallet"
  ON wallet_balances FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd numeric(10,2) NOT NULL,
  provider text NOT NULL DEFAULT 'paypal',
  destination text DEFAULT '',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','processing','paid','failed','rejected','reversed')),
  error_message text DEFAULT '',
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  external_ref text DEFAULT ''
);

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate reads own payouts"
  ON payout_requests FOR SELECT TO authenticated
  USING (auth.uid() = affiliate_user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Affiliate creates own payout"
  ON payout_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = affiliate_user_id);

CREATE POLICY "Admins update payouts"
  ON payout_requests FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete payouts"
  ON payout_requests FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

-- ============================================================================
-- KYC
-- ============================================================================

CREATE TABLE IF NOT EXISTS kyc_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name text DEFAULT '',
  document_type text DEFAULT '',
  document_number text DEFAULT '',
  country text DEFAULT '',
  date_of_birth date,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','pending','approved','rejected')),
  reviewed_at timestamptz,
  reviewer_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own kyc"
  ON kyc_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR nf_is_admin(auth.uid()));

CREATE POLICY "User inserts own kyc"
  ON kyc_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "User updates own kyc"
  ON kyc_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR nf_is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete kyc"
  ON kyc_profiles FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  doc_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own kyc docs"
  ON kyc_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "User uploads own kyc docs"
  ON kyc_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User deletes own kyc docs"
  ON kyc_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins update kyc docs"
  ON kyc_documents FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

-- ============================================================================
-- ANNOUNCEMENTS, FAQS, SUPPORT
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text DEFAULT '',
  cover_url text DEFAULT '',
  published_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read announcements"
  ON announcements FOR SELECT TO authenticated
  USING (is_published = true OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert announcements"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update announcements"
  ON announcements FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete announcements"
  ON announcements FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read faqs"
  ON faq_items FOR SELECT TO authenticated
  USING (is_published = true OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert faqs"
  ON faq_items FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update faqs"
  ON faq_items FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete faqs"
  ON faq_items FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
  priority text DEFAULT 'normal',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tickets"
  ON support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Users create own tickets"
  ON support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tickets"
  ON support_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete tickets"
  ON support_tickets FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_staff boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read messages of their tickets"
  ON support_messages FOR SELECT TO authenticated
  USING (
    nf_is_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users send messages on their tickets"
  ON support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      nf_is_admin(auth.uid()) OR
      EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    )
  );

CREATE POLICY "Admins delete messages"
  ON support_messages FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

-- ============================================================================
-- AUDIT, NOTIFICATIONS, FLAGS, SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  before_value jsonb,
  after_value jsonb,
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit"
  ON audit_logs FOR SELECT TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE POLICY "Admins insert audit"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()) OR actor_id = auth.uid());

CREATE TABLE IF NOT EXISTS app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text DEFAULT '',
  link text DEFAULT '',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON app_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR nf_is_admin(auth.uid()));

CREATE POLICY "Users update own notifications"
  ON app_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins insert notifications"
  ON app_notifications FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete notifications"
  ON app_notifications FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  enabled boolean DEFAULT false,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read flags"
  ON feature_flags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins write flags"
  ON feature_flags FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update flags"
  ON feature_flags FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete flags"
  ON feature_flags FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read settings"
  ON system_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins write settings"
  ON system_settings FOR INSERT TO authenticated
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins update settings"
  ON system_settings FOR UPDATE TO authenticated
  USING (nf_is_admin(auth.uid()))
  WITH CHECK (nf_is_admin(auth.uid()));

CREATE POLICY "Admins delete settings"
  ON system_settings FOR DELETE TO authenticated
  USING (nf_is_admin(auth.uid()));

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_program ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_assets_module ON lesson_assets(module_id);
CREATE INDEX IF NOT EXISTS idx_assets_lesson ON lesson_assets(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON lesson_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_store_user ON store_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_affiliate ON payment_transactions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_links_affiliate ON affiliate_links(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_attr_affiliate ON referral_attributions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_affiliate ON commission_ledger(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON payout_requests(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_msgs_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON app_notifications(user_id);
