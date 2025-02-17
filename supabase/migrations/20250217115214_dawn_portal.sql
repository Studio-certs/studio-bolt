-- First, ensure we have the correct table structure
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_admin_id_fkey,
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- Add proper foreign key constraints
ALTER TABLE transactions
ADD CONSTRAINT transactions_admin_id_fkey
  FOREIGN KEY (admin_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL,
ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_admin_id
ON transactions(admin_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id
ON transactions(user_id);

-- Add helpful comments
COMMENT ON CONSTRAINT transactions_admin_id_fkey ON transactions IS 'Foreign key relationship between transactions and admin profiles';
COMMENT ON CONSTRAINT transactions_user_id_fkey ON transactions IS 'Foreign key relationship between transactions and user profiles';