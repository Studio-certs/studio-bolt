-- Add headline column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS headline TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_headline
ON profiles(headline);

-- Add helpful comment
COMMENT ON COLUMN profiles.headline IS 'User''s professional headline or short bio';