-- Create profile for existing user
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
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  'user',
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE id = 'f65aa19f-fb68-4aec-a2b2-4154e9b95d77'
ON CONFLICT (id) DO NOTHING;

-- Create wallet for the user if it doesn't exist
INSERT INTO user_wallets (
  user_id,
  tokens,
  created_at,
  updated_at
)
VALUES (
  'f65aa19f-fb68-4aec-a2b2-4154e9b95d77',
  0,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE profiles IS 'User profiles including manually created ones';