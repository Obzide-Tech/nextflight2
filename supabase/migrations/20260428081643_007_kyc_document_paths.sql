/*
  # KYC document storage paths

  1. Changes
    - Add `front_document_path` and `back_document_path` text columns to `kyc_profiles`.
    - Both nullable, default empty string. Used to reference uploaded files in `kyc-documents` bucket.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='kyc_profiles' AND column_name='front_document_path') THEN
    ALTER TABLE public.kyc_profiles ADD COLUMN front_document_path text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='kyc_profiles' AND column_name='back_document_path') THEN
    ALTER TABLE public.kyc_profiles ADD COLUMN back_document_path text DEFAULT '';
  END IF;
END $$;
