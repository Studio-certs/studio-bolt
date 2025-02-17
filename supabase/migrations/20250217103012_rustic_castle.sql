-- First, ensure RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "transactions_read" ON transactions;
DROP POLICY IF EXISTS "transactions_admin" ON transactions;
DROP POLICY IF EXISTS "wallet_read" ON user_wallets;
DROP POLICY IF EXISTS "wallet_update" ON user_wallets;

-- Create policies for transactions
CREATE POLICY "transactions_read" ON transactions
FOR SELECT USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "transactions_admin" ON transactions
FOR INSERT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for user wallets
CREATE POLICY "wallet_read" ON user_wallets
FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "wallet_update" ON user_wallets
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle payment success
CREATE OR REPLACE FUNCTION handle_payment_success(
  p_user_id UUID,
  p_amount DECIMAL,
  p_tokens INTEGER,
  p_stripe_checkout_id TEXT
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
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION handle_payment_success IS 'Handles successful payment processing and token allocation';
COMMENT ON POLICY "transactions_read" ON transactions IS 'Users can view their own transactions, admins can view all';
COMMENT ON POLICY "transactions_admin" ON transactions IS 'Only admins can create transactions';
COMMENT ON POLICY "wallet_read" ON user_wallets IS 'Users can view their own wallet, admins can view all';
COMMENT ON POLICY "wallet_update" ON user_wallets IS 'Only admins can update wallets';