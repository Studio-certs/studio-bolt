-- First, ensure we have the correct table structure
ALTER TABLE profiles
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN full_name DROP NOT NULL,
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN blocked SET DEFAULT false,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create profiles for any existing users that don't have one
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  blocked,
  created_at,
  updated_at,
  headline,
  bio,
  location,
  website,
  linkedin_url,
  github_url,
  twitter_url,
  avatar_url
)
SELECT 
  users.id,
  users.email,
  COALESCE(users.raw_user_meta_data->>'full_name', ''),
  COALESCE(users.raw_user_meta_data->>'role', 'user')::user_role,
  COALESCE((users.raw_user_meta_data->>'blocked')::boolean, false),
  COALESCE(users.created_at, NOW()),
  NOW(),
  users.raw_user_meta_data->>'headline',
  users.raw_user_meta_data->>'bio',
  users.raw_user_meta_data->>'location',
  users.raw_user_meta_data->>'website',
  users.raw_user_meta_data->>'linkedin_url',
  users.raw_user_meta_data->>'github_url',
  users.raw_user_meta_data->>'twitter_url',
  users.raw_user_meta_data->>'avatar_url'
FROM auth.users
LEFT JOIN profiles ON users.id = profiles.id
WHERE profiles.id IS NULL;

-- Create wallets for any users that don't have one
INSERT INTO user_wallets (
  user_id,
  tokens,
  created_at,
  updated_at
)
SELECT 
  users.id,
  0,
  NOW(),
  NOW()
FROM auth.users
LEFT JOIN user_wallets ON users.id = user_wallets.user_id
WHERE user_wallets.user_id IS NULL;

-- Update user metadata for all users to ensure role and blocked status are set
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', COALESCE((SELECT role FROM profiles WHERE profiles.id = auth.users.id), 'user'),
  'blocked', COALESCE((SELECT blocked FROM profiles WHERE profiles.id = auth.users.id), false),
  'full_name', COALESCE((SELECT full_name FROM profiles WHERE profiles.id = auth.users.id), ''),
  'headline', COALESCE((SELECT headline FROM profiles WHERE profiles.id = auth.users.id), NULL),
  'bio', COALESCE((SELECT bio FROM profiles WHERE profiles.id = auth.users.id), NULL),
  'location', COALESCE((SELECT location FROM profiles WHERE profiles.id = auth.users.id), NULL),
  'website', COALESCE((SELECT website FROM profiles WHERE profiles.id = auth.users.id), NULL),
  'linkedin_url', COALESCE((SELECT linkedin_url FROM profiles WHERE profiles.id = auth.users.id), NULL),
  'github_url', COALESCE((SELECT github_url FROM profiles WHERE profiles.id = auth.users.id), NULL),
  'twitter_url', COALESCE((SELECT twitter_url FROM profiles WHERE profiles.id = auth.users.id), NULL),
  'avatar_url', COALESCE((SELECT avatar_url FROM profiles WHERE profiles.id = auth.users.id), NULL)
)
WHERE raw_user_meta_data IS NULL 
OR NOT raw_user_meta_data ? 'role' 
OR NOT raw_user_meta_data ? 'blocked';

-- Add helpful comment
COMMENT ON TABLE profiles IS 'User profiles including restored data';