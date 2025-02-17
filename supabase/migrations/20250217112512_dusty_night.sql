-- First, ensure we have no orphaned wallets
DELETE FROM user_wallets
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = user_wallets.user_id
);

-- Drop and recreate the foreign key with proper constraints
ALTER TABLE user_wallets
DROP CONSTRAINT IF EXISTS user_wallets_user_id_fkey;

ALTER TABLE user_wallets
ADD CONSTRAINT user_wallets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id
ON user_wallets(user_id);

-- Add helpful comment
COMMENT ON CONSTRAINT user_wallets_user_id_fkey ON user_wallets IS 'Foreign key relationship between user wallets and profiles';