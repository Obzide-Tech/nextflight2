
-- Remove all demo/test affiliate accounts except:
--   Capitán Admin   (36ddb4e5-25b1-4c7d-88c4-cab60639a916)
--   María Fernández (b366014f-cb8b-4b15-a4ab-ade57c84ffb4)

DO $$
DECLARE
  ids_to_delete uuid[] := ARRAY[
    '42f47561-632f-429b-b320-c5c5cda51d9f'::uuid,  -- Egbert Wetherborne
    '3b0d9aee-804d-4f9c-a227-309c8bacffe1'::uuid,  -- Fernanda López (demo)
    'a2ce0a7e-2afb-4b4a-92a6-58308f938842'::uuid,  -- Gabriela Ruiz (demo)
    '73cf3703-9f42-46c9-8075-d28c40f1dbb1'::uuid,  -- Valeria Soto (demo)
    'fbb90ad7-e534-4e43-a609-38beab096d1b'::uuid,  -- Maria vasquez mgvm1693
    'ee6d379e-1e33-4403-acaa-23b6f2f52406'::uuid   -- Maria Vasquez mgvm1603
  ];
BEGIN
  -- Affiliate-specific data
  DELETE FROM commission_ledger     WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM referral_attributions WHERE affiliate_user_id = ANY(ids_to_delete)
                                      OR referred_user_id   = ANY(ids_to_delete);
  DELETE FROM affiliate_links       WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM affiliate_profiles    WHERE id                = ANY(ids_to_delete);
  DELETE FROM wallet_balances       WHERE affiliate_user_id = ANY(ids_to_delete);
  DELETE FROM payout_requests       WHERE affiliate_user_id = ANY(ids_to_delete);

  -- General user data
  DELETE FROM subscriptions         WHERE user_id = ANY(ids_to_delete);
  DELETE FROM payment_transactions  WHERE user_id = ANY(ids_to_delete);
  DELETE FROM store_purchases       WHERE user_id = ANY(ids_to_delete);
  DELETE FROM enrollments           WHERE user_id = ANY(ids_to_delete);
  DELETE FROM lesson_progress       WHERE user_id = ANY(ids_to_delete);
  DELETE FROM lesson_notes          WHERE user_id = ANY(ids_to_delete);
  DELETE FROM banking_cards         WHERE user_id = ANY(ids_to_delete);
  DELETE FROM payment_methods       WHERE user_id = ANY(ids_to_delete);
  DELETE FROM kyc_documents         WHERE user_id = ANY(ids_to_delete);
  DELETE FROM kyc_profiles          WHERE id      = ANY(ids_to_delete);
  DELETE FROM push_tokens           WHERE user_id = ANY(ids_to_delete);
  DELETE FROM app_notifications     WHERE user_id = ANY(ids_to_delete);
  DELETE FROM support_tickets       WHERE user_id = ANY(ids_to_delete);
  DELETE FROM ai_copilot_threads    WHERE user_id = ANY(ids_to_delete);

  -- Null out audit log actor references (preserve history)
  UPDATE admin_audit_log SET actor_id = NULL WHERE actor_id = ANY(ids_to_delete);

  DELETE FROM user_roles    WHERE user_id = ANY(ids_to_delete);
  DELETE FROM user_profiles WHERE id      = ANY(ids_to_delete);
  DELETE FROM auth.users    WHERE id      = ANY(ids_to_delete);
END $$;

-- Keep only ONE active code for María Fernández — remove all but MARAFE6AR8
DELETE FROM affiliate_links
WHERE affiliate_user_id = 'b366014f-cb8b-4b15-a4ab-ade57c84ffb4'
  AND code != 'MARAFE6AR8';
