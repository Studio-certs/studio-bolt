-- First, ensure we have the correct table structure
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;

-- Add proper foreign key constraint
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
ON payment_transactions(user_id);

-- Add helpful comment
COMMENT ON CONSTRAINT payment_transactions_user_id_fkey ON payment_transactions IS 'Foreign key relationship between payment transactions and user profiles';