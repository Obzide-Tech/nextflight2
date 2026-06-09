/*
  # Affiliate Ledger Logic

  1. Functions
    - nf_recompute_wallet(uid): rebuilds wallet_balances row for an affiliate from commission_ledger
    - nf_capture_attribution(referred_uid, ref_code): records last-click attribution if a link exists
  2. Triggers
    - on commission_ledger insert/update/delete → recompute wallet_balances of affected affiliate
    - on payment_transactions confirmed insert → if affiliate_user_id present, write a confirmed accrual entry
  3. Notes
    - All wallet state derives from commission_ledger; never recompute on the fly elsewhere.
    - State machine respects: pending → confirmed/available → withdrawal_requested → paid.
*/

CREATE OR REPLACE FUNCTION nf_recompute_wallet(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending numeric := 0;
  v_available numeric := 0;
  v_retained numeric := 0;
  v_paid numeric := 0;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN state = 'pending' THEN amount_usd ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN state IN ('confirmed','available') THEN amount_usd ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN state = 'retained' THEN amount_usd ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN state = 'paid' THEN amount_usd ELSE 0 END), 0)
  INTO v_pending, v_available, v_retained, v_paid
  FROM commission_ledger
  WHERE affiliate_user_id = uid;

  INSERT INTO wallet_balances (affiliate_user_id, pending_usd, available_usd, retained_usd, paid_usd, updated_at)
  VALUES (uid, v_pending, v_available, v_retained, v_paid, now())
  ON CONFLICT (affiliate_user_id) DO UPDATE
    SET pending_usd = EXCLUDED.pending_usd,
        available_usd = EXCLUDED.available_usd,
        retained_usd = EXCLUDED.retained_usd,
        paid_usd = EXCLUDED.paid_usd,
        updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION nf_ledger_after_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM nf_recompute_wallet(OLD.affiliate_user_id);
  ELSE
    PERFORM nf_recompute_wallet(NEW.affiliate_user_id);
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_ledger_recompute ON commission_ledger;
CREATE TRIGGER trg_ledger_recompute
AFTER INSERT OR UPDATE OR DELETE ON commission_ledger
FOR EACH ROW EXECUTE FUNCTION nf_ledger_after_change();

CREATE OR REPLACE FUNCTION nf_accrue_commission()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_rate numeric := 0.30;
  v_amount numeric;
BEGIN
  IF NEW.affiliate_user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status <> 'confirmed' THEN RETURN NEW; END IF;

  IF NEW.program_id IS NOT NULL THEN
    SELECT default_commission_rate INTO v_rate FROM products_programs WHERE id = NEW.program_id;
    v_rate := COALESCE(v_rate, 0.30);
  END IF;

  v_amount := ROUND(COALESCE(NEW.net_amount_usd, NEW.amount_usd, 0) * v_rate, 2);

  IF v_amount <= 0 THEN RETURN NEW; END IF;

  -- avoid duplicates
  IF EXISTS (SELECT 1 FROM commission_ledger WHERE transaction_id = NEW.id AND entry_type = 'accrual') THEN
    RETURN NEW;
  END IF;

  INSERT INTO commission_ledger (affiliate_user_id, transaction_id, entry_type, amount_usd, state, notes)
  VALUES (NEW.affiliate_user_id, NEW.id, 'accrual', v_amount, 'confirmed', 'Auto-accrual from confirmed transaction');

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_accrue_commission ON payment_transactions;
CREATE TRIGGER trg_accrue_commission
AFTER INSERT OR UPDATE OF status ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION nf_accrue_commission();

-- Attribution capture (called from app/edge function on signup)
CREATE OR REPLACE FUNCTION nf_capture_attribution(referred_uid uuid, ref_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
  v_aff_uid uuid;
  v_window_days int := 30;
  v_attribution_id uuid;
BEGIN
  IF ref_code IS NULL OR ref_code = '' THEN RETURN NULL; END IF;

  SELECT id, affiliate_user_id INTO v_link_id, v_aff_uid
  FROM affiliate_links WHERE code = ref_code AND is_active = true;

  IF v_aff_uid IS NULL OR v_aff_uid = referred_uid THEN RETURN NULL; END IF;

  SELECT (value::text)::int INTO v_window_days FROM system_settings WHERE key = 'attribution_window_days';
  v_window_days := COALESCE(v_window_days, 30);

  INSERT INTO referral_attributions (affiliate_user_id, referred_user_id, link_id, attribution_model, attributed_at, expires_at)
  VALUES (v_aff_uid, referred_uid, v_link_id, 'last_click', now(), now() + (v_window_days || ' days')::interval)
  RETURNING id INTO v_attribution_id;

  RETURN v_attribution_id;
END $$;
