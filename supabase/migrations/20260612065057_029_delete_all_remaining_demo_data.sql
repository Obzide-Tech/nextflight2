
-- Delete all remaining demo/seed users and their data
-- Keep: admin@nextflight.demo (36ddb4e5), maria@nextflight.demo (b366014f), sef@gmail.com (1f5bd4fc)

DO $$
DECLARE
  ids_to_delete uuid[] := ARRAY[
    '13d1ac98-6eab-46e7-bf6d-00303bd17b9e'::uuid,  -- luis@nextflight.demo
    '98122d88-7cec-4d52-8934-d9dd1bc0a860'::uuid,  -- sofia@nextflight.demo
    'f386e534-70bc-47c3-b539-4b019de3495c'::uuid,  -- ana@nextflight.demo
    '568cf99e-2ab4-4ae5-bc42-df96ff1d0048'::uuid,  -- carlos@nextflight.demo
    '05ce5b37-b47e-4b67-be0a-1af67f0ba0bf'::uuid,  -- teresa@nextflight.demo
    '4f1c61f7-a69b-4f26-8810-24fec995f884'::uuid   -- ejemplo@correo.com
  ];
BEGIN
  DELETE FROM lesson_progress      WHERE user_id = ANY(ids_to_delete);
  DELETE FROM lesson_notes         WHERE user_id = ANY(ids_to_delete);
  DELETE FROM enrollments          WHERE user_id = ANY(ids_to_delete);
  DELETE FROM subscriptions        WHERE user_id = ANY(ids_to_delete);
  DELETE FROM payment_transactions WHERE user_id = ANY(ids_to_delete);
  DELETE FROM payout_requests      WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM commission_ledger    WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM wallet_balances      WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM affiliate_links      WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM affiliate_profiles   WHERE id = ANY(ids_to_delete);
  DELETE FROM kyc_profiles         WHERE id = ANY(ids_to_delete);
  DELETE FROM kyc_documents        WHERE user_id = ANY(ids_to_delete);
  DELETE FROM referral_attributions WHERE referred_user_id = ANY(ids_to_delete);
  DELETE FROM referral_attributions WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM push_tokens          WHERE user_id = ANY(ids_to_delete);
  DELETE FROM app_notifications    WHERE user_id = ANY(ids_to_delete);
  DELETE FROM support_tickets      WHERE user_id = ANY(ids_to_delete);
  DELETE FROM store_purchases      WHERE user_id = ANY(ids_to_delete);
  DELETE FROM banking_cards        WHERE user_id = ANY(ids_to_delete);
  DELETE FROM payment_methods      WHERE user_id = ANY(ids_to_delete);
  DELETE FROM user_roles           WHERE user_id = ANY(ids_to_delete);
  DELETE FROM user_profiles        WHERE id = ANY(ids_to_delete);

  UPDATE admin_audit_log SET actor_id = NULL WHERE actor_id = ANY(ids_to_delete);

  DELETE FROM auth.users WHERE id = ANY(ids_to_delete);
END $$;
