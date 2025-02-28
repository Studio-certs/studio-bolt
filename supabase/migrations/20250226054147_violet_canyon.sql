-- Add wallet address to profiles table
ALTER TABLE profiles
ADD COLUMN wallet_address TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address
ON profiles(wallet_address);

-- Add helpful comment
COMMENT ON COLUMN profiles.wallet_address IS 'The user''s blockchain wallet address';
