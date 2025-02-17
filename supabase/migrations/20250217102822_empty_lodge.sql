-- First, ensure we have no orphaned payment transactions
DELETE FROM payment_transactions
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = payment_transactions.user_id
);

-- Drop and recreate the foreign key with proper constraints
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;

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