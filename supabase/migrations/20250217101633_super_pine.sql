-- Add avatar_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url
ON profiles(avatar_url);

-- Add helpful comment
COMMENT ON COLUMN profiles.avatar_url IS 'URL of the user''s avatar image';