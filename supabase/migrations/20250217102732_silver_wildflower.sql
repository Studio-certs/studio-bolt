-- First, ensure we have no orphaned transactions
DELETE FROM transactions
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = transactions.user_id
);

-- Drop and recreate the foreign key with proper constraints
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
ON transactions(user_id);

-- Add helpful comment
COMMENT ON CONSTRAINT transactions_user_id_fkey ON transactions IS 'Foreign key relationship between transactions and user profiles';