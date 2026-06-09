/*
  # Lesson videos bucket, avatars bucket, onboarding column

  1. Storage
    - Create private `lesson-videos` bucket for protected video files (signed URLs only).
    - Create public `avatars` bucket for user profile pictures.
    - RLS-style policies on `storage.objects` for these buckets.
  2. user_profiles
    - Add `onboarded_at` (timestamptz) column to track onboarding completion.
    - Add `notification_prefs` (jsonb) for push preferences.
    - Add `timezone` if missing.
  3. Notes
    - lesson-videos signed via the `sign-lesson-url` Edge Function which checks
      enrollment / active subscription before issuing a 60-second URL.
    - Avatars are public-read so the app can render them without signed URLs.
*/

-- Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-videos', 'lesson-videos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars: anyone can read, only owner can write to their folder (uid prefix).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_public_read'
  ) THEN
    CREATE POLICY avatars_public_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_owner_write'
  ) THEN
    CREATE POLICY avatars_owner_write ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND (split_part(name, '/', 1) = auth.uid()::text));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_owner_update'
  ) THEN
    CREATE POLICY avatars_owner_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (split_part(name, '/', 1) = auth.uid()::text))
      WITH CHECK (bucket_id = 'avatars' AND (split_part(name, '/', 1) = auth.uid()::text));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_owner_delete'
  ) THEN
    CREATE POLICY avatars_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND (split_part(name, '/', 1) = auth.uid()::text));
  END IF;

  -- lesson-videos: NO public access. Only service role (via sign-lesson-url) reads.
  -- We do not add SELECT policies; this means RLS denies all direct reads,
  -- forcing access through the Edge Function which uses service_role to sign.
END $$;

-- user_profiles columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarded_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notification_prefs'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notification_prefs jsonb DEFAULT '{"push": true, "email": true, "announcements": true}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN timezone text DEFAULT 'America/Mexico_City';
  END IF;
END $$;
