-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_payment_success(uuid, decimal, integer, text);

-- Create updated function with token_type_id parameter
CREATE OR REPLACE FUNCTION handle_payment_success(
  p_user_id UUID,
  p_amount DECIMAL,
  p_tokens INTEGER,
  p_stripe_checkout_id TEXT,
  p_token_type_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Record the payment transaction
  INSERT INTO payment_transactions (
    user_id,
    amount,
    status,
    stripe_checkout_id,
    transaction_time
  ) VALUES (
    p_user_id,
    p_amount,
    'completed',
    p_stripe_checkout_id,
    NOW()
  );

  -- Update user's wallet
  UPDATE user_wallets
  SET 
    tokens = tokens + p_tokens,
    token_type_id = p_token_type_id,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION handle_payment_success IS 'Handles successful payment processing and token allocation with token type';