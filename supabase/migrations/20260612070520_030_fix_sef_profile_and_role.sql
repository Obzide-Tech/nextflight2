DO $$
DECLARE
  sef_id uuid := '1f5bd4fc-40ec-4b0c-bab5-35c663b7ec0a';
BEGIN
  INSERT INTO public.user_profiles (id, full_name, accepted_terms_at, terms_version)
  VALUES (sef_id, 'Sef Ejemplo', now(), 'v1')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (sef_id, 'student_free')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
