-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with all required fields
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    blocked,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    false,
    NOW(),
    NOW()
  );

  -- Create wallet
  INSERT INTO user_wallets (
    user_id,
    tokens,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    0,
    NOW(),
    NOW()
  );

  -- Update user metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', 'user',
    'blocked', false
  )
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE LOG 'Error in handle_new_user for user ID % (email: %): %', NEW.id, NEW.email, SQLERRM;
  RAISE LOG 'Error details: %', SQLSTATE;
  -- Re-raise the error to fail the transaction properly
  RAISE;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

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

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';