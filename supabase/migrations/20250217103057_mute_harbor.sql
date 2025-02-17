-- First, ensure we have the correct foreign key relationships
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
DROP CONSTRAINT IF EXISTS transactions_admin_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE,
ADD CONSTRAINT transactions_admin_id_fkey
  FOREIGN KEY (admin_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "transactions_read" ON transactions;
DROP POLICY IF EXISTS "transactions_admin" ON transactions;

-- Create new policies for transactions
CREATE POLICY "transactions_select" ON transactions
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  auth.uid() = admin_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "transactions_insert" ON transactions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle admin transactions
CREATE OR REPLACE FUNCTION handle_admin_transaction(
  p_user_id UUID,
  p_tokens INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin status
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  -- Create transaction record
  INSERT INTO transactions (
    user_id,
    admin_id,
    tokens
  ) VALUES (
    p_user_id,
    auth.uid(),
    p_tokens
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
COMMENT ON FUNCTION handle_admin_transaction IS 'Handles admin token allocation to users';
COMMENT ON POLICY "transactions_select" ON transactions IS 'Users can view their own transactions, admins can view all';
COMMENT ON POLICY "transactions_insert" ON transactions IS 'Only admins can create transactions';