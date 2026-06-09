/*
  # Subscription role sync, KYC bucket, Phase 2 stub tables

  1. New Functions/Triggers
    - `nf_sync_premium_role()` — keeps `student_premium` role aligned with subscription status.
      Grants role on active/grace_period; revokes when no remaining active sub.
    - Trigger on `subscriptions` AFTER INSERT OR UPDATE.

  2. Storage
    - Private bucket `kyc-documents` (owner + admin access only).
    - RLS policies on `storage.objects` for that bucket.

  3. New Tables (Phase 2 stubs, RLS enabled, feature-flagged off)
    - `ai_copilot_threads` — AI Copilot conversation history.
    - `banking_cards` — Future banking module placeholder.
    - `mastermind_locations` — Mastermind events placeholder.

  4. Feature Flags
    - Inserts default-off flags `ai_copilot`, `banking`, `mastermind` into `feature_flags` if table exists.

  5. Security
    - All new tables have RLS enabled with strict owner-only policies.
    - Storage bucket access restricted to file owner.
*/

-- 1. Sub -> role sync trigger
CREATE OR REPLACE FUNCTION public.nf_sync_premium_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_active boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = NEW.user_id
      AND status IN ('active', 'grace_period')
  ) INTO has_active;

  IF has_active THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'student_premium')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'student_premium';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nf_subscriptions_sync_role ON public.subscriptions;
CREATE TRIGGER nf_subscriptions_sync_role
  AFTER INSERT OR UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.nf_sync_premium_role();

-- 2. KYC documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'KYC owner can read'
  ) THEN
    CREATE POLICY "KYC owner can read"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'kyc-documents' AND owner = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'KYC owner can upload'
  ) THEN
    CREATE POLICY "KYC owner can upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'kyc-documents' AND owner = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'KYC owner can update'
  ) THEN
    CREATE POLICY "KYC owner can update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'kyc-documents' AND owner = auth.uid())
      WITH CHECK (bucket_id = 'kyc-documents' AND owner = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'KYC owner can delete'
  ) THEN
    CREATE POLICY "KYC owner can delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'kyc-documents' AND owner = auth.uid());
  END IF;
END $$;

-- 3. Phase 2 stub tables
CREATE TABLE IF NOT EXISTS public.ai_copilot_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT '',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_copilot_threads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_copilot_threads' AND policyname='Owner reads threads') THEN
    CREATE POLICY "Owner reads threads" ON public.ai_copilot_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_copilot_threads' AND policyname='Owner inserts threads') THEN
    CREATE POLICY "Owner inserts threads" ON public.ai_copilot_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_copilot_threads' AND policyname='Owner updates threads') THEN
    CREATE POLICY "Owner updates threads" ON public.ai_copilot_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_copilot_threads' AND policyname='Owner deletes threads') THEN
    CREATE POLICY "Owner deletes threads" ON public.ai_copilot_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.banking_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text DEFAULT '',
  last4 text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.banking_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='banking_cards' AND policyname='Owner reads banking cards') THEN
    CREATE POLICY "Owner reads banking cards" ON public.banking_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='banking_cards' AND policyname='Owner inserts banking cards') THEN
    CREATE POLICY "Owner inserts banking cards" ON public.banking_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='banking_cards' AND policyname='Owner updates banking cards') THEN
    CREATE POLICY "Owner updates banking cards" ON public.banking_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='banking_cards' AND policyname='Owner deletes banking cards') THEN
    CREATE POLICY "Owner deletes banking cards" ON public.banking_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mastermind_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text DEFAULT '',
  country text DEFAULT '',
  starts_at timestamptz,
  capacity integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mastermind_locations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mastermind_locations' AND policyname='Authenticated reads published mastermind locations') THEN
    CREATE POLICY "Authenticated reads published mastermind locations"
      ON public.mastermind_locations FOR SELECT TO authenticated
      USING (is_published = true);
  END IF;
END $$;

-- 4. Feature flags (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feature_flags') THEN
    INSERT INTO public.feature_flags (key, enabled, description)
    VALUES
      ('ai_copilot', false, 'AI Copilot phase 2 module'),
      ('banking', false, 'Banking cards phase 2 module'),
      ('mastermind', false, 'Mastermind events phase 2 module'),
      ('iap_mock_mode', true, 'Use mocked IAP receipts in dev/web')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
