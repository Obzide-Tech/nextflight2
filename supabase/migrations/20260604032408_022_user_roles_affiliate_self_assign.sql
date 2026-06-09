/*
  # Allow users to self-assign the affiliate role

  The existing INSERT policy on user_roles only allows admins to add roles.
  This blocks affiliate activation — users need to assign themselves the
  'affiliate' role when they opt into the Copilotos program.

  New policy
  - Authenticated users may INSERT a single row where:
    - user_id = their own auth.uid()  (cannot insert for others)
    - role = 'affiliate'              (cannot self-assign any other role)
  
  All other role assignments (student_free, student_premium, admin, etc.)
  remain admin-only via the existing policy.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles'
    AND policyname = 'Users self-assign affiliate role'
  ) THEN
    CREATE POLICY "Users self-assign affiliate role"
      ON user_roles FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND role = 'affiliate');
  END IF;
END $$;
