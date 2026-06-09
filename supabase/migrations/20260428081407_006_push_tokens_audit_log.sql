/*
  # Push tokens + admin audit log

  1. New Tables
    - `push_tokens` — stores Expo push tokens per user device.
    - `admin_audit_log` — append-only log of admin actions.

  2. Security
    - RLS enabled. Owner-only on push_tokens. Admin-only read on admin_audit_log.
*/

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_token text NOT NULL,
  platform text DEFAULT 'unknown',
  device_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, expo_token)
);
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_tokens' AND policyname='Owner reads push tokens') THEN
    CREATE POLICY "Owner reads push tokens" ON public.push_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_tokens' AND policyname='Owner inserts push tokens') THEN
    CREATE POLICY "Owner inserts push tokens" ON public.push_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_tokens' AND policyname='Owner deletes push tokens') THEN
    CREATE POLICY "Owner deletes push tokens" ON public.push_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text DEFAULT '',
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='Admins read audit log') THEN
    CREATE POLICY "Admins read audit log" ON public.admin_audit_log FOR SELECT TO authenticated
      USING (public.nf_is_admin(auth.uid()));
  END IF;
END $$;
