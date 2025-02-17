-- Create profiles for any existing users that don't have one
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  blocked,
  created_at,
  updated_at
)
SELECT 
  users.id,
  users.email,
  COALESCE(users.raw_user_meta_data->>'full_name', ''),
  'user',
  false,
  COALESCE(users.created_at, NOW()),
  NOW()
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
  'blocked', COALESCE((SELECT blocked FROM profiles WHERE profiles.id = auth.users.id), false)
)
WHERE raw_user_meta_data IS NULL 
OR NOT raw_user_meta_data ? 'role' 
OR NOT raw_user_meta_data ? 'blocked';

-- Add helpful comment
COMMENT ON TABLE profiles IS 'User profiles including those created for existing users';