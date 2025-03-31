/*
  # Update Payment Success Handler

  1. Changes
    - Update handle_payment_success function to include token_type_id parameter
    - Add token_type_id to payment_transactions insert
    - Ensure parameters match edge function
*/

-- Drop existing function
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
    transaction_time,
    token_type_id,
    tokens
  ) VALUES (
    p_user_id,
    p_amount,
    'completed',
    p_stripe_checkout_id,
    NOW(),
    p_token_type_id,
    p_tokens
  );

  -- Update user's wallet
  INSERT INTO user_wallets (
    user_id,
    tokens,
    token_type_id,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_tokens,
    p_token_type_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, token_type_id) 
  DO UPDATE SET
    tokens = user_wallets.tokens + EXCLUDED.tokens,
    updated_at = NOW();

  RETURN true;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION handle_payment_success IS 'Handles successful payment processing and token allocation';