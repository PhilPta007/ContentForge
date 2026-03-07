-- ContentForge — Atomic Credit Operations
-- Fixes race conditions on credit balance updates

-- Atomic credit addition (for purchases/refunds)
-- Returns the new balance. Raises exception on failure.
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Atomic update with row lock
  UPDATE public.profiles
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Record transaction with accurate balance
  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id, v_new_balance);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit deduction (for generations)
-- Returns the new balance. Raises exception if insufficient credits.
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the row and check balance atomically
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: have %, need %', v_current_balance, p_amount;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.profiles
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id, balance_after)
  VALUES (p_user_id, -p_amount, p_type, p_description, p_reference_id, v_new_balance);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a reference_id already exists (idempotency)
CREATE OR REPLACE FUNCTION public.transaction_exists(p_reference_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.credit_transactions WHERE reference_id = p_reference_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
