-- First, ensure we have no orphaned transactions
DELETE FROM transactions
WHERE admin_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = transactions.admin_id
);

-- Drop and recreate the foreign key with proper constraints
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_admin_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_admin_id_fkey
FOREIGN KEY (admin_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_admin_id
ON transactions(admin_id);

-- Add helpful comment
COMMENT ON CONSTRAINT transactions_admin_id_fkey ON transactions IS 'Foreign key relationship between transactions and admin profiles';